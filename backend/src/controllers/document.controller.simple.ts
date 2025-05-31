import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
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
    (error: any, req: Request, res: Response, next: NextFunction) => {
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
        return res.status(400).json({ error: error.message });
      }
      
      // Handle file type validation error
      if (error instanceof Error && error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ error: 'Only PDF files are allowed' });
      }
      
      // If no error, continue to the next middleware
      if (!error) {
        return next();
      }
      
      // Handle other errors
      return res.status(500).json({ error: 'Upload failed' });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, path } = req.body;
        
        // Create document in database with real file information
        const document = await prisma.document.create({
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            title: title || req.file.originalname.replace('.pdf', ''),
            path: path || null,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadPath: req.file.path,
            status: 'PROCESSING',
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
          document: {
            id: document.id,
            filename: document.filename,
            originalName: document.originalName,
            title: document.title,
            path: document.path,
            size: document.size,
            status: document.status,
            createdAt: document.createdAt
          }
        });
      } catch (error) {
        logger.error('Error uploading document:', error);
        
        // Clean up uploaded file if database save failed
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
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

      // Use simple database search instead of embedding service
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query as string } },
            { originalName: { contains: query as string } }
          ]
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalCount = await prisma.document.count({
        where: {
          OR: [
            { title: { contains: query as string } },
            { originalName: { contains: query as string } }
          ]
        }
      });

      res.json({
        documents,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
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
   * Preview document (serve PDF file)
   */
  previewDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;
      
      // Check authentication - either from header or query parameter
      let isAuthenticated = false;
      
      // Check header first
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        if (headerToken && headerToken.startsWith('demo-token-')) {
          isAuthenticated = true;
        }
      }
      
      // If not authenticated via header, check query parameter
      if (!isAuthenticated && token && typeof token === 'string' && token.startsWith('demo-token-')) {
        isAuthenticated = true;
      }
      
      if (!isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get document from database
      const document = await prisma.document.findUnique({
        where: { id }
      });
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check if file exists
      if (!fs.existsSync(document.uploadPath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      // Set headers for PDF preview
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.uploadPath);
      fileStream.pipe(res);
      
    } catch (error) {
      logger.error('Error previewing document:', error);
      res.status(500).json({ error: 'Failed to preview document' });
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
        const result = await embeddingService.generateEmbeddingsForAllDocuments();
        
        // Get the actual count of documents processed
        const documentCount = await prisma.document.count({
          where: { isActive: true }
        });
        
        return res.json({ 
          message: 'Embeddings generated for all documents',
          count: documentCount
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