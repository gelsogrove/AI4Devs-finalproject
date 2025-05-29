import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../../src/app';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

describe('Chat API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure we have some test products in the database for intelligent fallback
    if ((await prisma.product.count()) === 0) {
      await prisma.product.createMany({
        data: [
          {
            name: 'Parmigiano Reggiano DOP 24 Months',
            description: 'Authentic Italian Parmigiano Reggiano aged for 24 months from Emilia-Romagna.',
            price: 15.9,
            category: 'Cheese',
            imageUrl: 'https://example.com/parmigiano.jpg',
            tagsJson: JSON.stringify(['italian', 'cheese', 'premium', 'dop', 'aged'])
          },
          {
            name: 'Chianti Classico DOCG',
            description: 'Premium red wine from Tuscany made with Sangiovese grapes.',
            price: 19.5,
            category: 'Wine',
            imageUrl: 'https://example.com/chianti.jpg',
            tagsJson: JSON.stringify(['italian', 'wine', 'red', 'tuscany', 'docg'])
          },
          {
            name: 'Prosecco di Valdobbiadene DOCG',
            description: 'Premium sparkling wine from Veneto.',
            price: 13.9,
            category: 'Wine',
            imageUrl: 'https://example.com/prosecco.jpg',
            tagsJson: JSON.stringify(['italian', 'wine', 'sparkling', 'veneto', 'docg'])
          },
        ],
      });
    }

    // Ensure we have agent config for the system
    const configCount = await prisma.agentConfig.count();
    if (configCount === 0) {
      await prisma.agentConfig.create({
        data: {
          prompt: 'You are Sofia, an expert in Italian products at ShopMefy.',
          model: 'gpt-4-turbo',
          temperature: 0.7,
          maxTokens: 500,
          topP: 0.9
        }
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Test the intelligent query processing system
   * This tests our implemented intelligent fallback, not the AI service
   */
  it('should respond to wine price query with intelligent filtering', async () => {
    const messages = [
      {
        role: 'user',
        content: 'Do you have wine less than 20 Euro?',
      },
    ];

    const response = await request(app)
      .post('/api/chat')
      .send({ messages })
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toHaveProperty('content');
    expect(response.body.message).toHaveProperty('role', 'assistant');
    
    // Verify intelligent filtering worked
    const content = response.body.message.content.toLowerCase();
    
    // Should mention wines under 20 Euro
    expect(
      content.includes('chianti') || 
      content.includes('prosecco') ||
      content.includes('wine') ||
      content.includes('vino')
    ).toBeTruthy();
    
    // Should include price information
    expect(
      content.includes('19.5') || 
      content.includes('13.9') ||
      content.includes('€') ||
      content.includes('euro')
    ).toBeTruthy();
  }, 20000);

  /**
   * Test cheese category search
   */
  it('should respond to cheese query correctly', async () => {
    const messages = [
      {
        role: 'user',
        content: 'What cheese do you have?',
      },
    ];

    const response = await request(app)
      .post('/api/chat')
      .send({ messages })
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toHaveProperty('content');
    
    // Verify that the response mentions cheese
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('parmigiano') || 
      content.includes('formaggio') ||
      content.includes('cheese')
    ).toBeTruthy();
  }, 20000);

  /**
   * Test general greeting
   */
  it('should respond to greeting appropriately', async () => {
    const messages = [
      {
        role: 'user',
        content: 'Ciao!',
      },
    ];

    const response = await request(app)
      .post('/api/chat')
      .send({ messages })
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toHaveProperty('content');
    
    // Verify greeting response
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('ciao') || 
      content.includes('sofia') ||
      content.includes('shopmefy') ||
      content.includes('benvenuto')
    ).toBeTruthy();
  }, 10000);

  /**
   * Test the test functions endpoint
   */
  it('should test available functions correctly', async () => {
    const response = await request(app)
      .get('/api/chat/test-functions')
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('tests');
    expect(response.body.tests).toHaveProperty('wineSearch');
    expect(response.body.tests).toHaveProperty('allProducts');
    
    // Verify wine search found products
    expect(response.body.tests.wineSearch.total).toBeGreaterThan(0);
    expect(response.body.tests.allProducts.total).toBeGreaterThan(0);
  }, 10000);
}); 