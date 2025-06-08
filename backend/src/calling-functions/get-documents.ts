import { PrismaClient } from '@prisma/client';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get documents with optional filters
 */
export const getDocuments = async (filters: { search?: string; path?: string; limit?: number; isActive?: boolean }) => {
  try {
    const { search, path, limit = 5, isActive } = filters;
    
    logger.info(`getDocuments called with filters:`, { search, path, limit, isActive });
    
    // If we have a search query, try embedding search first
    if (search) {
      try {
        logger.info(`Trying embedding search for: ${search}`);
        // Use embedding search for documents
        const documents = await embeddingService.searchDocuments(search, limit);
        
        logger.info(`Embedding search returned ${documents.length} documents`);
        
        // Filter by isActive if specified
        let filteredDocuments = documents;
        if (typeof isActive === 'boolean') {
          filteredDocuments = documents.filter(doc => doc.isActive === isActive);
        }
        
        // Filter by path if provided
        if (path) {
          filteredDocuments = filteredDocuments.filter(doc =>
            doc.title?.toLowerCase().includes(path.toLowerCase()) ||
            doc.originalName?.toLowerCase().includes(path.toLowerCase())
          );
        }

        // If embedding search found results, return them
        if (filteredDocuments.length > 0) {
          logger.info(`Returning ${filteredDocuments.length} documents from embedding search`);
          return {
            documents: filteredDocuments.map(doc => ({
              id: doc.id,
              title: doc.title || doc.originalName,
              originalName: doc.originalName,
              filename: doc.filename,
              content: doc.content?.substring(0, 300) + '...' || 'No content available',
              similarity: doc.similarity || 0,
              status: doc.status,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt
            })),
            total: filteredDocuments.length,
            searchType: 'embedding',
            query: search,
            path: path || ''
          };
        } else {
          logger.info('Embedding search returned no results, falling back to text search');
        }
      } catch (embeddingError) {
        logger.error('Document embedding search failed, falling back to text search:', embeddingError);
        // Continue with fallback below
      }
    }

    // Fallback: Use text search directly instead of embedding search (which is failing)
    try {
      const where: any = {
        status: 'COMPLETED',
        isActive: isActive !== undefined ? isActive : true  // Default to true, but allow override
      };

      if (search) {
        // Use the same search logic as the working document controller
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
          // Also search in metadata as text (for keywords and description)
          { metadata: { contains: search, mode: 'insensitive' } }
        ];
      }

      const documents = await prisma.document.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      // Filter by path if provided (using title/originalName as path indicator)
      let filteredDocuments = documents;
      if (path) {
        filteredDocuments = documents.filter(doc =>
          doc.title?.toLowerCase().includes(path.toLowerCase()) ||
          doc.originalName?.toLowerCase().includes(path.toLowerCase())
        );
      }

      logger.info(`Found ${filteredDocuments.length} documents using database search`);

      return {
        documents: filteredDocuments.map(doc => ({
          id: doc.id,
          title: doc.title || doc.originalName,
          originalName: doc.originalName,
          filename: doc.filename,
          content: doc.metadata?.substring(0, 300) + '...' || 'No content available',
          similarity: 0.8, // High similarity for text search matches
          status: doc.status,
          isActive: doc.isActive,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })),
        total: filteredDocuments.length,
        searchType: 'text',
        query: search || '',
        path: path || ''
      };

    } catch (dbError) {
      logger.error('Database document search failed:', dbError);
      
      // Final fallback: return empty results
      return {
        documents: [],
        total: 0,
        error: 'Failed to retrieve documents',
        searchType: 'failed',
        query: search || '',
        path: path || ''
      };
    }

  } catch (error) {
    logger.error('Error in getDocuments:', error);
    return {
      documents: [],
      total: 0,
      error: 'Failed to retrieve documents'
    };
  }
}; 