import request from 'supertest';
import createMockExpressApp from './mock/express.mock';

// Create test server based on our mock
const app = createMockExpressApp();

describe('Integration: Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      // Test missing email
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      
      expect(res1.statusCode).toBe(400);
      expect(res1.body.error).toBe('Email and password are required');
      
      // Test missing password
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      
      expect(res2.statusCode).toBe(400);
      expect(res2.body.error).toBe('Email and password are required');
    });
    
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
    
    it('should return 401 for correct email but wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
    
    it('should return 200 with token and user data for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.token).toMatch(/^demo-token-/);
      
      // Check user data
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('1');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.firstName).toBe('Test');
      expect(res.body.user.lastName).toBe('User');
    });
  });
}); 