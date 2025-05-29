import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

export class SimpleDocumentController {
  /**
   * Upload a document
   */
  uploadDocument = [
    upload.single('document'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title } = req.body;
        
        // Create document in database with real file information
        const document = await prisma.document.create({
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            title: title || req.file.originalname.replace('.pdf', ''),
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadPath: req.file.path,
            status: 'COMPLETED',
            metadata: JSON.stringify({
              title: title || req.file.originalname.replace('.pdf', ''),
              description: 'Document uploaded via API',
              uploadedAt: new Date().toISOString()
            })
          }
        });

        logger.info(`Document uploaded successfully: ${req.file.originalname} -> ${req.file.filename}`);

        res.status(201).json({ 
          message: 'Document uploaded successfully',
          document
        });
      } catch (error) {
        logger.error('Error uploading document:', error);
        
        // Clean up uploaded file if database save failed
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large (max 10MB)' });
          }
          return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to upload document' });
      }
    }
  ];

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
      // Get real statistics from database
      const totalDocuments = await prisma.document.count();
      
      const documents = await prisma.document.findMany({
        select: {
          size: true,
          status: true
        }
      });

      const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
      
      const statusBreakdown = documents.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalDocuments,
        totalSize,
        statusBreakdown: {
          COMPLETED: statusBreakdown.COMPLETED || 0,
          PROCESSING: statusBreakdown.PROCESSING || 0,
          FAILED: statusBreakdown.FAILED || 0,
          UPLOADING: statusBreakdown.UPLOADING || 0
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
      
      // Get document from database
      const document = await prisma.document.findUnique({
        where: { id }
      });
      
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
      
      // Check if document exists
      const document = await prisma.document.findUnique({
        where: { id }
      });
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete related document chunks first (due to foreign key constraint)
      await prisma.documentChunk.deleteMany({
        where: { documentId: id }
      });

      // Delete the document from database
      await prisma.document.delete({
        where: { id }
      });

      // Delete physical file from filesystem
      if (document.uploadPath && fs.existsSync(document.uploadPath)) {
        try {
          fs.unlinkSync(document.uploadPath);
          logger.info(`Physical file deleted: ${document.uploadPath}`);
        } catch (fileError) {
          logger.warn(`Failed to delete physical file: ${document.uploadPath}`, fileError);
        }
      }

      logger.info(`Document deleted successfully: ${document.originalName} (ID: ${id})`);
      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      logger.error('Error deleting document:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Document not found' });
      }
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