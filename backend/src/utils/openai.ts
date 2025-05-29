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

// Flag to determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create a separate OpenAI client for embeddings
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || ''
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
 * Generate a fake embedding vector for development use
 * This creates a consistent vector based on the hash of the input text
 * @param text Input text to generate a fake embedding for
 * @returns A vector of 1536 dimensions with values between -1 and 1
 */
function generateFakeEmbedding(text: string): number[] {
  // Simple string hash function
  const hash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  // Create a deterministic but seemingly random embedding based on text
  const embedding: number[] = [];
  const hashValue = hash(text);
  
  // Generate 1536 dimensions (same as OpenAI's embeddings)
  for (let i = 0; i < 1536; i++) {
    // Use a simple pseudo-random formula based on the hash and position
    const value = Math.sin(hashValue * (i + 1) * 0.1) * 0.5;
    embedding.push(value);
  }

  return embedding;
}

/**
 * Centralized AI service for all AI operations
 */
class AIService {
  /**
   * Generate embeddings for a text
   * In development, generates fake embeddings for testing
   * In production, uses OpenAI API
   * @param text The text to generate embeddings for
   * @returns An array of embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // In development mode, use fake embeddings
    if (isDevelopment) {
      logger.info('Using fake embeddings in development mode');
      return generateFakeEmbedding(text);
    }
    
    try {
      // In production, use OpenAI API
      const response = await openAIClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      // Fall back to fake embeddings if API call fails
      logger.info('Falling back to fake embeddings');
      return generateFakeEmbedding(text);
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
      logger.info(`Params: ${JSON.stringify(params)}`);
      
      // Check if OpenRouter API key is available, otherwise use OpenAI directly
      if (!isApiKeyValid) {
        logger.info('OpenRouter API key not valid, using OpenAI directly...');
        
        // Use OpenAI directly with a simpler model
        const openAIModel = model.includes('gpt') ? 'gpt-3.5-turbo' : 'gpt-3.5-turbo';
        
        const response = await openAIClient.chat.completions.create({
          model: openAIModel,
          messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 500,
          top_p: params.topP ?? 0.9,
          tools: params.tools ?? undefined,
          tool_choice: params.toolChoice ?? undefined
        });
        
        logger.info('OpenAI API call successful');
        return response;
      }
      
      // Ensure the model is in the correct format for OpenRouter
      const openRouterModel = getCompatibleModel(model);
      
      logger.info(`Using model: ${openRouterModel} (from ${model})`);
      
      const requestPayload = {
        model: openRouterModel,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 500,
        top_p: params.topP ?? 0.9,
        tools: params.tools ?? undefined,
        tool_choice: params.toolChoice ?? undefined
      };
      
      logger.info(`Request payload: ${JSON.stringify(requestPayload)}`);
      
      const response = await openRouterClient.chat.completions.create(requestPayload);

      logger.info('OpenRouter API call successful');
      logger.info(`Response: ${JSON.stringify(response)}`);
      
      return response;
    } catch (error: unknown) {
      logger.error('Error generating chat completion:', error);
      
      // Add more detailed logging for debugging
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 400) {
        const apiError = error as any;
        logger.error(`Model error: ${apiError.error?.message}`);
        
        // Try with OpenAI as fallback
        logger.info('Attempting fallback to OpenAI...');
        try {
          const fallbackResponse = await openAIClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 500,
            top_p: params.topP ?? 0.9,
            tools: params.tools ?? undefined,
            tool_choice: params.toolChoice ?? undefined
          });
          logger.info('OpenAI fallback successful');
          return fallbackResponse;
        } catch (fallbackError) {
          logger.error('OpenAI fallback also failed:', fallbackError);
        }
      }
      
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