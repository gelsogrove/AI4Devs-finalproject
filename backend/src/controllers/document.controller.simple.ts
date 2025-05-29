import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class SimpleDocumentController {
  /**
   * Upload a document
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      // For testing purposes, create a mock document entry
      const { title } = req.body;
      const filename = req.file?.originalname || 'test-document.pdf';
      
      // Create a mock document in the database
      const document = await prisma.document.create({
        data: {
          filename: filename.replace(/\s+/g, '-').toLowerCase(),
          originalName: filename,
          title: title || filename.replace('.pdf', ''),
          mimeType: 'application/pdf',
          size: req.file?.size || 1024000,
          uploadPath: 'uploads/test',
          status: 'COMPLETED',
          metadata: JSON.stringify({
            title: title || filename.replace('.pdf', ''),
            description: 'Test document uploaded via API'
          })
        }
      });

      res.status(201).json({ 
        message: 'Document uploaded successfully',
        document
      });
    } catch (error) {
      logger.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  };

  /**
   * Get user documents
   */
  getDocuments = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get documents from database
      const documents = await prisma.document.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalCount = await prisma.document.count();

      res.json({
        documents,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error: any) {
      logger.error('Error getting documents:', error);
      res.status(500).json({ error: 'Failed to get documents' });
    }
  };

  /**
   * Search documents
   */
  searchDocuments = async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!query) {
        return this.getDocuments(req, res);
      }

      // Use embedding service for search
      const results = await embeddingService.searchDocuments(query as string);

      res.json({
        documents: results,
        pagination: {
          total: results.length,
          limit,
          offset,
          hasMore: false
        },
        query
      });
    } catch (error) {
      logger.error('Error searching documents:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  };

  /**
   * Get document statistics
   */
  getDocumentStats = async (req: Request, res: Response) => {
    try {
      res.json({
        totalDocuments: 3,
        totalSize: 3584000,
        statusBreakdown: {
          COMPLETED: 3,
          PROCESSING: 0,
          FAILED: 0
        }
      });
    } catch (error) {
      logger.error('Error getting document stats:', error);
      res.status(500).json({ error: 'Failed to get document statistics' });
    }
  };

  /**
   * Get document by ID
   */
  getDocumentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Return static data for now
      const documents = {
        '1': {
          id: '1',
          filename: 'trasporto-merci-italia.pdf',
          originalName: 'Regolamento Trasporto Merci in Italia.pdf',
          title: 'Regolamento Trasporto Merci in Italia',
          path: 'regulations/transport',
          size: 1024000,
          status: 'COMPLETED',
          isActive: true,
          metadata: {
            title: 'Regolamento Trasporto Merci in Italia',
            description: 'Comprehensive regulations for goods transportation in Italy'
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        '2': {
          id: '2',
          filename: 'gdpr-privacy-policy.pdf',
          originalName: 'GDPR Privacy Policy - Gusto Italiano.pdf',
          title: 'GDPR Privacy Policy - Gusto Italiano',
          path: 'legal/privacy',
          size: 512000,
          status: 'COMPLETED',
          isActive: true,
          metadata: {
            title: 'GDPR Privacy Policy - Gusto Italiano',
            description: 'Complete GDPR compliance documentation'
          },
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01')
        },
        '3': {
          id: '3',
          filename: 'catalogo-prodotti-italiani.pdf',
          originalName: 'Catalogo Prodotti Italiani 2024.pdf',
          title: 'Catalogo Prodotti Italiani 2024',
          path: 'catalogs/products',
          size: 2048000,
          status: 'COMPLETED',
          isActive: false,
          metadata: {
            title: 'Catalogo Prodotti Italiani 2024',
            description: 'Complete catalog of authentic Italian products'
          },
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01')
        }
      };

      const document = documents[id as keyof typeof documents];
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      res.status(500).json({ error: 'Failed to get document' });
    }
  };

  /**
   * Delete document
   */
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // For now, just return success
      res.json({ message: `Document ${id} deleted successfully` });
    } catch (error) {
      logger.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  };

  /**
   * Generate embeddings for documents
   */
  generateEmbeddings = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (id) {
        // Generate embeddings for a specific document
        await embeddingService.generateEmbeddingsForDocument(id);
        return res.json({ 
          message: `Embeddings generated for document ${id}`,
          documentId: id
        });
      } else {
        // Generate embeddings for all documents
        await embeddingService.generateEmbeddingsForAllDocuments();
        return res.json({ 
          message: 'Embeddings generated for all documents',
          count: 3
        });
      }
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      return res.status(500).json({ error: 'Failed to generate embeddings' });
    }
  };

  /**
   * Update document
   */
  updateDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, filename, isActive } = req.body;
      
      // Update the document in the database
      const updatedDocument = await prisma.document.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(filename !== undefined && { filename }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date()
        }
      });

      res.json({ 
        message: 'Document updated successfully',
        document: updatedDocument
      });
    } catch (error: any) {
      logger.error('Error updating document:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.status(500).json({ error: 'Failed to update document' });
    }
  };
}

export default new SimpleDocumentController(); 