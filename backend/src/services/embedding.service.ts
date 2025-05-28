import { PrismaClient } from '@prisma/client';
import { FAQ } from '../domain/interfaces/faq.interface';
import logger from '../utils/logger';
import { aiService, splitIntoChunks } from '../utils/openai';

const prisma = new PrismaClient();

// Extend PrismaClient for missing types
type PrismaExtended = PrismaClient & {
  fAQChunk: {
    deleteMany: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  }
};

const prismaClient = prisma as PrismaExtended;

type FAQChunkWithFAQ = {
  id: string;
  content: string;
  embedding: string | null;
  faqId: string;
  createdAt: Date;
  updatedAt: Date;
  faq: {
    id: string;
    question: string;
    answer: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

class EmbeddingService {
  /**
   * Generate embeddings for a single FAQ and store in database
   */
  async generateEmbeddingsForFAQ(faqId: string): Promise<void> {
    try {
      // Get FAQ from database
      const faq = await prisma.fAQ.findUnique({
        where: { id: faqId },
      });

      if (!faq) {
        throw new Error('FAQ not found');
      }

      // Generate embedding for combined question and answer
      const combinedText = `${faq.question}\n${faq.answer}`;
      
      // Split the FAQ content into chunks
      const contentChunks = splitIntoChunks(combinedText);

      // Delete existing chunks for this FAQ
      await prismaClient.fAQChunk.deleteMany({
        where: { faqId },
      });

      // Generate embeddings for each chunk and save
      for (const chunk of contentChunks) {
        // Generate embedding using OpenAI
        const embedding = await aiService.generateEmbedding(chunk);
        
        // Save chunk with embedding
        await prismaClient.fAQChunk.create({
          data: {
            content: chunk,
            embedding: JSON.stringify(embedding), // Store as JSON string
            faqId: faq.id,
          },
        });
      }

      logger.info(`Generated embeddings for FAQ ${faqId}`);

    } catch (error) {
      logger.error(`Error generating embeddings for FAQ ${faqId}:`, error);
      throw new Error('Failed to generate embeddings for FAQ');
    }
  }

  /**
   * Generate embeddings for all FAQs
   */
  async generateEmbeddingsForAllFAQs(): Promise<void> {
    try {
      const faqs = await prisma.fAQ.findMany();
      
      for (const faq of faqs) {
        await this.generateEmbeddingsForFAQ(faq.id);
      }
    } catch (error) {
      logger.error('Error generating embeddings for all FAQs:', error);
      throw new Error('Failed to generate embeddings for all FAQs');
    }
  }

  /**
   * Search FAQs using embeddings
   */
  async searchFAQs(query: string, limit = 5): Promise<FAQ[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // Get all FAQ chunks with their embeddings
      const chunks = await prisma.fAQChunk.findMany({
        include: {
          faq: true
        }
      }) as FAQChunkWithFAQ[];

      // If no chunks found, fall back to text search
      if (!chunks || chunks.length === 0) {
        logger.info('No FAQ chunks found, falling back to text search');
        return this.textSearchFAQs(query, limit);
      }

      // Calculate cosine similarity between query and each chunk
      const chunksWithSimilarity = chunks.map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embedding || '[]');
          const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
          return { ...chunk, similarity };
        } catch (error) {
          logger.error(`Error parsing embedding for chunk ${chunk.id}:`, error);
          return { ...chunk, similarity: 0 };
        }
      });

      // Sort by similarity and get top chunks
      const topChunks = chunksWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      // If no chunks with similarity > 0, fall back to text search
      if (topChunks.length === 0 || topChunks[0].similarity === 0) {
        logger.info('No relevant chunks found, falling back to text search');
        return this.textSearchFAQs(query, limit);
      }

      // Get unique FAQs from top chunks and transform to FAQ interface
      const uniqueFaqs = Array.from(
        new Map(topChunks.map(chunk => [chunk.faq.id, chunk.faq]))
      ).map(([_, faq]) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      }));

      return uniqueFaqs;
    } catch (error) {
      logger.error('Error searching FAQs:', error);
      // Fallback to text search if embedding search fails
      return this.textSearchFAQs(query, limit);
    }
  }

  /**
   * Fallback text search for FAQs
   */
  private async textSearchFAQs(query: string, limit = 5): Promise<FAQ[]> {
    try {
      const faqs = await prisma.fAQ.findMany({
        where: {
          OR: [
            { question: { contains: query } },
            { answer: { contains: query } }
          ]
        },
        take: limit
      });
      
      // Transform to FAQ interface
      return faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      }));
    } catch (error) {
      logger.error('Error in text search fallback:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    // Check for empty vectors or different lengths
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }
    
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    
    // Avoid division by zero
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    const similarity = dotProduct / (normA * normB);
    
    // Handle potential NaN or Infinity values
    return isNaN(similarity) || !isFinite(similarity) ? 0 : similarity;
  }

  /**
   * Generate embeddings for a single service and store in database
   */
  async generateEmbeddingsForService(serviceId: string): Promise<void> {
    try {
      // Get service from database
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Only generate embeddings for active services
      if (!service.isActive) {
        logger.info(`Skipping inactive service ${serviceId}`);
        return;
      }

      // Generate embedding for combined name, description and price
      const combinedText = `${service.name} - ${service.description} - Price: €${service.price}`;
      
      // Generate embedding using OpenAI
      const embedding = await aiService.generateEmbedding(combinedText);
      
      // Update service with embedding
      await prisma.service.update({
        where: { id: serviceId },
        data: {
          embedding: JSON.stringify(embedding), // Store as JSON string
        },
      });

      logger.info(`Generated embeddings for service ${serviceId}`);

    } catch (error) {
      logger.error(`Error generating embeddings for service ${serviceId}:`, error);
      throw new Error('Failed to generate embeddings for service');
    }
  }

  /**
   * Clear all service embeddings
   */
  async clearServiceEmbeddings(): Promise<void> {
    try {
      await prisma.service.updateMany({
        data: {
          embedding: null,
        },
      });

      logger.info('Cleared all service embeddings');
    } catch (error) {
      logger.error('Error clearing service embeddings:', error);
      throw new Error('Failed to clear service embeddings');
    }
  }

  /**
   * Search services using embeddings
   */
  async searchServices(query: string, limit = 5): Promise<any[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // Get all active services with embeddings
      const services = await prisma.service.findMany({
        where: {
          isActive: true,
          embedding: { not: null }
        }
      });

      // If no services found, fall back to text search
      if (!services || services.length === 0) {
        logger.info('No services with embeddings found, falling back to text search');
        return this.textSearchServices(query, limit);
      }

      // Calculate cosine similarity between query and each service
      const servicesWithSimilarity = services.map(service => {
        try {
          const serviceEmbedding = JSON.parse(service.embedding || '[]');
          const similarity = this.cosineSimilarity(queryEmbedding, serviceEmbedding);
          return { ...service, similarity };
        } catch (error) {
          logger.error(`Error parsing embedding for service ${service.id}:`, error);
          return { ...service, similarity: 0 };
        }
      });

      // Sort by similarity and get top services
      const topServices = servicesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      // If no services with similarity > 0, fall back to text search
      if (topServices.length === 0 || topServices[0].similarity === 0) {
        logger.info('No relevant services found, falling back to text search');
        return this.textSearchServices(query, limit);
      }

      return topServices;
    } catch (error) {
      logger.error('Error searching services:', error);
      // Fallback to text search if embedding search fails
      return this.textSearchServices(query, limit);
    }
  }

  /**
   * Fallback text search for services
   */
  private async textSearchServices(query: string, limit = 5): Promise<any[]> {
    try {
      const services = await prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        take: limit
      });
      
      return services;
    } catch (error) {
      logger.error('Error in service text search fallback:', error);
      return [];
    }
  }
}

export default new EmbeddingService(); 