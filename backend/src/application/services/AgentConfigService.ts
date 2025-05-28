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
      
      // If no config exists, return null - let the caller handle defaults
      if (!config) {
        return null;
      }
      
      return {
        ...config,
        // Ensure model is always set to OpenRouter format
        model: config.model.includes('/') ? config.model : `openai/${config.model}`
      };
    } catch (error) {
      console.error('Error getting agent config:', error);
      // Return null on error - let the caller handle it
      return null;
    }
  }
} 