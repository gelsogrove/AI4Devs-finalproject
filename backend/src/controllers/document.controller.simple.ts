import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import embeddingService from '../services/embedding.service';
import huggingFaceService from '../services/huggingface.service';
import { pdfProcessingService } from '../services/pdf-processing.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
});

const searchDocumentsSchema = z.object({
  query: z.string().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const getDocumentsSchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title must be at least 1 character').optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  metadata: z.string().optional(), // Allow metadata updates
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
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
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

        // Validate request body
        const validatedData = uploadDocumentSchema.parse(req.body);
        const { title } = validatedData;
        
        // Extract PDF content and metadata
        let extractedText = '';
        let pdfMetadata = {};
        
        try {
          // Read the uploaded file and extract text
          const fileBuffer = fs.readFileSync(req.file.path);
          const processedDocument = await pdfProcessingService.extractTextFromPDF(fileBuffer);
          
          extractedText = processedDocument.text;
          pdfMetadata = {
            ...processedDocument.metadata,
            title: title || processedDocument.metadata.title || req.file.originalname.replace('.pdf', ''),
            description: 'Document uploaded via API with extracted text content',
            uploadedAt: new Date().toISOString(),
            extractedTextLength: extractedText.length,
            keywords: ['transportation', 'international', 'law', 'delivery', 'regulations', 'IMO', 'maritime', 'shipping', 'customs', 'trade'] // Default keywords
          };
          
          logger.info(`PDF text extracted successfully: ${extractedText.length} characters`);
        } catch (pdfError) {
          logger.warn('Failed to extract PDF text, using metadata only:', pdfError);
          pdfMetadata = {
            title: title || req.file.originalname.replace('.pdf', ''),
            description: 'Document uploaded via API (text extraction failed)',
            uploadedAt: new Date().toISOString(),
            keywords: ['document', 'pdf']
          };
        }
        
        // Create document in database with real file information
        const document = await prisma.document.create({
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            title: title || req.file.originalname.replace('.pdf', ''),
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadPath: req.file.path,
            status: 'COMPLETED', // ✅ Set to COMPLETED so embeddings can be generated
            metadata: JSON.stringify(pdfMetadata)
          }
        });

        // If we extracted text, create chunks immediately
        if (extractedText && extractedText.length > 0) {
          try {
            await this.createDocumentChunks(document.id, extractedText);
            logger.info(`Created chunks for document ${document.id}`);
          } catch (chunkError) {
            logger.error('Failed to create chunks:', chunkError);
          }
        }

        logger.info(`Document uploaded successfully: ${req.file.originalname} -> ${req.file.filename}`);

        res.status(201).json({ 
          message: 'Document uploaded successfully',
          document: {
            id: document.id,
            filename: document.filename,
            originalName: document.originalName,
            title: document.title,
            size: document.size,
            status: document.status,
            isActive: document.isActive, // ✅ Include isActive field
            metadata: document.metadata ? JSON.parse(document.metadata) : null,
            createdAt: document.createdAt.toISOString(),
            updatedAt: document.updatedAt.toISOString(),
            extractedTextLength: extractedText.length
          }
        });
      } catch (error) {
        logger.error('Error uploading document:', error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            details: error.errors,
          });
        }
        
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
      // Validate query parameters
      const { limit = 10, offset = 0 } = getDocumentsSchema.parse(req.query);

      // Get documents from database
      const documents = await prisma.document.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalCount = await prisma.document.count();

      // Transform documents to match frontend DTO
      const transformedDocuments = documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        title: doc.title || doc.originalName,
        size: doc.size,
        status: doc.status,
        isActive: doc.isActive,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }));

      res.json({
        documents: transformedDocuments,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error: any) {
      logger.error('Error getting documents:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      res.status(500).json({ error: 'Failed to get documents' });
    }
  };

  /**
   * Search documents
   */
  searchDocuments = async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const { query, limit = 10, offset = 0 } = searchDocumentsSchema.parse(req.query);
      
      if (!query) {
        return this.getDocuments(req, res);
      }

      // Use embedding service for content search
      try {
        logger.info(`Searching documents with embedding service for query: ${query}`);
        const embeddingResults = await embeddingService.searchDocuments(query as string, limit);
        
        if (embeddingResults && embeddingResults.length > 0) {
          logger.info(`Embedding search found ${embeddingResults.length} documents`);
          
          // Apply offset to embedding results
          const paginatedResults = embeddingResults.slice(offset, offset + limit);
          
          // Transform to match frontend DTO
          const transformedDocuments = paginatedResults.map(doc => ({
            id: doc.id,
            filename: doc.filename,
            originalName: doc.originalName,
            title: doc.title || doc.originalName,
            size: 0, // Not available in embedding results
            status: doc.status,
            isActive: doc.isActive || true,
            metadata: doc.content ? { content: doc.content } : null,
            similarity: doc.similarity,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          }));

          return res.json({
            documents: transformedDocuments,
            pagination: {
              total: embeddingResults.length,
              limit,
              offset,
              hasMore: offset + limit < embeddingResults.length
            },
            searchType: 'embedding'
          });
        } else {
          logger.info('Embedding search returned no results, falling back to text search');
        }
      } catch (embeddingError) {
        logger.error('Embedding search failed, falling back to text search:', embeddingError);
      }

      // Fallback: Use simple database search
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query as string } },
            { originalName: { contains: query as string } },
            { metadata: { contains: query as string } }
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
            { originalName: { contains: query as string } },
            { metadata: { contains: query as string } }
          ]
        }
      });

      // Transform documents to match frontend DTO
      const transformedDocuments = documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        title: doc.title || doc.originalName,
        size: doc.size,
        status: doc.status,
        isActive: doc.isActive,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }));

      res.json({
        documents: transformedDocuments,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        searchType: 'text'
      });
    } catch (error: any) {
      logger.error('Error searching documents:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
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

      // Transform document to match frontend DTO
      const transformedDocument = {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        title: document.title || document.originalName,
        size: document.size,
        status: document.status,
        isActive: document.isActive,
        metadata: document.metadata ? JSON.parse(document.metadata) : null,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString()
      };

      res.json(transformedDocument);
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
      
      // Validate request body
      const validatedData = updateDocumentSchema.parse(req.body);

      // Check if document exists
      const existingDocument = await prisma.document.findUnique({
        where: { id }
      });

      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Update document
      const updatedDocument = await prisma.document.update({
        where: { id },
        data: validatedData
      });

      res.json({
        message: 'Document updated successfully',
        document: updatedDocument
      });
    } catch (error) {
      logger.error('Error updating document:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      res.status(500).json({ error: 'Failed to update document' });
    }
  };

  /**
   * Create document chunks from extracted text
   */
  private async createDocumentChunks(documentId: string, text: string): Promise<void> {
    try {
      // Split text into chunks (similar to splitIntoChunks function)
      const chunks = this.splitTextIntoChunks(text, 800); // 800 characters per chunk
      
      // Delete existing chunks for this document
      await prisma.documentChunk.deleteMany({
        where: { documentId }
      });
      
      // Create chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Generate embedding for this chunk
          const embedding = await huggingFaceService.generateEmbedding(chunk);
          
          // Save chunk to database
          await prisma.documentChunk.create({
            data: {
              content: chunk,
              chunkIndex: i,
              pageNumber: 1, // Default to page 1
              documentId: documentId,
              embedding: JSON.stringify(embedding)
            }
          });
          
        } catch (embeddingError) {
          logger.warn(`Failed to generate embedding for chunk ${i}:`, embeddingError);
          
          // Save chunk without embedding
          await prisma.documentChunk.create({
            data: {
              content: chunk,
              chunkIndex: i,
              pageNumber: 1,
              documentId: documentId,
              embedding: JSON.stringify([])
            }
          });
        }
      }
      
      logger.info(`Created ${chunks.length} chunks for document ${documentId}`);
      
    } catch (error) {
      logger.error(`Error creating chunks for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Split text into chunks
   */
  private splitTextIntoChunks(text: string, maxChunkSize: number = 800): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      let endIndex = currentIndex + maxChunkSize;
      
      // Try to break at sentence boundary
      if (endIndex < text.length) {
        const sentenceEnd = text.lastIndexOf('.', endIndex);
        const questionEnd = text.lastIndexOf('?', endIndex);
        const exclamationEnd = text.lastIndexOf('!', endIndex);
        
        const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        
        if (sentenceBoundary > currentIndex + maxChunkSize * 0.5) {
          endIndex = sentenceBoundary + 1;
        } else {
          // Fall back to word boundary
          const wordBoundary = text.lastIndexOf(' ', endIndex);
          if (wordBoundary > currentIndex + maxChunkSize * 0.5) {
            endIndex = wordBoundary;
          }
        }
      }
      
      const chunk = text.slice(currentIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      currentIndex = endIndex;
    }
    
    return chunks;
  }
}

export default new SimpleDocumentController(); 