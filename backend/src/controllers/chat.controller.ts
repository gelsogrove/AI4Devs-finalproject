import { Request, Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { AgentConfigService } from '../application/services/AgentConfigService';
import {
  FAQResponse,
  ProductResponse,
  ServiceResponse
} from '../domain';
import { availableFunctions } from '../services/availableFunctions';
import logger from '../utils/logger';

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

// Function definitions that will be passed to the OpenAI API
const functionDefinitions = [
  {
    name: 'getProducts',
    description: 'Get products with optional category and search filters, or count products',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter products by category (e.g., "Cheese", "Oils", "Vinegars", "Pasta")',
        },
        search: {
          type: 'string',
          description: 'Search for products by name or description',
        },
        countOnly: {
          type: 'boolean',
          description: 'Set to true to get only counts and categories instead of product details',
        }
      },
      required: [],
    },
  },
  {
    name: 'getServices',
    description: 'Get available services with optional search filters',
    parameters: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Whether to return only active services (default: true)',
        },
        search: {
          type: 'string',
          description: 'Search for services by name or description',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Filter services by tags (e.g., ["italian", "premium", "quick"])',
        }
      },
      required: [],
    },
  },
  {
    name: 'getFAQs',
    description: 'Get frequently asked questions with optional category and search filters',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter FAQs by category (e.g., "Shipping & Delivery", "Returns & Refunds")',
        },
        search: {
          type: 'string',
          description: 'Search for FAQs by question or answer content',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Filter FAQs by tags (e.g., ["shipping", "returns", "payment"])',
        }
      },
      required: [],
    },
  },
];

class ChatController {
  private openai: OpenAI;
  private agentConfigService: AgentConfigService;

