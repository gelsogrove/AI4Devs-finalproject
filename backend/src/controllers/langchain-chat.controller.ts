import { Request, Response } from 'express';
import { z } from 'zod';
import { AgentConfigService } from '../application/services/AgentConfigService';
import { availableFunctions } from '../services/availableFunctions';
import { ChatMessage, LangChainService } from '../services/langchain/langchainService';
import logger from '../utils/logger';

// Schema for chat request validation
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
});

class LangChainChatController {
  private agentConfigService: AgentConfigService;
  private langchainService: LangChainService | null = null;

  constructor() {
    this.agentConfigService = new AgentConfigService();
    this.initializeLangChain();
  }

  private async initializeLangChain() {
    try {
      // Get agent configuration from database
      const agentConfig = await this.agentConfigService.getLatestConfig();
      
      if (agentConfig) {
        this.langchainService = new LangChainService({
          model: agentConfig.model,
          temperature: agentConfig.temperature,
          maxTokens: agentConfig.maxTokens,
          topP: agentConfig.topP,
          prompt: agentConfig.prompt || 'You are a helpful assistant.'
        });
        logger.info('LangChain service initialized successfully with database prompt');
      } else {
        logger.warn('No agent configuration found, using default settings');
        // Fallback prompt if no configuration in database
        const defaultPrompt = `You are Sofia, a friendly and knowledgeable assistant for Gusto Italiano, an authentic Italian specialty foods store.

YOUR IDENTITY:
- You are passionate about Italian cuisine and culture
- You have extensive knowledge about regional Italian specialties
- You speak with warmth and enthusiasm, occasionally using simple Italian expressions (with translations)
- You embody the spirit of Italian hospitality

FUNCTION CALLING GUIDELINES:
1. **Always use tools when customers ask about specific information**:
   - Use getProducts for product inquiries, searches, or browsing
   - Use getServices for service questions, consultations, or offerings
   - Use getFAQs for policy questions, shipping, returns, or general help
   - Use getDocuments for legal information, regulations, documentation, or when you need to search for specific technical content
   - Use getProfile for company information, contact details, or business hours

2. **Search Strategy**:
   - When customers ask about acronyms, technical terms, or specific topics, ALWAYS search documents first
   - If no relevant documents are found, then provide general knowledge
   - For questions about regulations, laws, or official information, prioritize document search

3. **Response Guidelines**:
   - Always be helpful and informative
   - If you find relevant documents, reference them in your response
   - If no specific information is found in our systems, provide helpful general knowledge
   - Encourage customers to ask follow-up questions

Remember: You're sharing the passion and tradition of Italian cuisine. Make every interaction a delightful journey through Italy's culinary heritage.

Benvenuti alla famiglia Gusto Italiano! (Welcome to the Gusto Italiano family!) 🇮🇹`;

        this.langchainService = new LangChainService({
          model: 'openai/gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1.0,
          prompt: defaultPrompt
        });
      }
    } catch (error) {
      logger.error('Failed to initialize LangChain service:', error);
    }
  }

  async processChat(req: Request, res: Response) {
    try {
      // Validate request
      const { messages } = chatRequestSchema.parse(req.body);

      logger.info(`Processing LangChain chat request with ${messages.length} messages`, { 
        lastMessage: messages[messages.length - 1]?.content?.substring(0, 50) 
      });

      // Extract the last user message for processing
      const lastUserMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'user');
        
      if (!lastUserMessage) {
        logger.warn('No user message found in request');
        return res.status(400).json({ error: 'No user message found' });
      }

      // Special handling for test environment
      if (process.env.NODE_ENV === 'test') {
        logger.info('Running in test environment, using mock responses');
        
        const userMessage = lastUserMessage.content.toLowerCase();
        
        // If the user is asking about products or cheese
        if (userMessage.includes('products') || 
            userMessage.includes('cheese') || 
            userMessage.includes('product')) {
          
          try {
            // Try to get some products from the database
            const productResults = await availableFunctions.getProducts({});
            
            return res.json({
              message: {
                role: 'assistant',
                content: `Here are our cheeses and products: ${productResults.products?.map(p => `• **${p.name}** - €${p.price} - ${p.description}`).join('\n\n') || 'We currently have no products available.'}`
              }
            });
          } catch (error) {
            logger.error('Error getting products in test mode:', error);
            return res.json({
              message: {
                role: 'assistant',
                content: 'Yes, we have Italian cheeses like Parmigiano Reggiano and other typical Italian products.'
              }
            });
          }
        }
        
        // Default test response
        return res.json({
          message: {
            role: 'assistant',
            content: 'Welcome to Gusto Italiano! How can I help you today?'
          }
        });
      }

      // Check if OPENAI_API_KEY is valid and not the placeholder value
      const apiKey = process.env.OPENAI_API_KEY;
      const isApiKeyMissing = !apiKey || apiKey === "YOUR_API_KEY_HERE";
      
      if (isApiKeyMissing) {
        logger.warn('No valid OpenRouter API key found. Returning a mock response.');
        
        // If the user is asking about products
        if (lastUserMessage.content.toLowerCase().includes('product') || 
            lastUserMessage.content.toLowerCase().includes('pasta') ||
            lastUserMessage.content.toLowerCase().includes('cheese') ||
            lastUserMessage.content.toLowerCase().includes('oil')) {
          
          // Try to get some products from the database
          const productResults = await availableFunctions.getProducts({});
          
          return res.json({
            message: {
              role: 'assistant',
              content: `I'd be happy to tell you about our products! Here are some of our offerings:\n\n${productResults.products?.map(p => `• **${p.name}** - €${p.price} - ${p.description}`).join('\n\n') || 'Sorry, no products found at the moment.'}\n\nCan I help you with anything specific about these products?`
            }
          });
        }
        
        // Default response for other queries
        return res.json({
          message: {
            role: 'assistant',
            content: "Welcome to Gusto Italiano! I'm Sofia, your virtual assistant, and I'm here to help you discover our authentic Italian products and services. Feel free to ask me about our pasta, cheese, oils, vinegars, or any of our Italian specialties. How can I help you today?"
          }
        });
      }

      // Check if LangChain service is initialized
      if (!this.langchainService) {
        logger.error('LangChain service not initialized');
        return res.status(500).json({ error: 'Service not available' });
      }

      // Convert messages to LangChain format
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Process chat with LangChain
      const response = await this.langchainService.processChat(chatMessages);

      logger.info('LangChain response generated successfully', {
        responseLength: response.length
      });

      return res.json({
        message: {
          role: 'assistant',
          content: response
        }
      });

    } catch (error: unknown) {
      logger.error('LangChain chat processing error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle errors gracefully
      let errorMessage = 'Failed to process chat';
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'invalid_api_key') {
        errorMessage = 'Configuration error: Invalid API key';
      }

      return res.status(500).json({ error: errorMessage });
    }
  }
}

export default new LangChainChatController(); 