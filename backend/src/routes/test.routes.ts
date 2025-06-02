import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/test/cleanup:
 *   post:
 *     summary: Clean database and uploads for E2E tests
 *     description: Removes all test data from database and cleans uploads folder
 *     tags:
 *       - Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup successful
 *       500:
 *         description: Cleanup failed
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoints not available in production' });
    }

    // 1️⃣ Clean database tables in correct order (respecting foreign keys)
    await prisma.documentChunk.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.fAQChunk.deleteMany({});
    await prisma.fAQ.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.profile.deleteMany({});

    // 2️⃣ Clean uploads folder
    const uploadsPath = path.join(__dirname, '../../uploads');
    if (await fs.pathExists(uploadsPath)) {
      await fs.emptyDir(uploadsPath);
    }

    console.log('✅ Test cleanup completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Database and uploads cleaned successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Cleanup failed' 
    });
  }
});

/**
 * @swagger
 * /api/test/seed:
 *   post:
 *     summary: Seed minimal test data
 *     description: Creates minimal test data for E2E tests
 *     tags:
 *       - Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seeding successful
 *       500:
 *         description: Seeding failed
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoints not available in production' });
    }

    // Create minimal test data
    const testProfile = await prisma.profile.create({
      data: {
        username: 'test_user',
        companyName: 'Test Company',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        address: 'Test Address',
        openingTime: 'Mon-Fri 9-17',
        description: 'Test business description',
        sector: 'Test Sector'
      }
    });

    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test product description',
        price: 19.99,
        category: 'Test Category',
        isActive: true
      }
    });

    const testService = await prisma.service.create({
      data: {
        name: 'Test Service',
        description: 'Test service description',
        price: 29.99,
        isActive: true
      }
    });

    const testFAQ = await prisma.fAQ.create({
      data: {
        question: 'Test Question?',
        answer: 'Test answer for E2E testing.',
        isActive: true
      }
    });

    console.log('✅ Test data seeded successfully');

    res.json({ 
      success: true, 
      message: 'Test data seeded successfully',
      data: {
        profile: testProfile.id,
        product: testProduct.id,
        service: testService.id,
        faq: testFAQ.id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test seeding failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Seeding failed' 
    });
  }
});

/**
 * @swagger
 * /api/test/status:
 *   get:
 *     summary: Get test environment status
 *     description: Returns current test environment status and data counts
 *     tags:
 *       - Test
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoints not available in production' });
    }

    const counts = {
      products: await prisma.product.count(),
      services: await prisma.service.count(),
      faqs: await prisma.fAQ.count(),
      documents: await prisma.document.count(),
      profiles: await prisma.profile.count()
    };

    res.json({
      success: true,
      environment: process.env.NODE_ENV,
      database: 'connected',
      counts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test status check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Status check failed' 
    });
  }
});

export default router; 