import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../../src/app';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

describe('Chatbot Questions Integration Test', () => {
  beforeAll(async () => {
    // Ensure database is connected and has data
    const productCount = await prisma.product.count();
    const faqCount = await prisma.fAQ.count();
    const profileCount = await prisma.profile.count();
    const documentCount = await prisma.document.count();
    
    if (productCount === 0 || faqCount === 0 || profileCount === 0) {
      throw new Error('Database not properly seeded. Run: npm run db:seed');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Individual Question Tests', () => {
    test('should handle "Where is your warehouse?" question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [
            {
              role: 'user',
              content: 'Where is your warehouse?'
            }
          ]
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBeDefined();
      expect(typeof response.body.message.content).toBe('string');
      expect(response.body.message.content.length).toBeGreaterThan(0);

      // Check if the response contains warehouse/location information
      const responseText = response.body.message.content.toLowerCase();
      const hasLocationInfo = 
        responseText.includes('warehouse') ||
        responseText.includes('location') ||
        responseText.includes('address') ||
        responseText.includes('italy') ||
        responseText.includes('italia') ||
        responseText.includes('magazzino') ||
        responseText.includes('sede');

      expect(hasLocationInfo).toBe(true);

      // Check function calls if available
      if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
        const functionCall = response.body.debug.functionCalls[0];
        expect(['getCompanyInfo', 'getProfile']).toContain(functionCall.name);
      }
    }, 15000);

    test('should handle "Do you have wine less than 20 Euro?" question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [
            {
              role: 'user',
              content: 'Do you have wine less than 20 Euro?'
            }
          ]
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBeDefined();
      expect(typeof response.body.message.content).toBe('string');
      expect(response.body.message.content.length).toBeGreaterThan(0);

      // Check if the response contains wine/product information
      const responseText = response.body.message.content.toLowerCase();
      const hasWineInfo = 
        responseText.includes('wine') ||
        responseText.includes('vino') ||
        responseText.includes('euro') ||
        responseText.includes('€') ||
        responseText.includes('price') ||
        responseText.includes('prezzo') ||
        responseText.includes('product') ||
        responseText.includes('prodotto');

      expect(hasWineInfo).toBe(true);

      // Check function calls if available
      if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
        const functionCall = response.body.debug.functionCalls[0];
        expect(functionCall.name).toBe('getProducts');
        
        // Check if price filter was applied (optional - AI might use different approaches)
        if (functionCall.arguments) {
          const args = typeof functionCall.arguments === 'string' 
            ? JSON.parse(functionCall.arguments) 
            : functionCall.arguments;
          
          // Check if any price-related filter was applied (flexible check)
          const priceValue = args.maxPrice || args.priceMax || args.price_max || args.max_price;
          if (priceValue !== undefined) {
            expect(priceValue).toBeLessThanOrEqual(20);
          }
        }
      }
    }, 15000);

    test('should handle "How long does shipping take?" question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [
            {
              role: 'user',
              content: 'How long does shipping take?'
            }
          ]
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBeDefined();
      expect(typeof response.body.message.content).toBe('string');
      expect(response.body.message.content.length).toBeGreaterThan(0);

      // Check if the response contains shipping information
      const responseText = response.body.message.content.toLowerCase();
      const hasShippingInfo = 
        responseText.includes('shipping') ||
        responseText.includes('delivery') ||
        responseText.includes('spedizione') ||
        responseText.includes('consegna') ||
        responseText.includes('days') ||
        responseText.includes('giorni') ||
        responseText.includes('time') ||
        responseText.includes('tempo');

      expect(hasShippingInfo).toBe(true);

      // Check function calls if available
      if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
        const functionCall = response.body.debug.functionCalls[0];
        expect(['getFAQs', 'getServices']).toContain(functionCall.name);
      }
    }, 15000);

    test('should handle "What payment methods do you accept?" question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [
            {
              role: 'user',
              content: 'What payment methods do you accept?'
            }
          ]
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBeDefined();
      expect(typeof response.body.message.content).toBe('string');
      expect(response.body.message.content.length).toBeGreaterThan(0);

      // Check if the response contains payment information
      const responseText = response.body.message.content.toLowerCase();
      const hasPaymentInfo = 
        responseText.includes('payment') ||
        responseText.includes('pagamento') ||
        responseText.includes('card') ||
        responseText.includes('carta') ||
        responseText.includes('paypal') ||
        responseText.includes('bank') ||
        responseText.includes('banca') ||
        responseText.includes('transfer') ||
        responseText.includes('bonifico');

      expect(hasPaymentInfo).toBe(true);

      // Check function calls if available
      if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
        const functionCall = response.body.debug.functionCalls[0];
        expect(['getFAQs', 'getServices']).toContain(functionCall.name);
      }
    }, 15000);

    test('should handle "Does exist an international delivery document?" question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [
            {
              role: 'user',
              content: 'Does exist an international delivery document?'
            }
          ]
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBeDefined();
      expect(typeof response.body.message.content).toBe('string');
      expect(response.body.message.content.length).toBeGreaterThan(0);

      // Check if the response contains document information
      const responseText = response.body.message.content.toLowerCase();
      const hasDocumentInfo = 
        responseText.includes('document') ||
        responseText.includes('documento') ||
        responseText.includes('international') ||
        responseText.includes('internazionale') ||
        responseText.includes('delivery') ||
        responseText.includes('consegna') ||
        responseText.includes('transportation') ||
        responseText.includes('trasporto') ||
        responseText.includes('law') ||
        responseText.includes('legge');

      expect(hasDocumentInfo).toBe(true);

      // Check function calls if available
      if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
        const functionCall = response.body.debug.functionCalls[0];
        expect(functionCall.name).toBe('getDocuments');
      }
    }, 15000);
  });

  describe('Sequential Question Tests', () => {
    test('should handle all questions in sequence', async () => {
      const questions = [
        'Where is your warehouse?',
        'Do you have wine less than 20 Euro?',
        'How long does shipping take?',
        'What payment methods do you accept?',
        'Does exist an international delivery document?'
      ];

      const expectedCalls = [
        { name: 'getCompanyInfo', alternatives: ['getProfile'] },
        { name: 'getProducts', alternatives: [] },
        { name: 'getFAQs', alternatives: ['getServices'] },
        { name: 'getFAQs', alternatives: ['getServices'] },
        { name: 'getDocuments', alternatives: [] }
      ];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const expectedCall = expectedCalls[i];

        const response = await request(app)
          .post('/api/chat')
          .send({
            messages: [
              {
                role: 'user',
                content: question
              }
            ]
          })
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(response.body.message.content).toBeDefined();
        expect(typeof response.body.message.content).toBe('string');
        expect(response.body.message.content.length).toBeGreaterThan(0);

        // Check function calls if available
        if (response.body.debug && response.body.debug.functionCalls && response.body.debug.functionCalls.length > 0) {
          const functionCall = response.body.debug.functionCalls[0];
          const validNames = [expectedCall.name, ...expectedCall.alternatives];
          expect(validNames).toContain(functionCall.name);
        }
      }
    }, 60000);
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time limits', async () => {
      const questions = [
        'Where is your warehouse?',
        'Do you have wine less than 20 Euro?',
        'How long does shipping take?'
      ];

      for (const question of questions) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/chat')
          .send({
            messages: [
              {
                role: 'user',
                content: question
              }
            ]
          })
          .expect(200);

        const responseTime = Date.now() - startTime;
        
        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(response.body.message.content).toBeDefined();
        expect(responseTime).toBeLessThan(15000); // 15 seconds max
      }
    }, 60000);
  });
}); 