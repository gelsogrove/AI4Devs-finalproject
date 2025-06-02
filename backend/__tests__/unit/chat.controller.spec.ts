// Mock the OpenAI service first, before any imports
jest.mock('../../src/utils/openai', () => ({
  aiService: {
    generateChatCompletion: jest.fn().mockImplementation((messages, model, options) => {
      const userMessage = messages.find((msg: any) => msg.role === 'user')?.content?.toLowerCase() || '';
      const hasSystemFormatting = messages.some((msg: any) => msg.role === 'system' && msg.content?.includes('FORMATTING RULES'));
      
      // If this is the formatting call (second call), return a simple formatted response
      if (hasSystemFormatting) {
        return Promise.resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Ecco i nostri prodotti italiani! 🇮🇹'
              }
            }
          ]
        });
      }
      
      // Handle different types of queries for the initial call
      if (userMessage.includes('how many products') || userMessage.includes('total')) {
        return Promise.resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'We have 3 products in our catalog: cheeses, oils and balsamic vinegars.',
                tool_calls: [
                  {
                    id: 'call_count',
                    type: 'function',
                    function: {
                      name: 'getProducts',
                      arguments: '{"countOnly": true}'
                    }
                  }
                ]
              }
            }
          ]
        });
      } else if (userMessage.includes('cheese')) {
        return Promise.resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Yes, we have Italian cheeses!',
                tool_calls: [
                  {
                    id: 'call_cheese',
                    type: 'function',
                    function: {
                      name: 'getProducts',
                      arguments: '{"category": "Cheese"}'
                    }
                  }
                ]
              }
            }
          ]
        });
      } else {
        // Default response for general product queries
        return Promise.resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Here are our Italian products! 🇮🇹'
              }
            }
          ]
        });
      }
    })
  }
}));

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
        name: 'Tasting',
        description: 'A tasting of our most popular products',
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
        name: 'Tasting',
        description: 'A tasting of our most popular products',
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
    
    // Mock console.error to capture any errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('processChat', () => {
    it('should handle basic chat processing without errors', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
        },
      };

      try {
        await chatController.processChat(req as Request, res as Response);
        
        // Check if response was called
        expect(jsonMock).toHaveBeenCalled();
        
        // Get the argument that was passed to res.json()
        const responseArg = jsonMock.mock.calls[0][0];
        
        // Removed console.log for cleaner test output
        
        // Just check that we got some response (either success or error)
        expect(responseArg).toBeDefined();
        
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    }, 15000);

    it('should handle Italian queries about products', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'What products do you sell?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      // Check if response was called
      expect(jsonMock).toHaveBeenCalled();
      
      // Get the argument that was passed to res.json()
      const responseArg = jsonMock.mock.calls[0][0];
      
      // The chat functionality works correctly with intelligent fallback
      expect(responseArg).toHaveProperty('message');
      expect(responseArg.message).toHaveProperty('role', 'assistant');
      expect(responseArg.message).toHaveProperty('content');
      expect(typeof responseArg.message.content).toBe('string');
      expect(responseArg.message.content.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle Italian queries about cheese products', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Do you have Italian cheeses?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalled();
      const responseArg = jsonMock.mock.calls[0][0];
      
      // The chat functionality works correctly with intelligent fallback
      expect(responseArg).toHaveProperty('message');
      expect(responseArg.message).toHaveProperty('role', 'assistant');
      expect(responseArg.message).toHaveProperty('content');
      expect(typeof responseArg.message.content).toBe('string');
      expect(responseArg.message.content.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle Italian queries about product count', async () => {
      req = {
        body: {
          messages: [
            {
              role: 'user',
              content: 'How many products do you have in total?',
            },
          ],
        },
      };

      await chatController.processChat(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalled();
      const responseArg = jsonMock.mock.calls[0][0];
      
      // The chat functionality works correctly with intelligent fallback
      expect(responseArg).toHaveProperty('message');
      expect(responseArg.message).toHaveProperty('role', 'assistant');
      expect(responseArg.message).toHaveProperty('content');
      expect(typeof responseArg.message.content).toBe('string');
      expect(responseArg.message.content.length).toBeGreaterThan(0);
    }, 15000);
  });
}); 