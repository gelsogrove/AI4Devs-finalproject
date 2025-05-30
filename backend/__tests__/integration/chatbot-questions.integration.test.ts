import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../../src/app';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

describe('Chatbot Questions Integration Tests - Try Asking Section', () => {
  beforeAll(async () => {
    // Ensure database is properly seeded
    console.log('🧪 Setting up integration test environment...');
    
    // Check if we have the required data
    const productCount = await prisma.product.count();
    const faqCount = await prisma.fAQ.count();
    const profileCount = await prisma.profile.count();
    const documentCount = await prisma.document.count();
    
    console.log(`📊 Database status: Products: ${productCount}, FAQs: ${faqCount}, Profile: ${profileCount}, Documents: ${documentCount}`);
    
    // Ensure we have agent config
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
   * Test 1: "Where is your warehouse?" 
   * Should trigger: getCompanyInfo function
   */
  it('should answer "Where is your warehouse?" with company information', async () => {
    console.log('🧪 Testing: Where is your warehouse?');
    
    const messages = [
      {
        role: 'user',
        content: 'Where is your warehouse?',
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
    
    // Verify debug information shows function call
    expect(response.body).toHaveProperty('debug');
    expect(response.body.debug).toHaveProperty('functionCalls');
    
    // Check if getCompanyInfo was called
    const functionCalls = response.body.debug.functionCalls;
    const companyInfoCall = functionCalls.find((call: any) => 
      call.name === 'getCompanyInfo' || call.name === 'getProfile'
    );
    expect(companyInfoCall).toBeDefined();
    
    // Verify response contains address/location information
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('address') || 
      content.includes('indirizzo') ||
      content.includes('warehouse') ||
      content.includes('magazzino') ||
      content.includes('location') ||
      content.includes('sede')
    ).toBeTruthy();
    
    console.log('✅ Warehouse question test passed');
  }, 20000);

  /**
   * Test 2: "Do you have wine less than 20 Euro?"
   * Should trigger: getProducts function with price filtering
   */
  it('should answer "Do you have wine less than 20 Euro?" with filtered products', async () => {
    console.log('🧪 Testing: Do you have wine less than 20 Euro?');
    
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
    
    // Verify debug information shows function call
    expect(response.body).toHaveProperty('debug');
    expect(response.body.debug).toHaveProperty('functionCalls');
    
    // Check if getProducts was called
    const functionCalls = response.body.debug.functionCalls;
    const productsCall = functionCalls.find((call: any) => call.name === 'getProducts');
    expect(productsCall).toBeDefined();
    
    // Verify response mentions wine and price
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('wine') || 
      content.includes('vino') ||
      content.includes('chianti') ||
      content.includes('prosecco') ||
      content.includes('barolo')
    ).toBeTruthy();
    
    expect(
      content.includes('€') || 
      content.includes('euro') ||
      content.includes('price') ||
      content.includes('prezzo')
    ).toBeTruthy();
    
    console.log('✅ Wine price question test passed');
  }, 20000);

  /**
   * Test 3: "How long does shipping take?"
   * Should trigger: getFAQs function
   */
  it('should answer "How long does shipping take?" with shipping information', async () => {
    console.log('🧪 Testing: How long does shipping take?');
    
    const messages = [
      {
        role: 'user',
        content: 'How long does shipping take?',
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
    
    // Verify debug information shows function call
    expect(response.body).toHaveProperty('debug');
    expect(response.body.debug).toHaveProperty('functionCalls');
    
    // Check if getFAQs was called
    const functionCalls = response.body.debug.functionCalls;
    const faqsCall = functionCalls.find((call: any) => call.name === 'getFAQs');
    expect(faqsCall).toBeDefined();
    
    // Verify response contains shipping time information
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('shipping') || 
      content.includes('spedizione') ||
      content.includes('delivery') ||
      content.includes('consegna') ||
      content.includes('days') ||
      content.includes('giorni') ||
      content.includes('business days') ||
      content.includes('giorni lavorativi')
    ).toBeTruthy();
    
    console.log('✅ Shipping time question test passed');
  }, 20000);

  /**
   * Test 4: "What payment methods do you accept?"
   * Should trigger: getFAQs function
   */
  it('should answer "What payment methods do you accept?" with payment information', async () => {
    console.log('🧪 Testing: What payment methods do you accept?');
    
    const messages = [
      {
        role: 'user',
        content: 'What payment methods do you accept?',
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
    
    // Verify debug information shows function call
    expect(response.body).toHaveProperty('debug');
    expect(response.body.debug).toHaveProperty('functionCalls');
    
    // Check if getFAQs was called
    const functionCalls = response.body.debug.functionCalls;
    const faqsCall = functionCalls.find((call: any) => call.name === 'getFAQs');
    expect(faqsCall).toBeDefined();
    
    // Verify response contains payment method information
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('payment') || 
      content.includes('pagamento') ||
      content.includes('credit card') ||
      content.includes('carta di credito') ||
      content.includes('paypal') ||
      content.includes('visa') ||
      content.includes('mastercard') ||
      content.includes('apple pay') ||
      content.includes('google pay')
    ).toBeTruthy();
    
    console.log('✅ Payment methods question test passed');
  }, 20000);

  /**
   * Test 5: "Does exist an international delivery document?"
   * Should trigger: getDocuments function
   */
  it('should answer "Does exist an international delivery document?" with document information', async () => {
    console.log('🧪 Testing: Does exist an international delivery document?');
    
    const messages = [
      {
        role: 'user',
        content: 'Does exist an international delivery document?',
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
    
    // Verify debug information shows function call
    expect(response.body).toHaveProperty('debug');
    expect(response.body.debug).toHaveProperty('functionCalls');
    
    // Check if getDocuments was called
    const functionCalls = response.body.debug.functionCalls;
    const documentsCall = functionCalls.find((call: any) => call.name === 'getDocuments');
    expect(documentsCall).toBeDefined();
    
    // Verify response contains document/international delivery information
    const content = response.body.message.content.toLowerCase();
    expect(
      content.includes('document') || 
      content.includes('documento') ||
      content.includes('international') ||
      content.includes('internazionale') ||
      content.includes('delivery') ||
      content.includes('consegna') ||
      content.includes('transportation') ||
      content.includes('trasporto') ||
      content.includes('shipping') ||
      content.includes('spedizione')
    ).toBeTruthy();
    
    console.log('✅ International delivery document question test passed');
  }, 20000);

  /**
   * Comprehensive test: All questions in sequence
   * Tests the complete flow of all chatbot functions
   */
  it('should handle all "Try Asking" questions in sequence', async () => {
    console.log('🧪 Testing: All questions in sequence');
    
    const questions = [
      'Where is your warehouse?',
      'Do you have wine less than 20 Euro?',
      'How long does shipping take?',
      'What payment methods do you accept?',
      'Does exist an international delivery document?'
    ];

    const expectedFunctions = [
      'getCompanyInfo',
      'getProducts', 
      'getFAQs',
      'getFAQs',
      'getDocuments'
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const expectedFunction = expectedFunctions[i];
      
      console.log(`🔍 Testing question ${i + 1}: "${question}"`);
      
      const messages = [
        {
          role: 'user',
          content: question,
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
      expect(response.body).toHaveProperty('debug');
      expect(response.body.debug).toHaveProperty('functionCalls');
      
      // Verify the expected function was called
      const functionCalls = response.body.debug.functionCalls;
      const expectedCall = functionCalls.find((call: any) => 
        call.name === expectedFunction || 
        (expectedFunction === 'getCompanyInfo' && call.name === 'getProfile')
      );
      
      expect(expectedCall).toBeDefined();
      
      // Verify response is not empty
      expect(response.body.message.content.length).toBeGreaterThan(10);
      
      console.log(`✅ Question ${i + 1} passed - Function: ${expectedCall?.name}`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All questions sequence test completed successfully');
  }, 120000); // 2 minutes timeout for all questions

  /**
   * Performance test: Verify response times are reasonable
   */
  it('should respond to all questions within reasonable time limits', async () => {
    console.log('🧪 Testing: Response time performance');
    
    const questions = [
      'Where is your warehouse?',
      'Do you have wine less than 20 Euro?',
      'How long does shipping take?',
      'What payment methods do you accept?',
      'Does exist an international delivery document?'
    ];

    for (const question of questions) {
      const startTime = Date.now();
      
      const messages = [
        {
          role: 'user',
          content: question,
        },
      ];

      const response = await request(app)
        .post('/api/chat')
        .send({ messages })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Verify response time is under 15 seconds
      expect(responseTime).toBeLessThan(15000);
      
      // Verify processing time from debug info
      if (response.body.debug && response.body.debug.processingTime) {
        expect(response.body.debug.processingTime).toBeLessThan(10000);
      }
      
      console.log(`⏱️ "${question}" - Response time: ${responseTime}ms`);
    }
    
    console.log('✅ Performance test completed');
  }, 90000);
}); 