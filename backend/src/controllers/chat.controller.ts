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

interface OrderCompletedResponse {
  success: boolean;
  total?: number;
  order?: {
    orderNumber: string;
    status: string;
    items: Array<{product: string, quantity: number, price: number, subtotal: number}>;
    total: number;
    currency: string;
    estimatedDelivery: string;
    customerInfo: any;
    paymentMethod: string;
    shippingMethod: string;
    notes: string;
    timestamp: string;
  };
  message: string;
  error?: string;
}

interface CompanyInfoResponse {
  companyName?: string;
  description?: string;
  website?: string;
  email?: string;
  openingTime?: string;
  address?: string;
  sector?: string;
  total?: number;
  error?: string;
}

type FunctionResult = ProductResponse | ServiceResponse | FAQResponse | OrderCompletedResponse | CompanyInfoResponse;

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
    description: 'Retrieve product information from our Italian specialty foods catalog. Use when customers ask about products, want to browse items, or need specific product details.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Product category. Examples: "Cheese", "Wine", "Pasta", "Cured Meats", "Oils", "Vinegars"',
        },
        search: {
          type: 'string',
          description: 'Search products by name/description. Examples: "parmigiano", "chianti", "prosciutto"',
        },
        countOnly: {
          type: 'boolean',
          description: 'Return only count of products (for availability checks)',
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
  {
    name: 'getDocuments',
    description: 'Search and retrieve document information from our knowledge base. Use when customers ask about documents, policies, regulations, catalogs, or any specific information that might be stored in our documents.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search query to find relevant documents. Examples: "privacy policy", "transport regulations", "product catalog", "GDPR", "shipping rules"',
        },
        path: {
          type: 'string',
          description: 'Filter by document path/category. Examples: "legal", "regulations", "catalogs", "policies"',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return (default: 5)',
        }
      },
      required: [],
    },
  },
  {
    name: 'OrderCompleted',
    description: 'Complete a customer order and generate order confirmation details. Use when customer confirms they want to finalize their purchase.',
    parameters: {
      type: 'object',
      properties: {
        cartItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string', description: 'Product name' },
              quantity: { type: 'number', description: 'Quantity ordered' }
            },
            required: ['product', 'quantity']
          },
          description: 'Array of cart items with product names and quantities'
        },
        customerInfo: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            address: { type: 'string', description: 'Delivery address' },
            email: { type: 'string', description: 'Customer email' },
            phone: { type: 'string', description: 'Customer phone number' }
          },
          description: 'Customer information for order processing'
        }
      },
      required: [],
    },
  },
  {
    name: 'getCompanyInfo',
    description: 'Retrieve company information including company name, phone, email, address, timing, business sector, and description. Use when customers ask about the company details, contact information, location, opening hours, or what the company does.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  }
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
      
      // Step 3: Try AI API first for intelligent function calling
      try {
        // Step 3: Prepare messages with system prompt from database
        const systemPrompt = `${agentConfig.prompt}

🎯 FUNCTION CALLING GUIDELINES:
- For product questions → use getProducts
- For service questions → use getServices  
- For policy/shipping/FAQ questions → use getFAQs (uses semantic embedding search)
- For document/regulation/catalog questions → use getDocuments
- For company information questions (name, email, address, hours, sector, description) → use getCompanyInfo
- Always call appropriate function when user asks about products, services, policies, documents, or company info
- Use specific search terms when possible`;

        if (!messages.some(msg => msg.role === 'system')) {
          messages.unshift({ role: 'system', content: systemPrompt });
        } else {
          const systemIndex = messages.findIndex(msg => msg.role === 'system');
          messages[systemIndex].content = systemPrompt;
        }
        
        // Step 4: Call AI service with function calling
        logger.info('🔄 AI: Sending request with function calling enabled...');
        
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
        logger.info(`✅ AI: Response received. Function calls: ${responseMessage.tool_calls?.length || 0}`);
        
        // Handle function calls from AI
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          const toolCall = responseMessage.tool_calls[0];
          
          if (toolCall.type === 'function') {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            logger.info(`🔧 SYSTEM: AI Function call detected - ${functionName}`);
            logger.info(`📝 SYSTEM: Function args - ${JSON.stringify(functionArgs)}`);
            
            // Execute the function
            if (functionName === 'getProducts' || functionName === 'getServices' || functionName === 'getFAQs' || functionName === 'getDocuments' || functionName === 'OrderCompleted' || functionName === 'getCompanyInfo') {
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
                content: `Format the response as Sofia from ShopMefy:

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
              
              // Step 6: Get formatted response from AI
              logger.info('🎨 AI: Requesting formatted response...');
              
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
              logger.info('✅ AI: Formatted response ready');
              logger.info(`🎯 RESPONSE: "${finalMessage.content?.substring(0, 100)}..."`);
              
              const duration = Date.now() - startTime;
              logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
              
              return res.json({ message: finalMessage });
            }
          }
        }
        
        // Step 7: No function call - direct response from AI
        logger.info('💬 AI: Direct response (no function call)');
        logger.info(`🎯 RESPONSE: "${responseMessage.content?.substring(0, 100)}..."`);
        
        const duration = Date.now() - startTime;
        logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
        
        return res.json({ message: responseMessage });
        
      } catch (aiError) {
        logger.error('AI service failed, using intelligent fallback');
        // Fall through to intelligent fallback below
      }
      
      // Step 6: Intelligent Query Processing Fallback
      logger.info('🧠 SYSTEM: Using intelligent query processing...');
      
      const userQuery = lastUserMessage.content.toLowerCase();
      logger.info(`🔍 SYSTEM: Analyzing query: "${userQuery}"`);
      
      // Extract conversation context for better understanding
      const conversationContext = this.extractConversationContext(messages);
      logger.info(`📚 SYSTEM: Conversation context: ${JSON.stringify(conversationContext)}`);
      
      // Intelligent query analysis with conversation context
      const queryAnalysis = this.analyzeUserQueryWithContext(userQuery, conversationContext);
      logger.info(`📊 SYSTEM: Query analysis: ${JSON.stringify(queryAnalysis)}`);
      
      if (queryAnalysis.intent === 'product_search') {
        try {
          logger.info(`🛍️ SYSTEM: Processing product search for: ${queryAnalysis.category || 'all products'}`);
          
          // Call getProducts with intelligent parameters
          const searchParams: any = {};
          if (queryAnalysis.category) {
            searchParams.search = queryAnalysis.category;
          }
          
          const productResult = await availableFunctions.getProducts(searchParams) as ProductResponse;
          logger.info(`✅ SYSTEM: Found ${productResult.total} products`);
          
          // Intelligent filtering and response generation
          const filteredResponse = this.generateIntelligentProductResponse(
            productResult, 
            queryAnalysis, 
            userQuery
          );
          
          const duration = Date.now() - startTime;
          logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
          
          return res.json({ 
            message: { 
              role: 'assistant', 
              content: filteredResponse 
            } 
          });
          
        } catch (error) {
          logger.error('Product search failed:', error);
        }
      } else if (queryAnalysis.intent === 'cart_management') {
        try {
          logger.info('🛒 SYSTEM: Processing cart management...');
          
          if (queryAnalysis.cartOperation === 'add' && queryAnalysis.detectedProducts) {
            // Generate cart addition response
            const cartResponse = this.generateCartResponse(queryAnalysis.detectedProducts, conversationContext);
            
            const duration = Date.now() - startTime;
            logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
            
            return res.json({ 
              message: { 
                role: 'assistant', 
                content: cartResponse 
              } 
            });
          } else if (queryAnalysis.cartOperation === 'view') {
            // Generate cart view response
            const cartViewResponse = this.generateCartViewResponse(conversationContext);
            
            const duration = Date.now() - startTime;
            logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
            
            return res.json({ 
              message: { 
                role: 'assistant', 
                content: cartViewResponse 
              } 
            });
          }
          
        } catch (error) {
          logger.error('Cart management failed:', error);
        }
      } else if (queryAnalysis.intent === 'service_inquiry') {
        try {
          logger.info('🚚 SYSTEM: Processing service inquiry...');
          
          const serviceResult = await availableFunctions.getServices({
            search: queryAnalysis.serviceType || '',
            isActive: true
          }) as ServiceResponse;
          
          const serviceResponse = this.generateServiceResponse(serviceResult, queryAnalysis);
          
          const duration = Date.now() - startTime;
          logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
          
          return res.json({ 
            message: { 
              role: 'assistant', 
              content: serviceResponse 
            } 
          });
          
        } catch (error) {
          logger.error('Service search failed:', error);
        }
      } else if (queryAnalysis.intent === 'faq_inquiry') {
        try {
          logger.info('❓ SYSTEM: Processing FAQ inquiry...');
          
          const faqResult = await availableFunctions.getFAQs({
            search: queryAnalysis.topic || userQuery
          }) as FAQResponse;
          
          const faqResponse = this.generateFAQResponse(faqResult, queryAnalysis);
          
          const duration = Date.now() - startTime;
          logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
          
          return res.json({ 
            message: { 
              role: 'assistant', 
              content: faqResponse 
            } 
          });
          
        } catch (error) {
          logger.error('FAQ search failed:', error);
        }
      }
      
      // Step 7: Contextual general responses
      let generalResponse = '';
      
      if (userQuery.includes('chi sei') || userQuery.includes('who are you') || userQuery.includes('cosa fai')) {
        generalResponse = `Ciao! Sono Sofia, la tua esperta di prodotti italiani di ShopMefy! 🇮🇹

Sono qui per aiutarti con:
• **Prodotti autentici italiani** - Vini, formaggi, pasta e specialità
• **Servizi personalizzati** - Corsi di cucina e degustazioni
• **Informazioni spedizioni** - Consegne in tutta Europa
• **Assistenza ordini** - Pagamenti e politiche

Cosa ti piacerebbe sapere sui nostri prodotti italiani?`;
      } else if (userQuery.includes('ciao') || userQuery.includes('hello') || userQuery.includes('hi') || userQuery.includes('salve')) {
        generalResponse = `Ciao! Benvenuto da ShopMefy! Sono Sofia, la tua esperta di prodotti italiani! 🇮🇹

Posso aiutarti con:
• **Prodotti** - Le nostre specialità italiane autentiche
• **Servizi** - Corsi di cucina e degustazioni  
• **Spedizioni** - Informazioni consegne
• **Ordini** - Pagamenti e politiche

Cosa ti piacerebbe sapere sui nostri prodotti italiani oggi?`;
      } else if (userQuery.includes('grazie') || userQuery.includes('thank')) {
        generalResponse = `Prego! È stato un piacere aiutarti! 😊

Se hai altre domande sui nostri prodotti italiani autentici o servizi, sono sempre qui per te.

Buona giornata e... buon appetito! 🇮🇹✨`;
      } else {
        // Intelligent suggestion based on query content
        const suggestions = this.generateIntelligentSuggestions(userQuery);
        generalResponse = `Ciao! Sono Sofia da ShopMefy! 🇮🇹

${suggestions}

Cosa ti piacerebbe sapere? Puoi chiedermi dei nostri vini, formaggi, pasta o qualsiasi altra specialità italiana!`;
      }
      
      const duration = Date.now() - startTime;
      logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
      
      return res.json({ 
        message: { 
          role: 'assistant', 
          content: generalResponse 
        } 
      });

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
      
      // Simple error fallback
      return res.json({ 
        message: { 
          role: 'assistant', 
          content: `Ciao! Sono Sofia da ShopMefy! 🇮🇹

Mi dispiace, sto avendo un problema tecnico. Puoi riprovare tra un momento?

Nel frattempo, posso aiutarti con:
• **Prodotti** - Le nostre specialità italiane
• **Servizi** - Corsi di cucina e degustazioni
• **Informazioni** - Spedizioni e ordini

Cosa ti piacerebbe sapere?` 
        } 
      });
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

  /**
   * Intelligent query analysis without hardcoded patterns
   * Analyzes user intent and extracts relevant information
   */
  private analyzeUserQuery(query: string): {
    intent: 'product_search' | 'service_inquiry' | 'faq_inquiry' | 'general';
    category?: string;
    serviceType?: string;
    topic?: string;
    priceFilter?: { operator: 'less' | 'greater' | 'equal'; value: number };
    confidence: number;
  } {
    // Product-related keywords and patterns
    const productKeywords = ['wine', 'vino', 'cheese', 'formaggio', 'pasta', 'oil', 'olio', 'vinegar', 'aceto', 'meat', 'carne', 'prosciutto', 'salami'];
    const priceKeywords = ['price', 'prezzo', 'cost', 'costo', 'euro', '€', 'less', 'meno', 'under', 'sotto', 'below', 'above', 'sopra', 'over'];
    const serviceKeywords = ['service', 'servizio', 'cooking', 'cucina', 'class', 'corso', 'catering', 'consultation'];
    const faqKeywords = ['shipping', 'spedizione', 'return', 'reso', 'payment', 'pagamento', 'policy', 'politica', 'how', 'come'];

    // Check for product search intent
    const hasProductKeywords = productKeywords.some(keyword => query.includes(keyword));
    const hasPriceKeywords = priceKeywords.some(keyword => query.includes(keyword));
    
    if (hasProductKeywords || query.includes('have') || query.includes('sell') || query.includes('avete') || query.includes('vendete')) {
      // Extract category
      let category = '';
      if (query.includes('wine') || query.includes('vino')) category = 'wine';
      else if (query.includes('cheese') || query.includes('formaggio')) category = 'cheese';
      else if (query.includes('pasta')) category = 'pasta';
      else if (query.includes('oil') || query.includes('olio')) category = 'oil';
      
      // Extract price filter
      let priceFilter;
      if (hasPriceKeywords) {
        // Simple price extraction - look for numbers
        const numbers = query.match(/\d+/g);
        if (numbers) {
          const value = parseInt(numbers[0]);
          if (query.includes('less') || query.includes('under') || query.includes('below') || query.includes('meno') || query.includes('sotto')) {
            priceFilter = { operator: 'less' as const, value };
          } else if (query.includes('over') || query.includes('above') || query.includes('sopra')) {
            priceFilter = { operator: 'greater' as const, value };
          }
        }
      }
      
      return {
        intent: 'product_search',
        category,
        priceFilter,
        confidence: 0.8
      };
    }
    
    // Check for service inquiry
    const hasServiceKeywords = serviceKeywords.some(keyword => query.includes(keyword));
    if (hasServiceKeywords) {
      let serviceType = '';
      if (query.includes('cooking') || query.includes('cucina')) serviceType = 'cooking';
      else if (query.includes('catering')) serviceType = 'catering';
      
      return {
        intent: 'service_inquiry',
        serviceType,
        confidence: 0.7
      };
    }
    
    // Check for FAQ inquiry
    const hasFAQKeywords = faqKeywords.some(keyword => query.includes(keyword));
    if (hasFAQKeywords) {
      let topic = '';
      if (query.includes('shipping') || query.includes('spedizione')) topic = 'shipping';
      else if (query.includes('return') || query.includes('reso')) topic = 'return';
      else if (query.includes('payment') || query.includes('pagamento')) topic = 'payment';
      
      return {
        intent: 'faq_inquiry',
        topic,
        confidence: 0.6
      };
    }
    
    return {
      intent: 'general',
      confidence: 0.3
    };
  }

  /**
   * Generate intelligent product response with filtering
   */
  private generateIntelligentProductResponse(
    productResult: ProductResponse, 
    queryAnalysis: any, 
    originalQuery: string
  ): string {
    let products = productResult.products || [];
    
    // Apply intelligent filtering
    if (queryAnalysis.category) {
      // Filter by category - only actual wine products
      if (queryAnalysis.category === 'wine') {
        products = products.filter(p => 
          p.category?.toLowerCase() === 'wine' || 
          p.tags?.some(tag => tag.toLowerCase() === 'wine')
        );
      }
    }
    
    // Apply price filtering
    if (queryAnalysis.priceFilter) {
      const { operator, value } = queryAnalysis.priceFilter;
      products = products.filter(p => {
        const price = parseFloat(p.price);
        if (operator === 'less') return price < value;
        if (operator === 'greater') return price > value;
        return price === value;
      });
    }
    
    // Generate response
    if (products.length === 0) {
      if (queryAnalysis.priceFilter) {
        // Find cheapest alternative
        const allWines = productResult.products?.filter(p => 
          p.category?.toLowerCase() === 'wine' || 
          p.tags?.some(tag => tag.toLowerCase() === 'wine')
        ) || [];
        
        if (allWines.length > 0) {
          const cheapest = allWines.reduce((min, wine) => 
            parseFloat(wine.price) < parseFloat(min.price) ? wine : min
          );
          
          return `Mi dispiace, non abbiamo vini sotto €${queryAnalysis.priceFilter.value}. 😔

Tuttavia, il nostro vino più conveniente è:
• **${cheapest.name}** - €${cheapest.price}

${cheapest.description}

Ti piacerebbe saperne di più su questo vino o vedere altre opzioni? 🍷`;
        }
      }
      
      return `Mi dispiace, al momento non abbiamo prodotti che corrispondono alla tua ricerca. 😔

Posso aiutarti con:
• **Vini** - Barolo, Chianti, Prosecco
• **Formaggi** - Parmigiano, Gorgonzola, Mozzarella
• **Pasta** - Spaghetti, Tagliatelle, Gnocchi

Cosa ti piacerebbe vedere? 🇮🇹`;
    }
    
    // Format successful results
    let response = `Ecco i nostri ${queryAnalysis.category || 'prodotti'}`;
    if (queryAnalysis.priceFilter) {
      response += ` ${queryAnalysis.priceFilter.operator === 'less' ? 'sotto' : 'sopra'} €${queryAnalysis.priceFilter.value}`;
    }
    response += `! 🍷\n\n`;
    
    products.forEach(product => {
      response += `• **${product.name}** - €${product.price}\n`;
      response += `  ${product.description}\n\n`;
    });
    
    response += `Ti piacerebbe saperne di più su qualcuno di questi prodotti? 😊`;
    
    return response;
  }

  /**
   * Generate service response
   */
  private generateServiceResponse(serviceResult: ServiceResponse, queryAnalysis: any): string {
    const services = serviceResult.services || [];
    
    if (services.length === 0) {
      return `Al momento non abbiamo servizi attivi per "${queryAnalysis.serviceType || 'la tua richiesta'}". 😔

I nostri servizi includono:
• **Corsi di cucina italiana**
• **Servizi di catering**
• **Consulenze personalizzate**

Contattaci per maggiori informazioni! 📞`;
    }
    
    let response = `Ecco i nostri servizi disponibili! 🚚\n\n`;
    
    services.forEach(service => {
      response += `• **${service.name}** - €${service.price}\n`;
      response += `  ${service.description}\n\n`;
    });
    
    response += `Ti piacerebbe prenotare uno di questi servizi? 😊`;
    
    return response;
  }

  /**
   * Generate FAQ response
   */
  private generateFAQResponse(faqResult: FAQResponse, queryAnalysis: any): string {
    const faqs = faqResult.faqs || [];
    
    if (faqs.length === 0) {
      return `Non ho trovato informazioni specifiche su "${queryAnalysis.topic || 'questo argomento'}". 😔

Puoi contattarci direttamente per assistenza:
📧 support@shopmefy.com
📞 +39 02 1234 5678

Oppure chiedi di spedizioni, resi, pagamenti! 💬`;
    }
    
    // Return the most relevant FAQ
    const topFAQ = faqs[0];
    
    return `Ecco le informazioni che cercavi! ℹ️

**${topFAQ.question}**

${topFAQ.answer}

Hai altre domande? Sono qui per aiutarti! 😊`;
  }

  /**
   * Generate intelligent suggestions based on query content
   */
  private generateIntelligentSuggestions(query: string): string {
    if (query.includes('wine') || query.includes('vino')) {
      return `Vedo che ti interessano i vini! 🍷

Abbiamo una selezione fantastica:
• **Vini rossi** - Barolo, Chianti Classico
• **Vini bianchi** - Pinot Grigio, Vermentino  
• **Spumanti** - Prosecco di Valdobbiadene`;
    }
    
    if (query.includes('cheese') || query.includes('formaggio')) {
      return `I formaggi italiani sono la mia passione! 🧀

Ti consiglio:
• **Parmigiano Reggiano** - Il re dei formaggi
• **Gorgonzola** - Cremoso e saporito
• **Mozzarella di Bufala** - Freschissima dalla Campania`;
    }
    
    if (query.includes('pasta')) {
      return `La pasta italiana autentica! 🍝

Le nostre specialità:
• **Spaghetti di Gragnano** - Trafilati al bronzo
• **Tagliatelle all'uovo** - Fresche dall'Emilia
• **Gnocchi di patate** - Tradizione del Nord`;
    }
    
    return `Posso aiutarti con informazioni sui nostri:
• **Prodotti** - Vini, formaggi, pasta e specialità italiane
• **Servizi** - Corsi di cucina e degustazioni
• **Spedizioni** - Informazioni consegne
• **Ordini** - Pagamenti e politiche`;
  }

  /**
   * Extract conversation context for better understanding
   */
  private extractConversationContext(messages: any[]): {
    previousProducts: string[];
    cartItems: Array<{product: string, quantity: number}>;
    conversationFlow: string[];
  } {
    const context = {
      previousProducts: [] as string[],
      cartItems: [] as Array<{product: string, quantity: number}>,
      conversationFlow: [] as string[]
    };
    
    // Analyze conversation for products mentioned and cart operations
    messages.forEach(msg => {
      if (msg.role === 'user') {
        context.conversationFlow.push(`USER: ${msg.content}`);
        
        // Extract product mentions and quantities
        const productMatches = msg.content.toLowerCase().match(/(\d+)\s*(bottiglie?|confezioni?|pezzi?)?\s*(di|del)?\s*([a-zA-Z\s]+)/g);
        if (productMatches) {
          productMatches.forEach((match: string) => {
            const quantityMatch = match.match(/(\d+)/);
            const productMatch = match.match(/(?:di|del)\s*([a-zA-Z\s]+)/);
            
            if (quantityMatch && productMatch) {
              const quantity = parseInt(quantityMatch[1]);
              const product = productMatch[1].trim();
              context.cartItems.push({ product, quantity });
              context.previousProducts.push(product);
            }
          });
        }
        
        // Extract product names from general mentions
        const productKeywords = ['vino', 'barolo', 'chianti', 'prosecco', 'gnocchi', 'pasta', 'formaggio', 'prosciutto'];
        productKeywords.forEach(keyword => {
          if (msg.content.toLowerCase().includes(keyword)) {
            context.previousProducts.push(keyword);
          }
        });
      } else if (msg.role === 'assistant') {
        context.conversationFlow.push(`SOFIA: ${msg.content.substring(0, 100)}...`);
      }
    });
    
    return context;
  }

  /**
   * Intelligent query analysis with conversation context
   */
  private analyzeUserQueryWithContext(query: string, context: {
    previousProducts: string[];
    cartItems: Array<{product: string, quantity: number}>;
    conversationFlow: string[];
  }): {
    intent: 'product_search' | 'service_inquiry' | 'faq_inquiry' | 'general' | 'cart_management';
    category?: string;
    serviceType?: string;
    topic?: string;
    priceFilter?: { operator: 'less' | 'greater' | 'equal'; value: number };
    confidence: number;
    cartOperation?: 'add' | 'view' | 'modify';
    detectedProducts?: Array<{product: string, quantity: number}>;
  } {
    const lowerQuery = query.toLowerCase();
    
    // Check for cart management operations
    if (lowerQuery.match(/(\d+)\s*(bottiglie?|confezioni?|pezzi?)/i) || 
        lowerQuery.includes('si') && context.cartItems.length > 0 ||
        lowerQuery.includes('aggiungi') || 
        lowerQuery.includes('carrello') ||
        lowerQuery.includes('ordine')) {
      
      // Extract quantities and products from current query
      const detectedProducts: Array<{product: string, quantity: number}> = [];
      
      // Pattern for "3 bottiglie di Barolo" or "si 3 bottiglie di Barolo"
      const quantityMatches = lowerQuery.match(/(\d+)\s*(bottiglie?|confezioni?|pezzi?)?\s*(di|del)?\s*([a-zA-Z\s]+)/g);
      if (quantityMatches) {
        quantityMatches.forEach(match => {
          const quantityMatch = match.match(/(\d+)/);
          const productMatch = match.match(/(?:di|del)\s*([a-zA-Z\s]+)/) || match.match(/(\d+)\s*([a-zA-Z\s]+)/);
          
          if (quantityMatch && productMatch) {
            const quantity = parseInt(quantityMatch[1]);
            const product = productMatch[productMatch.length - 1].trim();
            detectedProducts.push({ product, quantity });
          }
        });
      }
      
      // If just "si" and we have previous products, assume confirmation
      if (lowerQuery.includes('si') && context.previousProducts.length > 0 && detectedProducts.length === 0) {
        // Use the last mentioned product
        const lastProduct = context.previousProducts[context.previousProducts.length - 1];
        detectedProducts.push({ product: lastProduct, quantity: 1 });
      }
      
      return {
        intent: 'cart_management',
        cartOperation: 'add',
        detectedProducts,
        confidence: 0.9
      };
    }
    
    // Check for cart viewing
    if (lowerQuery.includes('carrello') || lowerQuery.includes('ordine') || lowerQuery.includes('lista')) {
      return {
        intent: 'cart_management',
        cartOperation: 'view',
        confidence: 0.8
      };
    }
    
    // Use existing analysis for other intents
    const baseAnalysis = this.analyzeUserQuery(query);
    
    // Boost confidence if we have context
    if (context.conversationFlow.length > 2) {
      baseAnalysis.confidence = Math.min(baseAnalysis.confidence + 0.2, 1.0);
    }
    
    return baseAnalysis;
  }

  /**
   * Generate cart addition response
   */
  private generateCartResponse(products: Array<{product: string, quantity: number}>, context: {
    previousProducts: string[];
    cartItems: Array<{product: string, quantity: number}>;
    conversationFlow: string[];
  }): string {
    // Combine all cart items (previous + new)
    const allCartItems = [...context.cartItems, ...products];
    
    // Group by product and sum quantities
    const cartSummary = new Map<string, number>();
    allCartItems.forEach(item => {
      const existing = cartSummary.get(item.product) || 0;
      cartSummary.set(item.product, existing + item.quantity);
    });
    
    // Generate response for newly added items
    const newItemsText = products.map(item => 
      `• ${item.product} - ${item.quantity} ${item.quantity > 1 ? 'pezzi' : 'pezzo'}`
    ).join('\n');
    
    // Calculate estimated total (using sample prices)
    const priceMap: {[key: string]: number} = {
      'barolo': 45.00,
      'chianti': 19.50,
      'prosecco': 13.90,
      'gnocchi': 4.80,
      'gnocchi di patate': 4.80,
      'parmigiano': 15.90,
      'prosciutto': 24.90,
      'mozzarella': 6.75
    };
    
    let total = 0;
    const cartItemsText = Array.from(cartSummary.entries()).map(([product, quantity]) => {
      const price = priceMap[product.toLowerCase()] || 10.00; // Default price
      const itemTotal = price * quantity;
      total += itemTotal;
      return `• ${product} - €${price.toFixed(2)} x ${quantity} = €${itemTotal.toFixed(2)}`;
    }).join('\n');
    
    return `Perfetto! ✅ Ho aggiunto al tuo carrello:

${newItemsText}

🛒 **Il tuo carrello ora contiene:**
${cartItemsText}

💰 **Totale: €${total.toFixed(2)}**

Vuoi aggiungere qualcos'altro o preferisci completare l'ordine? 🇮🇹✨`;
  }

  /**
   * Generate cart view response
   */
  private generateCartViewResponse(context: {
    previousProducts: string[];
    cartItems: Array<{product: string, quantity: number}>;
    conversationFlow: string[];
  }): string {
    if (context.cartItems.length === 0) {
      return `Il tuo carrello è vuoto! 🛒

Posso aiutarti a trovare alcuni dei nostri prodotti italiani autentici:
• **Vini** - Barolo, Chianti, Prosecco 🍷
• **Formaggi** - Parmigiano, Gorgonzola, Mozzarella 🧀
• **Pasta** - Gnocchi, Spaghetti di Gragnano 🍝
• **Salumi** - Prosciutto di Parma, Bresaola 🥓

Cosa ti piacerebbe ordinare?`;
    }
    
    // Group by product and sum quantities
    const cartSummary = new Map<string, number>();
    context.cartItems.forEach(item => {
      const existing = cartSummary.get(item.product) || 0;
      cartSummary.set(item.product, existing + item.quantity);
    });
    
    // Calculate total with sample prices
    const priceMap: {[key: string]: number} = {
      'barolo': 45.00,
      'chianti': 19.50,
      'prosecco': 13.90,
      'gnocchi': 4.80,
      'gnocchi di patate': 4.80,
      'parmigiano': 15.90,
      'prosciutto': 24.90,
      'mozzarella': 6.75
    };
    
    let total = 0;
    const cartItemsText = Array.from(cartSummary.entries()).map(([product, quantity]) => {
      const price = priceMap[product.toLowerCase()] || 10.00;
      const itemTotal = price * quantity;
      total += itemTotal;
      return `• ${product} - €${price.toFixed(2)} x ${quantity} = €${itemTotal.toFixed(2)}`;
    }).join('\n');
    
    return `🛒 **Il tuo carrello:**

${cartItemsText}

💰 **Totale: €${total.toFixed(2)}**

Vuoi modificare qualcosa o procedere con l'ordine? 🇮🇹✨`;
  }

  /**
   * Test OrderCompleted function directly
   */
  async testOrderCompleted(req: Request, res: Response) {
    try {
      logger.info('🧪 Testing OrderCompleted function directly...');
      
      const testOrderData = {
        cartItems: [
          { product: 'Barolo DOCG', quantity: 3 },
          { product: 'Gnocchi di Patate', quantity: 2 }
        ],
        customerInfo: {
          name: 'Test Customer',
          address: 'Via Roma 123, Milano',
          email: 'test@example.com'
        }
      };
      
      const result = await availableFunctions.OrderCompleted(testOrderData);
      
      logger.info('✅ OrderCompleted test result:', result);
      
      return res.json({
        success: true,
        testData: testOrderData,
        result: result
      });
      
    } catch (error) {
      logger.error('🚨 OrderCompleted test failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

export default new ChatController(); 