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
        
        // Step 7: No function call - direct response from AI
        logger.info('💬 AI: Direct response (no function call)');
        logger.info(`🎯 RESPONSE: "${responseMessage.content?.substring(0, 100)}..."`);
        
        const duration = Date.now() - startTime;
        logger.info(`🏁 === CHAT FLOW COMPLETE (${duration}ms) ===`);
        
        // Prepare debug information for direct response
        const debugInfo = {
          functionCalls: [], // No function calls for direct response
          processingTime: duration,
          model: agentConfig.model,
          temperature: agentConfig.temperature
        };
        
        return res.json({ 
          message: responseMessage,
          debug: debugInfo
        });
        
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
            
            // Use ONLY database data - NO hardcoded responses
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
            logger.info('🎯 FALLBACK: Executing getServices...');
            const result = await availableFunctions.getServices(analysis.params || {});
            functionCalls.push({
              name: 'getServices',
              arguments: analysis.params || {},
              result,
              timestamp: new Date().toISOString()
            });
            
            // Use ONLY database data - NO hardcoded responses
            if (result.services && result.services.length > 0) {
              const serviceList = result.services.map(s => `• **${s.name}** - €${s.price}`).join('\n');
              fallbackResponse = {
                role: 'assistant',
                content: `${serviceList}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No services found.'
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
            
            // Use ONLY database data - NO hardcoded responses
            if (result.faqs && result.faqs.length > 0) {
              const faq = result.faqs[0];
              fallbackResponse = {
                role: 'assistant',
                content: `**${faq.question}**\n\n${faq.answer}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No FAQ information found.'
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
            
            // Use ONLY database data - NO hardcoded responses
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
            
            // Use ONLY database data - NO hardcoded responses
            if (result.documents && result.documents.length > 0) {
              const docInfo = result.documents[0];
              fallbackResponse = {
                role: 'assistant',
                content: `Document: ${docInfo.title || docInfo.originalName}`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'No documents found.'
              };
            }
          } else {
            // For greeting/thanks/general - try to get some basic data from database
            logger.info('🔄 FALLBACK: Getting basic company info for general response...');
            const companyResult = await availableFunctions.getCompanyInfo();
            functionCalls.push({
              name: 'getCompanyInfo',
              arguments: {},
              result: companyResult,
              timestamp: new Date().toISOString()
            });
            
            // Use ONLY database data - NO hardcoded responses
            if (companyResult.companyName) {
              fallbackResponse = {
                role: 'assistant',
                content: `Welcome to ${companyResult.companyName}. How can I help you?`
              };
            } else {
              fallbackResponse = {
                role: 'assistant',
                content: 'How can I help you?'
              };
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
    
    // Product-related queries
    if (lowerQuery.includes('prodotti') || lowerQuery.includes('product') || 
        lowerQuery.includes('formaggio') || lowerQuery.includes('cheese') ||
        lowerQuery.includes('vino') || lowerQuery.includes('wine') ||
        lowerQuery.includes('pasta') || lowerQuery.includes('olio') || lowerQuery.includes('oil') ||
        lowerQuery.includes('aceto') || lowerQuery.includes('vinegar') ||
        lowerQuery.includes('prezzo') || lowerQuery.includes('price') ||
        lowerQuery.includes('euro') || lowerQuery.includes('€')) {
      
      let params: any = {};
      
      // Extract search terms
      if (lowerQuery.includes('formaggio') || lowerQuery.includes('cheese')) {
        params.category = 'Cheese';
      } else if (lowerQuery.includes('vino') || lowerQuery.includes('wine')) {
        params.category = 'Wine';
      } else if (lowerQuery.includes('pasta')) {
        params.category = 'Pasta';
      } else if (lowerQuery.includes('olio') || lowerQuery.includes('oil')) {
        params.category = 'Oil';
      }
      
      // Extract price filters
      const priceMatch = lowerQuery.match(/(\d+)\s*(euro|€)/);
      if (priceMatch) {
        params.maxPrice = parseFloat(priceMatch[1]);
      }
      
      return { intent: 'products', confidence: 0.9, params };
    }
    
    // Service-related queries
    if (lowerQuery.includes('servizi') || lowerQuery.includes('service') ||
        lowerQuery.includes('degustazione') || lowerQuery.includes('tasting') ||
        lowerQuery.includes('consulenza') || lowerQuery.includes('consultation')) {
      return { intent: 'services', confidence: 0.9, params: {} };
    }
    
    // FAQ/Policy queries
    if (lowerQuery.includes('spedizione') || lowerQuery.includes('shipping') ||
        lowerQuery.includes('consegna') || lowerQuery.includes('delivery') ||
        lowerQuery.includes('pagamento') || lowerQuery.includes('payment') ||
        lowerQuery.includes('reso') || lowerQuery.includes('return') ||
        lowerQuery.includes('policy') || lowerQuery.includes('quanto tempo') ||
        lowerQuery.includes('how long') || lowerQuery.includes('metodi') ||
        lowerQuery.includes('methods')) {
      
      let searchTerm = '';
      if (lowerQuery.includes('spedizione') || lowerQuery.includes('shipping')) {
        searchTerm = 'shipping';
      } else if (lowerQuery.includes('pagamento') || lowerQuery.includes('payment')) {
        searchTerm = 'payment';
      } else if (lowerQuery.includes('reso') || lowerQuery.includes('return')) {
        searchTerm = 'return';
      }
      
      return { intent: 'faq', confidence: 0.9, params: { search: searchTerm } };
    }
    
    // Company information queries
    if (lowerQuery.includes('dove') || lowerQuery.includes('where') ||
        lowerQuery.includes('indirizzo') || lowerQuery.includes('address') ||
        lowerQuery.includes('magazzino') || lowerQuery.includes('warehouse') ||
        lowerQuery.includes('sede') || lowerQuery.includes('location') ||
        lowerQuery.includes('telefono') || lowerQuery.includes('phone') ||
        lowerQuery.includes('email') || lowerQuery.includes('contatto') ||
        lowerQuery.includes('contact') || lowerQuery.includes('orari') ||
        lowerQuery.includes('hours') || lowerQuery.includes('website')) {
      return { intent: 'company', confidence: 0.9, params: {} };
    }
    
    // Document/regulation queries
    if (lowerQuery.includes('documento') || lowerQuery.includes('document') ||
        lowerQuery.includes('internazionale') || lowerQuery.includes('international') ||
        lowerQuery.includes('trasporto') || lowerQuery.includes('transport') ||
        lowerQuery.includes('legge') || lowerQuery.includes('law') ||
        lowerQuery.includes('normativa') || lowerQuery.includes('regulation') ||
        lowerQuery.includes('dogana') || lowerQuery.includes('customs') ||
        lowerQuery.includes('import') || lowerQuery.includes('export')) {
      
      let searchTerm = '';
      if (lowerQuery.includes('internazionale') || lowerQuery.includes('international')) {
        searchTerm = 'international';
      } else if (lowerQuery.includes('trasporto') || lowerQuery.includes('transport')) {
        searchTerm = 'transport';
      }
      
      return { intent: 'documents', confidence: 0.9, params: { search: searchTerm } };
    }
    
    // Greeting queries
    if (lowerQuery.includes('ciao') || lowerQuery.includes('hello') || 
        lowerQuery.includes('hi') || lowerQuery.includes('salve') ||
        lowerQuery.includes('buongiorno') || lowerQuery.includes('buonasera')) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    
    // Thanks queries
    if (lowerQuery.includes('grazie') || lowerQuery.includes('thank')) {
      return { intent: 'thanks', confidence: 0.9 };
    }
    
    // Default to general
    return { intent: 'general', confidence: 0.3 };
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