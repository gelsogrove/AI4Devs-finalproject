import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentConfigService {
  /**
   * Get the latest agent configuration
   */
  async getLatestConfig() {
    try {
      // Get the most recently updated agent config
      const config = await prisma.agentConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      
      // If no config exists, return default values
      if (!config) {
        return {
          temperature: 0.7,
          maxTokens: 500,
          topP: 0.9,
          model: 'gpt-4-turbo',
          prompt: 'You are Gusto Italiano, an AI assistant for an Italian specialty food store. Answer questions about our products and services helpfully and accurately. You understand both English and Italian. For product information, use the product search function.'
        };
      }
      
      return config;
    } catch (error) {
      console.error('Error getting agent config:', error);
      // Return default values if there's an error
      return {
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        model: 'gpt-4-turbo',
        prompt: 'You are Gusto Italiano, an AI assistant for an Italian specialty food store. Answer questions about our products and services helpfully and accurately. You understand both English and Italian. For product information, use the product search function.'
      };
    }
  }
} 