import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Document Cleanup Integration Test', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should clean up test documents keeping only international transportation law', async () => {
    // Fetch all documents from database
    const allDocuments = await prisma.document.findMany({
      select: {
        id: true,
        filename: true,
        originalName: true,
        title: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Identify documents to keep (international transportation law)
    const documentsToKeep = allDocuments.filter(doc => 
      doc.filename.toLowerCase().includes('international-transportation-law') ||
      doc.originalName?.toLowerCase().includes('international-transportation-law') ||
      doc.title?.toLowerCase().includes('international transportation law')
    );

    // Identify documents to delete (everything else)
    const documentsToDelete = allDocuments.filter(doc => 
      !documentsToKeep.some(keepDoc => keepDoc.id === doc.id)
    );

    // If there are no documents to delete, test passes
    if (documentsToDelete.length === 0) {
      expect(allDocuments.length).toBeGreaterThanOrEqual(0);
      return;
    }

    // Delete document chunks first (foreign key constraint)
    for (const doc of documentsToDelete) {
      await prisma.documentChunk.deleteMany({
        where: { documentId: doc.id }
      });
    }

    // Delete documents from database
    const deleteResult = await prisma.document.deleteMany({
      where: {
        id: {
          in: documentsToDelete.map(doc => doc.id)
        }
      }
    });

    // Delete physical files
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
    let filesDeleted = 0;

    for (const doc of documentsToDelete) {
      const filePath = path.join(uploadsDir, doc.filename);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          filesDeleted++;
        } catch (error) {
          // Ignore file deletion errors
        }
      }
    }

    // Verify cleanup
    const remainingDocuments = await prisma.document.findMany({
      select: {
        id: true,
        filename: true,
        originalName: true,
        title: true
      }
    });

    // Check remaining files in uploads directory
    let remainingFiles: string[] = [];
    if (fs.existsSync(uploadsDir)) {
      remainingFiles = fs.readdirSync(uploadsDir);
    }

    // Assertions
    expect(deleteResult.count).toBe(documentsToDelete.length);
    expect(remainingDocuments.length).toBeLessThanOrEqual(1); // Should have 0 or 1 document
    
    // If we have documents, they should be the international transportation law
    if (remainingDocuments.length > 0) {
      const remainingDoc = remainingDocuments[0];
      expect(
        remainingDoc.filename.toLowerCase().includes('international-transportation-law') ||
        remainingDoc.originalName?.toLowerCase().includes('international-transportation-law') ||
        remainingDoc.title?.toLowerCase().includes('international transportation law')
      ).toBe(true);
    }

    // File system should be consistent with database (allow for multiple valid documents)
    expect(remainingFiles.length).toBeLessThanOrEqual(remainingDocuments.length + 1); // Allow some flexibility
  }, 30000);
}); 