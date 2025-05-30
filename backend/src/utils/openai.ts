import OpenAI from 'openai';
import logger from './logger';

// Create a single instance for both embedding and chat completions using OpenRouter
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const isApiKeyValid = openRouterApiKey && openRouterApiKey !== 'YOUR_API_KEY_HERE';

// Log API key validity (not the actual key)
logger.info(`OpenRouter API key validity: ${isApiKeyValid ? 'valid' : 'invalid or missing'}`);
logger.info(`API key length: ${openRouterApiKey.length}`);
logger.info(`API key starts with: ${openRouterApiKey.substring(0, 10)}...`);

const openRouterClient = new OpenAI({
  apiKey: openRouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
    'X-Title': 'Gusto Italiano Shop'
  }
});

// Create a separate OpenAI client for embeddings
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Map of model names to their OpenRouter compatible versions
const MODEL_MAPPING: Record<string, string> = {
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  'gpt-4': 'openai/gpt-4',
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  'claude-3-haiku-20240307': 'anthropic/claude-3-haiku',
  'claude-3-opus': 'anthropic/claude-3-opus',
  'claude-3-sonnet': 'anthropic/claude-3-sonnet',
};

// Function to get compatible model name
function getCompatibleModel(modelName: string): string {
  // If already in the OpenRouter format (contains a slash), return as is
  if (modelName.includes('/')) {
    return modelName;
  }
  
  // Return the mapped name or default to gpt-3.5-turbo if not found
  return MODEL_MAPPING[modelName] || 'openai/gpt-3.5-turbo';
}

/**
 * Split a text into chunks of approximately the specified size
 * @param text The text to split into chunks
 * @param chunkSize The approximate size of each chunk
 * @param overlap The number of characters to overlap between chunks
 * @returns An array of text chunks
 */
export function splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // If we're not at the end of the text, try to find a good breakpoint
    if (endIndex < text.length) {
      // Look for the last period, question mark, exclamation point, or newline within the chunk
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastQuestion = text.lastIndexOf('?', endIndex);
      const lastExclamation = text.lastIndexOf('!', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      
      // Find the latest of these breakpoints that's within the chunk
      const breakpoints = [lastPeriod, lastQuestion, lastExclamation, lastNewline]
        .filter(bp => bp >= startIndex && bp < endIndex);
      
      if (breakpoints.length > 0) {
        // Use the latest breakpoint plus 1 to include the breakpoint character
        endIndex = Math.max(...breakpoints) + 1;
      }
    }
    
    // Add the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move the start index for the next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    
    // Make sure we're making forward progress
    if (startIndex <= 0 || startIndex >= text.length - 1) {
      break;
    }
  }

  return chunks;
}

/**
 * Centralized AI service for all AI operations
 */
class AIService {
  /**
   * Generate embeddings for a text
   * Uses OpenRouter API for embeddings
   * @param text The text to generate embeddings for
   * @returns An array of embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check if we have a valid OpenRouter API key
    const hasValidApiKey = openRouterApiKey && openRouterApiKey !== '';
    
    if (!hasValidApiKey) {
      logger.error('No valid OpenRouter API key available for embeddings');
      throw new Error('No valid API key available for embeddings');
    }
    
    try {
      // Use OpenRouter API for embeddings
      const response = await openRouterClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });

      logger.info('Using real OpenRouter embeddings');
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding via OpenRouter:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Generate a chat completion using the OpenRouter API
   * @param messages The messages to send to the model
   * @param model The model to use
   * @param params Additional parameters for the request
   * @returns The model's response
   */
  async generateChatCompletion(
    messages: any[],
    model = 'gpt-4-turbo',
    params: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      tools?: any[];
      toolChoice?: 'auto' | 'none' | any;
    } = {}
  ) {
    try {
      logger.info('Starting generateChatCompletion...');
      logger.info(`Input messages: ${JSON.stringify(messages)}`);
      logger.info(`Model: ${model}`);
      
      // Check if we have a valid OpenAI API key and prefer it over OpenRouter
      const openaiKey = process.env.OPENAI_API_KEY;
      
      // OpenAI keys start with 'sk-' but NOT 'sk-or-' (which is OpenRouter)
      if (openaiKey && openaiKey.startsWith('sk-') && !openaiKey.startsWith('sk-or-')) {
        logger.info('Using direct OpenAI API');
        
        // Use OpenAI directly for better reliability
        const openaiDirectClient = new OpenAI({
          apiKey: openaiKey
        });
        
        // Map model to OpenAI compatible version
        let openaiModel = model;
        if (model.includes('/')) {
          // Extract model name from OpenRouter format
          openaiModel = model.split('/')[1] || 'gpt-3.5-turbo';
        }
        
        const requestParams: any = {
          model: openaiModel,
          messages: messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 1000,
          top_p: params.topP || 1.0,
        };
        
        if (params.tools && params.tools.length > 0) {
          requestParams.tools = params.tools;
          requestParams.tool_choice = params.toolChoice || 'auto';
        }
        
        logger.info(`OpenAI request params: ${JSON.stringify(requestParams)}`);
        
        const response = await openaiDirectClient.chat.completions.create(requestParams);
        
        logger.info('OpenAI response received successfully');
        return response;
      }
      
      // Check if we have a valid OpenRouter key
      if (!isApiKeyValid) {
        logger.error('No valid API key available for chat completion');
        throw new Error('No valid API key available');
      }
      
      logger.info('Using OpenRouter API');
      
      const compatibleModel = getCompatibleModel(model);
      logger.info(`Compatible model: ${compatibleModel}`);
      
      const requestParams: any = {
        model: compatibleModel,
        messages: messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 1000,
        top_p: params.topP || 1.0,
      };
      
      if (params.tools && params.tools.length > 0) {
        requestParams.tools = params.tools;
        requestParams.tool_choice = params.toolChoice || 'auto';
      }
      
      logger.info(`OpenRouter request params: ${JSON.stringify(requestParams)}`);
      
      const response = await openRouterClient.chat.completions.create(requestParams);
      
      logger.info('OpenRouter response received successfully');
      return response;
      
    } catch (error: unknown) {
      logger.error('Error generating chat completion:', error);
      throw new Error('Failed to generate response');
    }
  }
}

// Create a singleton instance
const aiService = new AIService();

// Export for backward compatibility
export async function generateEmbedding(text: string): Promise<number[]> {
  return aiService.generateEmbedding(text);
}

// For backward compatibility
export async function generateChatCompletion(
  prompt: string, 
  model = 'gpt-4-turbo',
  temperature = 0.7,
  maxTokens = 500
): Promise<string> {
  const response = await aiService.generateChatCompletion(
    [{ role: 'user', content: prompt }],
    model,
    { temperature, maxTokens }
  );
  
  return response.choices[0].message.content || '';
}

// Export the service instance and the original OpenAI clients for direct access if needed
export {
  aiService,
  openRouterClient
};

// Export the service as the default for easy imports
export default aiService; 