  constructor() {
    // Initialize OpenRouter client
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Gusto Italiano Shop'
      }
    });
    
    this.agentConfigService = new AgentConfigService();
    logger.info('OpenRouter client initialized successfully');
  }

  async processChat(req: Request, res: Response) {
    try {
      // Validate request
      const { messages } = chatRequestSchema.parse(req.body);

      // Get agent configuration from database
      const agentConfig = await this.agentConfigService.getLatestConfig();
      
      if (!agentConfig) {
        return res.status(500).json({ error: 'Failed to load agent configuration' });
      }

      // Add system prompt if not present in messages
      if (!messages.some(msg => msg.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: agentConfig.prompt,
        });
      }

      // Call OpenAI API with function calling
      const response = await this.openai.chat.completions.create({
        model: agentConfig.model,
        messages: messages as any,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.maxTokens,
        top_p: agentConfig.topP,
        tools: functionDefinitions.map(fn => ({
          type: 'function',
          function: fn
        })),
        tool_choice: shouldForceToolChoice(messages) ? 
          {
            type: "function",
            function: { name: "getProducts" }
          } : 
          'auto'
      }, {
        headers: {
          'X-TopK': '40'
        }
      });

      const responseMessage = response.choices[0].message;

      // Check if function call is requested
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Process each function call
        const toolCall = responseMessage.tool_calls[0];
        
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          // Add detailed logging for debugging
          logger.info(`Function call detected: ${functionName}`, { args: functionArgs });
          
          // Execute the function
          if (functionName === 'getProducts' || functionName === 'getServices' || functionName === 'getFAQs') {
            // Use type assertion to ensure TypeScript knows this is a function
            const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions] as Function;
            const functionResult = await functionToCall(functionArgs) as FunctionResult;
            
            // Log the function result for debugging
            logger.info(`Function ${functionName} result:`, { 
              total: functionResult.total,
              hasProducts: functionName === 'getProducts' ? !!(functionResult as ProductResponse).products : undefined,
              productCount: functionName === 'getProducts' ? (functionResult as ProductResponse).products?.length : undefined,
              searchTerm: functionArgs.search
            });
            
            // For product searches with no results, try to help the model with alternative searches
            if (functionName === 'getProducts') {
              const productResult = functionResult as ProductResponse;
              if (productResult.products && 
                  productResult.products.length === 0 && 
                  functionArgs.search) {
                
                // Log the failed search attempt
                logger.info(`No products found for search: "${functionArgs.search}". Trying alternatives.`);
                
                // Try with just the first word if multiple words were provided
                const words = functionArgs.search.trim().split(/\s+/);
                if (words.length > 1) {
                  const firstWordResult = await availableFunctions.getProducts({
                    ...functionArgs,
                    search: words[0]
                  }) as ProductResponse;
                  
                  // Log the alternative search result
                  logger.info(`Alternative search result for "${words[0]}":`, {
                    found: firstWordResult.products && firstWordResult.products.length > 0,
                    count: firstWordResult.products?.length
                  });
                  
                  // If we got results with just the first word, use those
                  if (firstWordResult.products && firstWordResult.products.length > 0) {
                    logger.info(`Found products using first word: "${words[0]}"`);
                    productResult.alternativeSearch = words[0];
                    productResult.products = firstWordResult.products;
                    productResult.total = firstWordResult.total;
                  }
                }
              }
            }
            
            // Add function result to messages
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
            
            // Add a system message to guide the model for the second response
            const systemPrompt: {
              role: 'system',
              content: string
            } = {
              role: 'system',
              content: `Based on the function results, please provide a helpful response following these guidelines:
              
1. If products were found:
   - Format the product information in a clear, beautiful, and readable way
   - Include emojis where appropriate (🍝 for pasta, 🧀 for cheese, 🍷 for wine, etc.)
   - For each product, show: name, price, brief description
   - Group by category if multiple categories exist
   - IMPORTANT: If multiple products are returned, ALWAYS use bullet points (•) instead of numbers (1, 2, 3) to list each product
   - Start each product on a new line with double line breaks between products for better readability
   - If this was an alternative search (using a related term), mention what term was used
   - DO NOT include any images or image markdown at all
   - Instead of showing images, just add a text note like "(Questo prodotto è disponibile nel nostro negozio)"
   - DO NOT include any URLs or links in the response

2. If no products were found:
   - Express regret that we don't have what they're looking for
   - Suggest alternatives if available
   - Ask if they'd like to see products from a related category

3. Format prices in Euro (€) with proper formatting
4. Keep your tone warm, enthusiastic, and knowledgeable
5. End with a question to continue the conversation if appropriate

IMPORTANT: Focus on the products that were returned by the function call. Don't make up any additional products or information.`
            };
            
            // Add the custom prompt to the messages
            messages.push(systemPrompt);
            
            // Call OpenAI again with function result
            const secondResponse = await this.openai.chat.completions.create({
              model: agentConfig.model,
              messages: messages as any,
              temperature: agentConfig.temperature,
              max_tokens: agentConfig.maxTokens,
              top_p: agentConfig.topP,
            }, {
              headers: {
                'X-TopK': '40'
              }
            });
            
            return res.json({
              message: secondResponse.choices[0].message,
            });
          }
        }
      }

      // Return response directly if no function call
      return res.json({
        message: responseMessage,
      });
    } catch (error: unknown) {
      logger.error('Chat processing error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle OpenAI API errors better
      let errorMessage = 'Failed to process chat';
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'invalid_api_key') {
        errorMessage = 'Configuration error: Invalid API key';
      }

      return res.status(500).json({ error: errorMessage });
    }
  }
}

function shouldForceToolChoice(messages: any[]): boolean {
  // Get the last user message
  const lastUserMessage = [...messages]
    .reverse()
    .find(msg => msg.role === 'user');
    
  if (!lastUserMessage) return false;
  
  const content = lastUserMessage.content.toLowerCase();
  
  // Force tool choice for product queries, especially coffee
  const coffeeTerms = ['caffè', 'caffe', 'coffee', 'espresso'];
  const productTerms = ['prodotti', 'products', 'avete', 'have', 'vendete', 'sell', 'vino', 'wine', 'formaggio', 'cheese', 'pasta', 'olio', 'oil'];
  const questionPhrases = ['do you have', 'avete', 'vendete', 'ce l\'hai', 'ce l\'avete', 'disponibile', 'disponibili'];
  
  // Special case for coffee - always force tool choice
  if (coffeeTerms.some(term => content.includes(term))) {
    return true;
  }
  
  // Check if the message contains product-related terms
  const hasProductTerm = productTerms.some(term => content.includes(term));
  const isQuestion = questionPhrases.some(phrase => content.includes(phrase)) || content.includes('?');
  
  return hasProductTerm && isQuestion;
}

export default new ChatController(); 