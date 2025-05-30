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

  /**
   * Comprehensive integration test for specific chatbot questions
   * Tests the exact questions from the "Try Asking" section
   */
  describe('Chatbot Question Integration Tests', () => {
    
    it('should answer "Where is your warehouse?" with company information', async () => {
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
      
      // Verify the response contains warehouse/address information
      const content = response.body.message.content.toLowerCase();
      expect(
        content.includes('via roma') || 
        content.includes('roma') ||
        content.includes('italy') ||
        content.includes('warehouse') ||
        content.includes('address') ||
        content.includes('indirizzo') ||
        content.includes('magazzino')
      ).toBeTruthy();

      // Verify function was called correctly
      if (response.body.debug?.functionCalls) {
        const functionCall = response.body.debug.functionCalls.find(
          (call: any) => call.name === 'getCompanyInfo'
        );
        expect(functionCall).toBeDefined();
      }
    }, 15000);

    it('should answer "Do you have wine less than 20 Euro?" with relevant wine products', async () => {
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
      
      // Verify the response mentions wine and pricing
      const content = response.body.message.content.toLowerCase();
      expect(
        content.includes('wine') || 
        content.includes('vino') ||
        content.includes('chianti') ||
        content.includes('prosecco') ||
        content.includes('€') ||
        content.includes('euro') ||
        content.includes('price') ||
        content.includes('prezzo')
      ).toBeTruthy();

      // Should mention products under 20 euros
      expect(
        content.includes('19') || 
        content.includes('13') ||
        content.includes('15') ||
        content.includes('18') ||
        content.includes('under 20') ||
        content.includes('meno di 20')
      ).toBeTruthy();
    }, 15000);

    it('should answer "How long does shipping take?" with shipping information', async () => {
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
      
      // Verify the response contains shipping time information
      const content = response.body.message.content.toLowerCase();
      expect(
        content.includes('shipping') || 
        content.includes('delivery') ||
        content.includes('spedizione') ||
        content.includes('consegna') ||
        content.includes('days') ||
        content.includes('giorni') ||
        content.includes('business') ||
        content.includes('lavorativi')
      ).toBeTruthy();

      // Should mention specific timeframes
      expect(
        content.includes('1-3') || 
        content.includes('3-5') ||
        content.includes('5-10') ||
        content.includes('business days') ||
        content.includes('giorni lavorativi')
      ).toBeTruthy();
    }, 15000);

    it('should answer "What payment methods do you accept?" with payment information', async () => {
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
      
      // Verify the response contains payment method information
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

      // Should mention specific payment methods
      expect(
        content.includes('visa') || 
        content.includes('mastercard') ||
        content.includes('paypal') ||
        content.includes('apple pay') ||
        content.includes('google pay') ||
        content.includes('klarna') ||
        content.includes('bank transfer') ||
        content.includes('bonifico')
      ).toBeTruthy();
    }, 15000);

    it('should answer "Does exist an international delivery document?" with document information', async () => {
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
      
      // Verify the response contains international delivery/document information
      const content = response.body.message.content.toLowerCase();
      expect(
        content.includes('international') || 
        content.includes('internazionale') ||
        content.includes('delivery') ||
        content.includes('consegna') ||
        content.includes('document') ||
        content.includes('documento') ||
        content.includes('customs') ||
        content.includes('dogana') ||
        content.includes('export') ||
        content.includes('import') ||
        content.includes('transport') ||
        content.includes('trasporto')
      ).toBeTruthy();

      // Should provide relevant information about international shipping/documents
      expect(
        content.includes('countries') || 
        content.includes('paesi') ||
        content.includes('regulations') ||
        content.includes('regolamenti') ||
        content.includes('law') ||
        content.includes('legge') ||
        content.includes('agreement') ||
        content.includes('accordo') ||
        content.includes('worldwide') ||
        content.includes('mondiale')
      ).toBeTruthy();
    }, 15000);

    it('should provide relevant responses for all test questions within reasonable time', async () => {
      const testQuestions = [
        'Where is your warehouse?',
        'Do you have wine less than 20 Euro?',
        'How long does shipping take?',
        'What payment methods do you accept?',
        'Does exist an international delivery document?'
      ];

      const startTime = Date.now();
      
      for (const question of testQuestions) {
        const messages = [{ role: 'user', content: question }];
        
        const response = await request(app)
          .post('/api/chat')
          .send({ messages })
          .expect('Content-Type', /json/)
          .expect(200);

        // Verify each response has proper structure
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toHaveProperty('content');
        expect(response.body.message).toHaveProperty('role', 'assistant');
        
        // Verify response is not empty and contains meaningful content
        const content = response.body.message.content;
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(50); // Ensure substantial response
        
        // Verify response is in Italian or contains relevant keywords
        expect(
          content.toLowerCase().includes('sofia') ||
          content.toLowerCase().includes('gusto') ||
          content.toLowerCase().includes('shopmefy') ||
          content.toLowerCase().includes('italian') ||
          content.toLowerCase().includes('italiano') ||
          content.toLowerCase().includes('€') ||
          content.toLowerCase().includes('euro')
        ).toBeTruthy();
      }
      
      const totalTime = Date.now() - startTime;
      
      // Verify all questions were answered within reasonable time (30 seconds total)
      expect(totalTime).toBeLessThan(30000);
      
      console.log(`✅ All 5 test questions answered successfully in ${totalTime}ms`);
    }, 35000);

  });
}); 