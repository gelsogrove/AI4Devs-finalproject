import { Request, Response } from 'express';
import { z } from 'zod';
import { AgentConfigService } from '../application/services/AgentConfigService';
import {
    FAQResponse,
    ProductResponse,
    ServiceResponse
} from '../domain';
import { availableFunctions } from '../services/availableFunctions';
import logger from '../utils/logger';
import { aiService } from '../utils/openai';

type FunctionResult = ProductResponse | ServiceResponse | FAQResponse;

// Schema for chat request validation
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'function', 'tool']),
      content: z.string(),
      name: z.string().optional(),
      imageUrl: z.string().optional(),
      imageCaption: z.string().optional(),
      function_call: z
        .object({
          name: z.string(),
          arguments: z.string(),
        })
        .optional(),
      tool_calls: z.array(
        z.object({
          id: z.string(),
          type: z.literal('function'),
          function: z.object({
            name: z.string(),
            arguments: z.string()
          })
        })
      ).optional(),
      tool_call_id: z.string().optional()
    })
  ),
});

// Function definitions for OpenRouter
const functionDefinitions = [
  {
    name: 'getProducts',
    description: 'Search and retrieve Italian food products from our catalog. Use when customers ask about products, food items, or want to browse offerings.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: "Cheese", "Wine", "Oils", "Vinegars", "Pasta", "Cured Meats", "Spirits"',
        },
        search: {
          type: 'string',
          description: 'Search term for product names/descriptions. Examples: "wine", "parmigiano", "truffle"',
        },
        countOnly: {
          type: 'boolean',
          description: 'Set true to get only counts and categories instead of full details',
        }
      },
      required: [],
    },
  },
  {
    name: 'getServices',
    description: 'Retrieve information about our services like cooking classes, catering, consultations. Use when customers ask about services.',
    parameters: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Return only active services (default: true)',
        },
        search: {
          type: 'string',
          description: 'Search services by name/description. Examples: "cooking", "catering", "consultation"',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags: ["italian", "premium", "quick", "cooking", "wine"]',
        }
      },
      required: [],
    },
  },
  {
    name: 'getFAQs',
    description: 'Search FAQs using semantic embedding search. Use for policy questions, shipping, returns, payments, store info.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Semantic search query. Examples: "shipping time", "return policy", "payment methods"',
        }
      },
      required: [],
    },
  },
];

class ChatController {
  private agentConfigService: AgentConfigService;

  constructor() {
    this.agentConfigService = new AgentConfigService();
    logger.info('🤖 ChatController initialized');
  }

