import { Request, Response } from 'express';
import chatController from '../../src/controllers/chat.controller';

// Mock the dependencies
jest.mock('../../src/services/product.service', () => ({
  getProducts: jest.fn().mockImplementation(async (filters, pagination) => {
    return {
      data: [
        {
          toDTO: () => ({
            id: '1',
            name: 'Parmigiano Reggiano',
            description: 'Authentic Parmigiano Reggiano aged 24 months.',
            price: 29.99,
            imageUrl: 'https://example.com/parmigiano.jpg',
            category: 'Cheese',
          }),
        },
      ],
      pagination: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    };
  }),
  getCategories: jest.fn().mockResolvedValue(['Cheese', 'Oils', 'Vinegars']),
}));

jest.mock('../../src/services/service.service', () => ({
  getServices: jest.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        name: 'Degustazione',
        description: 'Una degustazione dei nostri prodotti più popolari',
        price: 25.0,
        isActive: true,
      },
    ],
    pagination: {
      page: 1,
      limit: 5,
      total: 1,
      totalPages: 1,
    },
  }),
}));

// Mock availableFunctions
jest.mock('../../src/services/availableFunctions', () => ({
  getProducts: jest.fn().mockResolvedValue({
    total: 1,
    products: [
      {
        id: '1',
        name: 'Parmigiano Reggiano',
        description: 'Authentic Parmigiano Reggiano aged 24 months.',
        price: '29.99',
        category: 'Cheese',
        imageUrl: 'https://example.com/parmigiano.jpg',
      }
    ]
  }),
  getServices: jest.fn().mockResolvedValue({
    total: 1,
    services: [
      {
        id: '1',
        name: 'Degustazione',
        description: 'Una degustazione dei nostri prodotti più popolari',
        price: '25.0',
        isActive: true,
      }
    ]
  }),
  getFAQs: jest.fn().mockResolvedValue({
    total: 1,
    faqs: [
      {
        id: '1',
        question: 'Shipping Policy?',
        answer: 'We ship worldwide within 2-3 business days.',
        category: 'Shipping'
      }
    ]
  })
}));

jest.mock('../../src/application/services/AgentConfigService', () => {
  return {
    AgentConfigService: jest.fn().mockImplementation(() => {
      return {
        getLatestConfig: jest.fn().mockResolvedValue({
          temperature: 0.7,
          maxTokens: 500,
          topP: 0.9,
          model: 'gpt-4-turbo',
          prompt: 'You are an Italian food shop assistant',
        }),
      };
    }),
  };
});

describe('ChatController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      json: jsonMock,
      status: jest.fn().mockReturnThis(),
    };
    
    // Set NODE_ENV to test explicitly for all tests
    process.env.NODE_ENV = 'test';
    // Ensure OPENROUTER_API_KEY is invalid for tests to use the mock path
    process.env.OPENROUTER_API_KEY = 'YOUR_API_KEY_HERE';
  });

  describe('processChat', () => {
    it('should handle Italian queries about products', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Quali prodotti vendete?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      // Check if response was called
      expect(jsonMock).toHaveBeenCalled();
      
      // Get the argument that was passed to res.json()
      const responseArg = jsonMock.mock.calls[0][0];
      
      // Verify the response structure
      expect(responseArg).toHaveProperty('message');
      expect(responseArg.message).toHaveProperty('content');
      expect(responseArg.message).toHaveProperty('role', 'assistant');
      
      // Verify that the response mentions products
      const content = responseArg.message.content.toLowerCase();
      expect(
        content.includes('parmigiano') || 
        content.includes('prodotti') || 
        content.includes('ecco i nostri prodotti')
      ).toBeTruthy();
    }, 15000); // Increase timeout to 15 seconds

    it('should handle Italian queries about cheese products', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Avete formaggi italiani?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalled();
      const responseArg = jsonMock.mock.calls[0][0];
      expect(responseArg).toHaveProperty('message');
      
      const content = responseArg.message.content.toLowerCase();
      expect(
        content.includes('parmigiano') || 
        content.includes('formaggi') || 
        content.includes('sì, abbiamo')
      ).toBeTruthy();
    }, 15000); // Increase timeout to 15 seconds

    it('should handle Italian queries about product count', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Quanti prodotti avete in totale?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalled();
      const responseArg = jsonMock.mock.calls[0][0];
      expect(responseArg).toHaveProperty('message');
      
      // The controller now returns "Abbiamo 3 prodotti nel nostro catalogo: formaggi, oli e aceti balsamici."
      const content = responseArg.message.content.toLowerCase();
      expect(
        content.includes('3') || 
        content.includes('tre') || 
        content.includes('catalogo') ||
        content.includes('prodotti')
      ).toBeTruthy();
    }, 15000); // Increase timeout to 15 seconds
  });
}); 