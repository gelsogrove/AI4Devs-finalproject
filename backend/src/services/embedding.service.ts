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
      const faqs = await prisma.fAQ.findMany({
        where: {
          isActive: true
        }
      });
      
      logger.info(`Found ${faqs.length} active FAQs to process`);
      
      for (const faq of faqs) {
        await this.generateEmbeddingsForFAQ(faq.id);
      }
      
      logger.info(`Generated embeddings for ${faqs.length} FAQs`);
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

      // If no chunks found, return empty results (don't fall back to text search)
      if (!chunks || chunks.length === 0) {
        logger.info('No FAQ chunks found in database');
        return [];
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
        .slice(0, limit * 3); // Get more chunks to ensure we find relevant ones
      
      // Also check for keyword matches in case embedding similarity is low
      const keywordMatches = chunksWithSimilarity.filter(chunk => {
        const queryLower = query.toLowerCase();
        const questionLower = chunk.faq.question.toLowerCase();
        const answerLower = chunk.faq.answer.toLowerCase();
        
        // Check if query words appear in question or answer
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        return queryWords.some(word => 
          questionLower.includes(word) || answerLower.includes(word)
        );
      });
      
      // Combine similarity results with keyword matches
      const combinedChunks = [...topChunks];
      keywordMatches.forEach(match => {
        if (!combinedChunks.find(chunk => chunk.id === match.id)) {
          combinedChunks.push(match);
        }
      });
      
      // Sort combined results by similarity (but include keyword matches even if low similarity)
      const finalChunks = combinedChunks
        .sort((a, b) => {
          // Prioritize keyword matches
          const aHasKeyword = keywordMatches.some(km => km.id === a.id);
          const bHasKeyword = keywordMatches.some(km => km.id === b.id);
          
          if (aHasKeyword && !bHasKeyword) return -1;
          if (!aHasKeyword && bHasKeyword) return 1;
          
          // Then sort by similarity
          return b.similarity - a.similarity;
        })
        .slice(0, limit * 2); // Take more results to ensure we get relevant ones
      
      // Always return results from embedding search, even if similarity is low
      // This forces the system to use vector search instead of falling back
      logger.info(`Found ${finalChunks.length} chunks, top similarity: ${finalChunks[0]?.similarity || 0}, keyword matches: ${keywordMatches.length}`);

      // Get unique FAQs from final chunks and transform to FAQ interface
      const uniqueFaqs = Array.from(
        new Map(finalChunks.map(chunk => [chunk.faq.id, chunk.faq]))
      ).map(([_, faq]) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      })).slice(0, limit); // Limit to requested number

      logger.info(`Returning ${uniqueFaqs.length} unique FAQs from embedding search`);
      return uniqueFaqs;
    } catch (error) {
      logger.error('Error searching FAQs:', error);
      // Return empty results instead of falling back to text search
      return [];
    }
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
   * Get FAQ chunks for a specific FAQ (debug method)
   */
  async getFAQChunks(faqId: string): Promise<any[]> {
    try {
      const chunks = await prisma.fAQChunk.findMany({
        where: { faqId },
        include: {
          faq: true
        }
      });
      return chunks;
    } catch (error) {
      logger.error(`Error getting FAQ chunks for ${faqId}:`, error);
      throw new Error('Failed to get FAQ chunks');
    }
  }

  /**
   * Get all FAQ chunks (debug method)
   */
  async getAllFAQChunks(): Promise<any[]> {
    try {
      const chunks = await prisma.fAQChunk.findMany({
        include: {
          faq: true
        }
      });
      return chunks;
    } catch (error) {
      logger.error('Error getting all FAQ chunks:', error);
      throw new Error('Failed to get all FAQ chunks');
    }
  }

  /**
   * Clear all FAQ chunks from the database
   */
  async clearAllFAQChunks(): Promise<void> {
    try {
      await prisma.fAQChunk.deleteMany({});
      logger.info('Cleared all FAQ chunks');
    } catch (error) {
      logger.error('Error clearing all FAQ chunks:', error);
      throw new Error('Failed to clear all FAQ chunks');
    }
  }

  /**
   * Debug search FAQs with detailed similarity scores
   */
  async debugSearchFAQs(query: string, limit = 5): Promise<any> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // Get all FAQ chunks with their embeddings
      const chunks = await prisma.fAQChunk.findMany({
        include: {
          faq: true
        }
      }) as FAQChunkWithFAQ[];

      if (!chunks || chunks.length === 0) {
        return {
          query,
          queryEmbeddingLength: queryEmbedding.length,
          totalChunks: 0,
          results: [],
          error: 'No FAQ chunks found'
        };
      }

      // Calculate cosine similarity between query and each chunk
      const chunksWithSimilarity = chunks.map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embedding || '[]');
          const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
          return { 
            ...chunk, 
            similarity,
            embeddingLength: chunkEmbedding.length,
            hasValidEmbedding: Array.isArray(chunkEmbedding) && chunkEmbedding.length > 0
          };
        } catch (error) {
          logger.error(`Error parsing embedding for chunk ${chunk.id}:`, error);
          return { 
            ...chunk, 
            similarity: 0,
            embeddingLength: 0,
            hasValidEmbedding: false
          };
        }
      });

      // Sort by similarity
      const sortedChunks = chunksWithSimilarity
        .sort((a, b) => b.similarity - a.similarity);

      return {
        query,
        queryEmbeddingLength: queryEmbedding.length,
        totalChunks: chunks.length,
        results: sortedChunks.map(chunk => ({
          faqId: chunk.faqId,
          faqQuestion: chunk.faq.question,
          chunkContent: chunk.content.substring(0, 200) + '...',
          similarity: chunk.similarity,
          embeddingLength: chunk.embeddingLength,
          hasValidEmbedding: chunk.hasValidEmbedding
        })),
        topResults: sortedChunks.slice(0, limit).map(chunk => ({
          faqQuestion: chunk.faq.question,
          similarity: chunk.similarity
        }))
      };
    } catch (error) {
      logger.error('Error in debug search FAQs:', error);
      return {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: []
      };
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

  /**
   * Generate embeddings for a single document and store in database
   */
  async generateEmbeddingsForDocument(documentId: string): Promise<void> {
    try {
      logger.info(`Generating embeddings for document ${documentId}`);
      
      // Get document from database
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Only generate embeddings for completed documents
      if (document.status !== 'COMPLETED') {
        logger.info(`Skipping document ${documentId} - not completed`);
        return;
      }

      // For now, we'll use the document title and metadata as content
      // In a real implementation, you would extract text from the PDF file
      let documentContent = `${document.title || document.originalName}`;
      
      // Add metadata content if available
      if (document.metadata) {
        try {
          const metadata = JSON.parse(document.metadata);
          
          // Add description if available
          if (metadata.description) {
            documentContent += `\n${metadata.description}`;
          }
          
          // Add keywords if available
          if (metadata.keywords && Array.isArray(metadata.keywords)) {
            documentContent += `\nKeywords: ${metadata.keywords.join(', ')}`;
          }
          
          // Add any other relevant metadata fields
          if (metadata.title && metadata.title !== document.title) {
            documentContent += `\nAlternative title: ${metadata.title}`;
          }
          
        } catch (error) {
          logger.warn(`Failed to parse metadata for document ${documentId}:`, error);
          documentContent += `\n${document.metadata}`;
        }
      }
      
      // Split the document content into chunks
      const contentChunks = splitIntoChunks(documentContent);

      // Delete existing chunks for this document
      await prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      // Generate embeddings for each chunk and save
      for (let i = 0; i < contentChunks.length; i++) {
        const chunk = contentChunks[i];
        
        // Generate embedding using OpenAI
        const embedding = await aiService.generateEmbedding(chunk);
        
        // Save chunk with embedding
        await prisma.documentChunk.create({
          data: {
            content: chunk,
            chunkIndex: i,
            pageNumber: 1, // Default to page 1 for now
            embedding: JSON.stringify(embedding), // Store as JSON string
            documentId: document.id,
          },
        });
      }

      logger.info(`Generated embeddings for document ${documentId} with ${contentChunks.length} chunks`);

    } catch (error) {
      logger.error(`Error generating embeddings for document ${documentId}:`, error);
      throw new Error('Failed to generate embeddings for document');
    }
  }

  /**
   * Generate embeddings for all completed documents
   */
  async generateEmbeddingsForAllDocuments(): Promise<void> {
    try {
      logger.info('Generating embeddings for all documents');
      
      // Get all completed documents from database
      const documents = await prisma.document.findMany({
        where: {
          status: 'COMPLETED'
        }
      });
      
      logger.info(`Found ${documents.length} completed documents`);
      
      for (const document of documents) {
        await this.generateEmbeddingsForDocument(document.id);
      }
      
      logger.info(`Generated embeddings for ${documents.length} documents`);
    } catch (error) {
      logger.error('Error generating embeddings for all documents:', error);
      throw new Error('Failed to generate embeddings for all documents');
    }
  }

  /**
   * Search documents using embeddings
   */
  async searchDocuments(query: string, limit = 5): Promise<any[]> {
    try {
      logger.info(`Searching documents with query: ${query}`);
      
      // Generate embedding for the search query
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // Get all document chunks with their embeddings
      const chunks = await prisma.documentChunk.findMany({
        include: {
          document: true
        },
        where: {
          document: {
            status: 'COMPLETED'
          }
        }
      });

      // If no chunks found, fall back to text search
      if (!chunks || chunks.length === 0) {
        logger.info('No document chunks found, falling back to text search');
        return this.textSearchDocuments(query, limit);
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
        return this.textSearchDocuments(query, limit);
      }

      // Get unique documents from top chunks and transform to expected format
      const uniqueDocuments = Array.from(
        new Map(topChunks.map(chunk => [chunk.document.id, chunk.document]))
      ).map(([_, document]) => ({
        id: document.id,
        title: document.title || document.originalName,
        originalName: document.originalName,
        filename: document.filename,
        content: topChunks.find(c => c.document.id === document.id)?.content || '',
        similarity: topChunks.find(c => c.document.id === document.id)?.similarity || 0,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }));

      logger.info(`Found ${uniqueDocuments.length} documents matching query`);
      return uniqueDocuments;

    } catch (error) {
      logger.error('Error searching documents:', error);
      // Fallback to text search if embedding search fails
      return this.textSearchDocuments(query, limit);
    }
  }

  /**
   * Fallback text search for documents
   */
  private async textSearchDocuments(query: string, limit: number): Promise<any[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            { title: { contains: query } },
            { originalName: { contains: query } },
            { metadata: { contains: query } }
          ]
        },
        take: limit
      });
      
      // Transform to expected format
      return documents.map(document => ({
        id: document.id,
        title: document.title || document.originalName,
        originalName: document.originalName,
        filename: document.filename,
        content: document.metadata || '',
        similarity: 0.5, // Default similarity for text search
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }));
    } catch (error) {
      logger.error('Error in text search for documents:', error);
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
}

export default new EmbeddingService(); 