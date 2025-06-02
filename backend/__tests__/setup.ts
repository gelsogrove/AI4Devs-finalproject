import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });
dotenv.config(); // Fallback to regular .env

// Global test setup
const prisma = new PrismaClient();

beforeAll(async () => {
  try {
    // Test database connection
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
  }
});

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  prisma,
  createTestUser: async () => {
    return await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      }
    });
  },
  cleanupTestData: async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.document.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.fAQ.deleteMany({});
    await prisma.user.deleteMany({});
  }
};

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
});

// Type declarations for global utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
    }
  }
  
  var testUtils: {
    prisma: PrismaClient;
    createTestUser: () => Promise<any>;
    cleanupTestData: () => Promise<void>;
  };
} 