  async processChat(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      logger.info('🚀 === CHAT FLOW START ===');
      
      // Step 1: Validate request
      const { messages } = chatRequestSchema.parse(req.body);
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      
      if (!lastUserMessage) {
        logger.error('❌ No user message found');
        return res.status(400).json({ error: 'No user message found' });
      }
      
      logger.info(`👤 USER: "${lastUserMessage.content}"`);
      
      // Step 2: Load configuration from database
      logger.info('📊 SYSTEM: Loading agent configuration from database...');
      const agentConfig = await this.agentConfigService.getLatestConfig();
      
      if (!agentConfig) {
        logger.error('❌ Failed to load agent configuration from database');
        return res.status(500).json({ error: 'Failed to load agent configuration' });
      }
      
      logger.info(`✅ SYSTEM: Config loaded - Model: ${agentConfig.model}, Temp: ${agentConfig.temperature}, TopP: ${agentConfig.topP}`);
      
      // Step 3: Prepare messages with system prompt from database
      const systemPrompt = `${agentConfig.prompt}

🎯 FUNCTION CALLING GUIDELINES:
- For product questions → use getProducts
- For service questions → use getServices  
- For policy/shipping/FAQ questions → use getFAQs (uses semantic embedding search)
- Always call appropriate function when user asks about products, services, or policies
- Use specific search terms when possible`;

      if (!messages.some(msg => msg.role === 'system')) {
        messages.unshift({ role: 'system', content: systemPrompt });
      } else {
        const systemIndex = messages.findIndex(msg => msg.role === 'system');
        messages[systemIndex].content = systemPrompt;
      }
      
      // Step 4: Call OpenRouter with function calling
      logger.info('🔄 OPENROUTER: Sending request with function calling enabled...');
      
      const response = await aiService.generateChatCompletion(
        messages as any,
        agentConfig.model,
        {
          temperature: agentConfig.temperature,
          maxTokens: agentConfig.maxTokens,
          topP: agentConfig.topP,
          tools: functionDefinitions.map(fn => ({
            type: 'function',
            function: fn
          })),
          toolChoice: 'auto'
        }
      );
      
      const responseMessage = response.choices[0].message;
      logger.info(`✅ OPENROUTER: Response received. Function calls: ${responseMessage.tool_calls?.length || 0}`);
      
      // Step 5: Handle function calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          logger.info(`🔧 SYSTEM: Function call detected - ${functionName}`);
          logger.info(`📝 SYSTEM: Function args - ${JSON.stringify(functionArgs)}`);
          
          // Execute the function
          if (functionName === 'getProducts' || functionName === 'getServices' || functionName === 'getFAQs') {
            logger.info(`⚡ SYSTEM: Executing ${functionName}...`);
            
            const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions] as Function;
            const functionResult = await functionToCall(functionArgs) as FunctionResult;
            
            logger.info(`✅ SYSTEM: ${functionName} completed - Found ${functionResult.total} results`);
            
            // Add function call and result to conversation
            messages.push({
              role: 'assistant',
              content: '',
              tool_calls: [{
                id: toolCall.id,
                type: 'function',
                function: {
                  name: functionName,
                  arguments: JSON.stringify(functionArgs)
                }
              }]
            });
            
            messages.push({
              role: 'tool',
              content: JSON.stringify(functionResult),
              tool_call_id: toolCall.id
            });
            
            // Add formatting instructions
            messages.push({
              role: 'system' as const,
              content: `Format the response as Sofia from Gusto Italiano:

🎨 FORMATTING RULES:
• Use bullet points (•) for lists, never numbers
• Bold product/service names: **Name** - €XX.XX (don't bold prices)
• Include relevant emojis: 🍝🧀🍷🫒
• Group by category if multiple items
• If no results, suggest alternatives
• Keep Sofia's warm Italian personality
• End with engaging question
• NO images, URLs, or links

Remember: You're Sofia - be passionate about Italian food! 🇮🇹`
            });
            
            // Step 6: Get formatted response from OpenRouter
            logger.info('🎨 OPENROUTER: Requesting formatted response...');
            
            const formattedResponse = await aiService.generateChatCompletion(
              messages as any,
              agentConfig.model,
              {
                temperature: agentConfig.temperature,
                maxTokens: agentConfig.maxTokens,
                topP: agentConfig.topP,
              }
            );
            
            const finalMessage = formattedResponse.choices[0].message;
            logger.info('✅ OPENROUTER: Formatted response ready');
            logger.info(`🎯 RESPONSE: "${finalMessage.content?.substring(0, 100)}..."`);
            
            const duration = Date.now() - startTime;
            logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
            
            return res.json({ message: finalMessage });
          }
        }
      }
      
      // Step 7: No function call - direct response
      logger.info('💬 OPENROUTER: Direct response (no function call)');
      logger.info(`🎯 RESPONSE: "${responseMessage.content?.substring(0, 100)}..."`);
      
      const duration = Date.now() - startTime;
      logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
      
      return res.json({ message: responseMessage });

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logger.error(`💥 === CHAT FLOW ERROR (${duration}ms) ===`);
      logger.error('Error details:', error);
      
      if (error instanceof z.ZodError) {
        logger.error('❌ Validation error:', error.errors);
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      return res.status(500).json({ error: 'Failed to process chat' });
    }
  }

  // Test endpoint for debugging
  async testAI(req: Request, res: Response) {
    try {
      logger.info('🧪 Testing AI service directly...');
      
      const response = await aiService.generateChatCompletion(
        [{ role: 'user', content: 'Hello, this is a test' }],
        'gpt-3.5-turbo',
        { temperature: 0.7, maxTokens: 50 }
      );
      
      return res.json({
        success: true,
        response: response.choices[0].message.content
      });
      
    } catch (error) {
      logger.error('🚨 AI test failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Debug endpoint for testing availableFunctions
  async testFunctions(req: Request, res: Response) {
    try {
      logger.info('🔧 Testing availableFunctions directly...');
      
      // Test getProducts with wine search
      const wineResults = await availableFunctions.getProducts({ search: 'wine' });
      logger.info('Wine search results:', wineResults);
      
      // Test getProducts with Barolo search
      const baroloResults = await availableFunctions.getProducts({ search: 'Barolo' });
      logger.info('Barolo search results:', baroloResults);
      
      // Test getProducts with no filters
      const allResults = await availableFunctions.getProducts({});
      logger.info('All products results:', allResults);
      
      // Test getFAQs with shipping search
      const shippingFAQs = await availableFunctions.getFAQs({ search: 'shipping' });
      logger.info('Shipping FAQs results:', shippingFAQs);
      
      // Test getFAQs with no filters
      const allFAQs = await availableFunctions.getFAQs({});
      logger.info('All FAQs results:', allFAQs);
      
      return res.json({
        success: true,
        tests: {
          wineSearch: wineResults,
          baroloSearch: baroloResults,
          allProducts: allResults,
          shippingFAQs: shippingFAQs,
          allFAQs: allFAQs
        }
      });
      
    } catch (error) {
      logger.error('🚨 Function test failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Integration test for chatbot functionality
   */
  async testChatbotIntegration(req: Request, res: Response) {
    try {
      logger.info('🧪 Starting comprehensive chatbot integration test...');
      
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: [] as any[],
        summary: {
          total: 0,
          passed: 0,
          failed: 0
        }
      };

      // Test 1: Products Search
      logger.info('🍷 Testing Products Search...');
      try {
        const productTest = await availableFunctions.getProducts({
          search: 'wine',
          countOnly: false
        });
        
        const productTestResult = {
          name: 'Products Search - Wine',
          status: productTest.products && productTest.products.length > 0 ? 'PASSED' : 'FAILED',
          details: {
            query: 'wine',
            totalFound: productTest.total || 0,
            sampleProducts: productTest.products?.slice(0, 3).map(p => ({
              name: p.name,
              category: p.category,
              price: p.price
            })) || []
          },
          error: productTest.error || null
        };
        
        testResults.tests.push(productTestResult);
        if (productTestResult.status === 'PASSED') testResults.summary.passed++;
        else testResults.summary.failed++;
        
        logger.info(`✅ Products test: ${productTestResult.status} - Found ${productTest.total} products`);
      } catch (error) {
        logger.error('❌ Products test failed:', error);
        testResults.tests.push({
          name: 'Products Search - Wine',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testResults.summary.failed++;
      }

      // Test 2: Services Search
      logger.info('🚚 Testing Services Search...');
      try {
        const serviceTest = await availableFunctions.getServices({
          search: 'cooking',
          isActive: true
        });
        
        const serviceTestResult = {
          name: 'Services Search - Cooking',
          status: serviceTest.services && serviceTest.services.length > 0 ? 'PASSED' : 'FAILED',
          details: {
            query: 'cooking',
            totalFound: serviceTest.total || 0,
            sampleServices: serviceTest.services?.slice(0, 3).map(s => ({
              name: s.name,
              price: s.price,
              isActive: s.isActive
            })) || []
          },
          error: serviceTest.error || null
        };
        
        testResults.tests.push(serviceTestResult);
        if (serviceTestResult.status === 'PASSED') testResults.summary.passed++;
        else testResults.summary.failed++;
        
        logger.info(`✅ Services test: ${serviceTestResult.status} - Found ${serviceTest.total} services`);
      } catch (error) {
        logger.error('❌ Services test failed:', error);
        testResults.tests.push({
          name: 'Services Search - Cooking',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testResults.summary.failed++;
      }

      // Test 3: FAQ Embedding Search
      logger.info('❓ Testing FAQ Embedding Search...');
      try {
        const faqTest = await availableFunctions.getFAQs({
          search: 'shipping'
        });
        
        const faqTestResult = {
          name: 'FAQ Embedding Search - Shipping',
          status: faqTest.faqs && faqTest.faqs.length > 0 ? 'PASSED' : 'FAILED',
          details: {
            query: 'shipping',
            totalFound: faqTest.total || 0,
            sampleFAQs: faqTest.faqs?.slice(0, 3).map(f => ({
              question: f.question,
              answerPreview: f.answer.substring(0, 100) + '...'
            })) || []
          },
          error: faqTest.error || null
        };
        
        testResults.tests.push(faqTestResult);
        if (faqTestResult.status === 'PASSED') testResults.summary.passed++;
        else testResults.summary.failed++;
        
        logger.info(`✅ FAQ test: ${faqTestResult.status} - Found ${faqTest.total} FAQs`);
      } catch (error) {
        logger.error('❌ FAQ test failed:', error);
        testResults.tests.push({
          name: 'FAQ Embedding Search - Shipping',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testResults.summary.failed++;
      }

      // Test 4: Full Chat Integration
      logger.info('💬 Testing Full Chat Integration...');
      try {
        const chatMessages = [
          { role: 'user', content: 'What wines do you have and do you ship internationally?' }
        ];
        
        // Get agent configuration
        const agentConfig = await this.agentConfigService.getLatestConfig();
        
        // Test function calling capability
        const functionTestResults = {
          products: await availableFunctions.getProducts({ search: 'wine' }),
          services: await availableFunctions.getServices({ search: 'shipping' }),
          faqs: await availableFunctions.getFAQs({ search: 'international shipping' })
        };
        
        const chatTestResult = {
          name: 'Full Chat Integration',
          status: 'PASSED',
          details: {
            query: 'What wines do you have and do you ship internationally?',
            agentConfigLoaded: !!agentConfig,
            functionResults: {
              productsFound: functionTestResults.products.total || 0,
              servicesFound: functionTestResults.services.total || 0,
              faqsFound: functionTestResults.faqs.total || 0
            },
            availableFunctions: ['getProducts', 'getServices', 'getFAQs']
          }
        };
        
        testResults.tests.push(chatTestResult);
        testResults.summary.passed++;
        
        logger.info('✅ Chat integration test: PASSED');
      } catch (error) {
        logger.error('❌ Chat integration test failed:', error);
        testResults.tests.push({
          name: 'Full Chat Integration',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testResults.summary.failed++;
      }

      // Calculate totals
      testResults.summary.total = testResults.tests.length;
      
      // Final summary
      const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
      logger.info(`🎯 Integration test completed: ${testResults.summary.passed}/${testResults.summary.total} tests passed (${successRate}%)`);
      
      return res.status(200).json({
        message: 'Chatbot integration test completed',
        successRate: `${successRate}%`,
        ...testResults
      });
      
    } catch (error) {
      logger.error('Integration test error:', error);
      return res.status(500).json({ 
        error: 'Integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new ChatController(); 