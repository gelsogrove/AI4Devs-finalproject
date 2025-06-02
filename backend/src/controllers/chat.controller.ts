import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

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
        },
        isActive: {
          type: 'boolean',
          description: 'Filter by active status (default: true - only active products)',
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
        },
        isActive: {
          type: 'boolean',
          description: 'Filter by active status (default: true - only active FAQs)',
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
        },
        isActive: {
          type: 'boolean',
          description: 'Filter by active status (default: true - only active documents)',
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
        const systemPrompt = `${agentConfig.prompt || 'You are a helpful assistant.'}

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
              // logger.info('✅ AI: Formatted response ready');
              // logger.info(`🎯 RESPONSE: "${finalMessage.content?.substring(0, 100)}..."`);
              
              const duration = Date.now() - startTime;
              // logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
              
              // Prepare debug information
              const debugInfo = {
                functionCalls: [{
                  name: functionName,
                  arguments: functionArgs,
                  result: functionResult,
                  timestamp: new Date().toISOString()
                }],
                processingTime: duration,
                model: agentConfig.model,
                temperature: agentConfig.temperature
              };
              
              return res.json({ 
                message: finalMessage,
                debug: debugInfo
              });
            }
          }
        }
        
        // Step 7: No function call - USE FALLBACK INSTEAD OF DIRECT AI RESPONSE
        logger.info('💬 AI: No function call detected - using cascade fallback logic');
        
        // Force fallback with cascade logic
        throw new Error('Forcing cascade fallback for better search results');
        
      } catch (aiError) {
        logger.error('🚨 AI service failed, using intelligent fallback:', aiError);
        
        // Step 8: Intelligent fallback with function calling
        logger.info('🔄 FALLBACK: Analyzing user query for function calling...');
        
        const analysis = this.analyzeUserQuery(lastUserMessage.content);
        logger.info(`🧠 FALLBACK: Query analysis - Intent: ${analysis.intent}, Confidence: ${analysis.confidence}`);
        
        let fallbackResponse: any;
        let functionCalls: any[] = [];
        
        try {
          if (analysis.intent === 'products') {
            logger.info('🛍️ FALLBACK: Executing getProducts...');
            const result = await availableFunctions.getProducts(analysis.params || {});
            functionCalls.push({
              name: 'getProducts',
              arguments: analysis.params || {},
              result,
              timestamp: new Date().toISOString()
            });
            
            if (result.products && result.products.length > 0) {
              const productList = result.products.map(p => `• **${p.name}** - €${p.price}`).join('\n');
              fallbackResponse = {
                role: 'assistant',
                content: `${productList}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No products found for your search.'
              };
            }
          } else if (analysis.intent === 'services') {
            logger.info('🎓 FALLBACK: Executing getServices...');
            const result = await availableFunctions.getServices(analysis.params || {});
            functionCalls.push({
              name: 'getServices',
              arguments: analysis.params || {},
              result,
              timestamp: new Date().toISOString()
            });
            
            if (result.services && result.services.length > 0) {
              const serviceList = result.services.map(s => `• **${s.name}** - €${s.price}\n${s.description}`).join('\n\n');
              fallbackResponse = {
                role: 'assistant',
                content: `${serviceList}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No services found for your search.'
              };
            }
          } else if (analysis.intent === 'faq') {
            logger.info('❓ FALLBACK: Executing getFAQs...');
            const result = await availableFunctions.getFAQs(analysis.params || {});
            functionCalls.push({
              name: 'getFAQs',
              arguments: analysis.params || {},
              result,
              timestamp: new Date().toISOString()
            });
            
            if (result.faqs && result.faqs.length > 0) {
              const faq = result.faqs[0];
              fallbackResponse = {
                role: 'assistant',
                content: `**${faq.question}**\n\n${faq.answer}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No FAQs found for your question.'
              };
            }
          } else if (analysis.intent === 'company') {
            logger.info('🏢 FALLBACK: Executing getCompanyInfo...');
            const result = await availableFunctions.getCompanyInfo();
            functionCalls.push({
              name: 'getCompanyInfo',
              arguments: {},
              result,
              timestamp: new Date().toISOString()
            });
            
            if (result.companyName) {
              fallbackResponse = {
                role: 'assistant',
                content: `**${result.companyName}**\n\n${result.address}\n${result.email}\n${result.openingTime}\n\n${result.description}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'Company information not available.'
              };
            }
          } else if (analysis.intent === 'documents') {
            logger.info('📄 FALLBACK: Executing getDocuments...');
            const result = await availableFunctions.getDocuments(analysis.params || {});
            functionCalls.push({
              name: 'getDocuments',
              arguments: analysis.params || {},
              result,
              timestamp: new Date().toISOString()
            });
            
            if (result.documents && result.documents.length > 0) {
              const doc = result.documents[0];
              fallbackResponse = {
                role: 'assistant',
                content: `I found information in our documents: **${doc.title}**\n\n${doc.content}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'I did not find documents related to your request.'
              };
            }
          } else {
            // Handle greetings and thanks properly
            if (analysis.intent === 'greeting') {
              logger.info('👋 FALLBACK: Handling greeting...');
              const companyResult = await availableFunctions.getCompanyInfo();
              functionCalls.push({
                name: 'getCompanyInfo',
                arguments: {},
                result: companyResult,
                timestamp: new Date().toISOString()
              });
              
              if (companyResult.companyName) {
                fallbackResponse = {
                  role: 'assistant',
                  content: `Ciao! Welcome to ${companyResult.companyName}! 🇮🇹\n\nHow can I help you today? I can assist you with:\n• **Products** - Our Italian specialties\n• **Services** - Cooking classes and tastings\n• **Information** - Shipping and orders\n\nWhat would you like to know?`
                };
              } else {
                fallbackResponse = {
                  role: 'assistant',
                  content: 'Ciao! How can I help you today? 🇮🇹'
                };
              }
            } else if (analysis.intent === 'thanks') {
              logger.info('🙏 FALLBACK: Handling thanks...');
              fallbackResponse = {
                role: 'assistant',
                content: 'Prego! (You\'re welcome!) Is there anything else I can help you with? 🇮🇹'
              };
            } else {
              // ANDREA'S CASCADE LOGIC: Services → FAQs → Documents → Generic LLM
              logger.info('🔄 FALLBACK: Starting cascade search for general query...');
              
              const searchQuery = analysis.params?.search || '';
              let foundResult = false;
              
              // 1. Try Services first
              try {
                logger.info('🔍 Step 1: Searching Services...');
                const servicesResult = await availableFunctions.getServices({ search: searchQuery });
                functionCalls.push({
                  name: 'getServices',
                  arguments: { search: searchQuery },
                  result: servicesResult,
                  timestamp: new Date().toISOString()
                });
                
                if (servicesResult.services && servicesResult.services.length > 0) {
                  const service = servicesResult.services[0];
                  fallbackResponse = {
                    role: 'assistant',
                    content: `I found this service: **${service.name}** - €${service.price}\n\n${service.description}`
                  };
                  foundResult = true;
                  logger.info('✅ Found result in Services');
                }
              } catch (error) {
                logger.error('❌ Services search failed:', error);
              }
              
              // 2. If not found in services, try FAQs
              if (!foundResult) {
                try {
                  logger.info('🔍 Step 2: Searching FAQs...');
                  const faqsResult = await availableFunctions.getFAQs({ search: searchQuery });
                  functionCalls.push({
                    name: 'getFAQs',
                    arguments: { search: searchQuery },
                    result: faqsResult,
                    timestamp: new Date().toISOString()
                  });
                  
                  if (faqsResult.faqs && faqsResult.faqs.length > 0) {
                    const faq = faqsResult.faqs[0];
                    fallbackResponse = {
                      role: 'assistant',
                      content: `**${faq.question}**\n\n${faq.answer}`
                    };
                    foundResult = true;
                    logger.info('✅ Found result in FAQs');
                  }
                } catch (error) {
                  logger.error('❌ FAQs search failed:', error);
                }
              }
              
              // 3. If not found in FAQs, try Documents
              if (!foundResult) {
                try {
                  logger.info('🔍 Step 3: Searching Documents...');
                  const documentsResult = await availableFunctions.getDocuments({ search: searchQuery });
                  functionCalls.push({
                    name: 'getDocuments',
                    arguments: { search: searchQuery },
                    result: documentsResult,
                    timestamp: new Date().toISOString()
                  });
                  
                  if (documentsResult.documents && documentsResult.documents.length > 0) {
                    const doc = documentsResult.documents[0];
                    fallbackResponse = {
                      role: 'assistant',
                      content: `I found information in our documents: **${doc.title}**\n\n${doc.content}`
                    };
                    foundResult = true;
                    logger.info('✅ Found result in Documents');
                  }
                } catch (error) {
                  logger.error('❌ Documents search failed:', error);
                }
              }
              
              // 4. If nothing found, use generic LLM response
              if (!foundResult) {
                logger.info('🔍 Step 4: Using generic LLM response...');
                try {
                  // Use AI service to generate a response
                  const aiResponse = await aiService.generateChatCompletion(
                    [{ role: 'user', content: searchQuery }],
                    'openai/gpt-4o-mini',
                    { temperature: 0.3, maxTokens: 200 }
                  );
                  
                  fallbackResponse = {
                    role: 'assistant',
                    content: aiResponse.choices[0].message.content || 'I\'m not sure how to help with that. Can you be more specific?'
                  };
                  logger.info('✅ Generated AI response');
                } catch (aiError) {
                  logger.error('❌ AI response failed:', aiError);
                  fallbackResponse = {
                    role: 'assistant',
                    content: 'I\'m not sure how to help with that. Can you be more specific about what you\'re looking for?'
                  };
                }
              }
            }
          }
          
        } catch (functionError) {
          logger.error('🚨 Function execution failed in fallback:', functionError);
          fallbackResponse = {
            role: 'assistant',
            content: 'Service temporarily unavailable. Please try again.'
          };
        }
        
        const duration = Date.now() - startTime;
        logger.info(`🏁 === FALLBACK COMPLETE (${duration}ms) ===`);
        
        const debugInfo = {
          functionCalls,
          processingTime: duration,
          model: agentConfig.model,
          temperature: agentConfig.temperature,
          fallbackUsed: true,
          aiError: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        };
        
        return res.json({ 
          message: fallbackResponse,
          debug: debugInfo
        });
      }

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
          content: `Hello! I'm Sofia from ShopMefy! 🇮🇹

I'm sorry, I'm having a technical issue. Can you try again in a moment?

In the meantime, I can help you with:
• **Products** - Our Italian specialties
• **Services** - Cooking classes and tastings
• **Information** - Shipping and orders

What would you like to know?` 
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
      // Test getProducts with wine search
      const wineResults = await availableFunctions.getProducts({ search: 'wine' });
      
      // Test getProducts with Barolo search
      const baroloResults = await availableFunctions.getProducts({ search: 'Barolo' });
      
      // Test getProducts with no filters
      const allResults = await availableFunctions.getProducts({});
      
      // Test getFAQs with shipping search
      const shippingFAQs = await availableFunctions.getFAQs({ search: 'shipping' });
      
      // Test getFAQs with no filters
      const allFAQs = await availableFunctions.getFAQs({});
      
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
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Enhanced query analysis for intelligent fallback
   * Analyzes user queries to determine intent and extract parameters
   */
  private analyzeUserQuery(query: string): {
    intent: 'greeting' | 'thanks' | 'general' | 'products' | 'services' | 'faq' | 'company' | 'documents';
    confidence: number;
    params?: any;
  } {
    const lowerQuery = query.toLowerCase();
    
    // Check for greetings
    if (lowerQuery.match(/\b(hello|hi|ciao|buongiorno|good morning|hey)\b/)) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    
    // Check for thanks
    if (lowerQuery.match(/\b(thank|thanks|grazie|merci)\b/)) {
      return { intent: 'thanks', confidence: 0.9 };
    }
    
    // Check for products
    if (lowerQuery.match(/\b(product|pasta|cheese|wine|oil|vinegar|food|buy|purchase|price)\b/)) {
      return { intent: 'products', confidence: 0.8, params: { search: query } };
    }
    
    // Check for services
    if (lowerQuery.match(/\b(service|class|cooking|catering|consultation|lesson|workshop)\b/)) {
      return { intent: 'services', confidence: 0.8, params: { search: query } };
    }
    
    // Check for company info
    if (lowerQuery.match(/\b(company|contact|address|phone|email|hours|location|about)\b/)) {
      return { intent: 'company', confidence: 0.8 };
    }
    
    // For any other query, we'll use the cascade logic: Services → FAQs → Documents → Generic
    return { intent: 'general', confidence: 0.5, params: { search: query } };
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