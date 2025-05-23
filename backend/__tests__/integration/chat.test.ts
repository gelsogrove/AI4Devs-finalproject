import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../../src/app';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

describe('Chat API Integration Tests', () => {
  // Check if we should skip tests based on OpenRouter API Key availability
  const shouldSkipTests = !process.env.OPENROUTER;

  beforeAll(async () => {
    // Clear test environment if needed
    if (!shouldSkipTests) {
      // Ensure we have some test products in the database
      if ((await prisma.product.count()) === 0) {
        await prisma.product.createMany({
          data: [
            {
              name: 'Parmigiano Reggiano',
              description: 'Authentic Parmigiano Reggiano aged 24 months. Imported directly from Parma, Italy.',
              price: 29.99,
              imageUrl: 'https://example.com/parmigiano.jpg',
              category: 'Cheese',
            },
            {
              name: 'Extra Virgin Olive Oil',
              description: 'Cold-pressed olive oil from Tuscany. Perfect for salads and finishing dishes.',
              price: 19.99,
              imageUrl: 'https://example.com/olive-oil.jpg',
              category: 'Oils',
            },
            {
              name: 'Balsamic Vinegar',
              description: 'Traditional balsamic vinegar aged in wooden barrels for 12 years.',
              price: 24.99,
              imageUrl: 'https://example.com/balsamic.jpg',
              category: 'Vinegars',
            },
          ],
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Test case for "Quali prodotti vendete?"
   * Should call getProducts without filters
   */
  it('should respond to "Quali prodotti vendete?" correctly', async () => {
    // Skip test if OPENROUTER is not available
    if (shouldSkipTests) {
      console.log('Skipping test due to missing OPENROUTER');
      return;
    }

    const messages = [
      {
        role: 'user',
        content: 'Quali prodotti vendete?',
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
    
    // Verify that the response mentions products or categories
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('parmigiano') || 
      content.includes('olio') || 
      content.includes('formaggio') ||
      content.includes('prodotti') ||
      content.includes('catalogo')
    ).toBeTruthy();
  }, 15000); // Extend timeout to 15s for API calls

  /**
   * Test case for "Avete formaggi italiani?"
   * Should call getProducts with category filter
   */
  it('should respond to "Avete formaggi italiani?" correctly', async () => {
    // Skip test if OPENROUTER is not available
    if (shouldSkipTests) {
      console.log('Skipping test due to missing OPENROUTER');
      return;
    }

    const messages = [
      {
        role: 'user',
        content: 'Avete formaggi italiani?',
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
    
    // Verify that the response mentions cheese or parmigiano
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('parmigiano') || 
      content.includes('formaggio') ||
      content.includes('cheese')
    ).toBeTruthy();
  }, 15000);

  /**
   * Test case for "Quanti prodotti avete in totale?"
   * Should call getProducts with countOnly=true
   */
  it('should respond to "Quanti prodotti avete in totale?" correctly', async () => {
    // Skip test if OPENROUTER is not available
    if (shouldSkipTests) {
      console.log('Skipping test due to missing OPENROUTER');
      return;
    }

    const messages = [
      {
        role: 'user',
        content: 'Quanti prodotti avete in totale?',
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
    
    // Verify that the response includes a number or count
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('3') ||
      content.includes('tre') ||
      content.includes('prodotti') ||
      /\d+/.test(content) // Contains at least one digit
    ).toBeTruthy();
  }, 15000);
}); 