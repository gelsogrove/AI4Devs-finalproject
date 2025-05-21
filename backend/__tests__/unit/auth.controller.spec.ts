import { Request, Response } from 'express';
import authController from '../../src/controllers/auth.controller';
import userService from '../../src/services/user.service';

// Mock user service
jest.mock('../../src/services/user.service', () => ({
  createUser: jest.fn(),
  login: jest.fn(),
  getUserById: jest.fn(),
}));

// Mock zod validation
jest.mock('zod', () => {
  const originalModule = jest.requireActual('zod');
  return {
    ...originalModule,
    z: {
      ...originalModule.z,
      object: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation((data) => {
          // For testing validation errors, throw a mock ZodError when invalid data is provided
          if (data.email === 'invalid-email' || data.password?.length < 8) {
            throw new originalModule.ZodError([
              {
                code: 'invalid_string',
                message: 'Invalid email format',
                path: ['email'],
              },
            ]);
          }
          return data;
        })
      }),
    },
    ZodError: originalModule.ZodError,
  };
});

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let originalConsoleError: typeof console.error;
  
  beforeAll(() => {
    // Save original console.error
    originalConsoleError = console.error;
    // Mock console.error to silence it during tests
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    it('should register a user successfully', async () => {
      // Setup
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      
      mockRequest.body = userData;
      
      const createdUser = {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };
      
      (userService.createUser as jest.Mock).mockResolvedValue(createdUser);
      
      // Execute
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: createdUser,
      });
    });
    
    it('should return 400 for validation errors', async () => {
      // Setup - invalid email triggers ZodError
      mockRequest.body = {
        email: 'invalid-email',
        password: 'short',
      };
      
      // Execute
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.any(Array),
      });
    });
    
    it('should return 400 for service errors', async () => {
      // Setup
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const error = new Error('Email already in use');
      (userService.createUser as jest.Mock).mockRejectedValue(error);
      
      // Execute
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    });
  });
  
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Setup
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const loginResult = {
        token: 'demo-token-123456',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      
      (userService.login as jest.Mock).mockResolvedValue(loginResult);
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(userService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        ...loginResult,
      });
    });
    
    it('should return 401 for invalid credentials', async () => {
      // Setup
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      
      const error = new Error('Invalid email or password');
      (userService.login as jest.Mock).mockRejectedValue(error);
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });
  
  describe('getProfile', () => {
    it('should return user profile for authenticated request', async () => {
      // Setup
      mockRequest.user = {
        userId: '1',
        email: 'test@example.com',
      };
      
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      
      (userService.getUserById as jest.Mock).mockResolvedValue(user);
      
      // Execute
      await authController.getProfile(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(userService.getUserById).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ user });
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup - no user in request
      mockRequest.user = undefined;
      
      // Execute
      await authController.getProfile(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user not found', async () => {
      // Setup
      mockRequest.user = {
        userId: '999',
        email: 'test@example.com',
      };
      
      (userService.getUserById as jest.Mock).mockResolvedValue(null);
      
      // Execute
      await authController.getProfile(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(userService.getUserById).toHaveBeenCalledWith('999');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
}); 