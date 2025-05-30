# 🍝 Gusto Italiano - AI4Devs Final Project

## �� Overview

**ShopMe** is a multilingual SaaS platform (Italian, English, Spanish) that turns WhatsApp into a complete sales channel. Customers can create smart chatbots, manage products, receive orders, and send invoices to their clients without any technical skills. Our AI technology automates customer-care responses, manages push notifications, and offers a 24/7 conversational shopping experience, all directly in the world's most popular messaging app.

All sensitive operations are handled securely through temporary links with security tokens. These links direct customers to our secure website for registration forms, payments, invoices, and accessing personal data. This keeps all sensitive information outside of chat conversations, ensuring data protection while maintaining a smooth customer experience.

### 🏗️ Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express x
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenRouter API + Langchai  +  OpenRouter

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
docker-compose up -d
npm install
npm run db:setup
npm run dev
```
**Backend runs on**: `http://localhost:8080`

 

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Frontend runs on**: `http://localhost:3000` (or next available port)

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run chatbot-specific tests
npm run test:chatbot

# Run E2E tests
cd ../frontend
npm run test:e2e
```

## 🔄 CI/CD

### GitHub Actions Workflows

**Continuous Integration** (`.github/workflows/ci.yml`):
```bash
# Triggers on push/PR to main branch
- Backend unit tests
- Backend integration tests  
- Frontend build
- Database schema validation
- PostgreSQL service integration
```

**Deployment** (`.github/workflows/deploy.yml`):
```bash
# Manual deployment trigger
- Build applications
- Upload to S3
- Deploy to EC2
- Configure Nginx
- Start services with PM2
```

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:password@host:5432/database
OPENROUTER_API_KEY=your_api_key
NODE_ENV=production

# Frontend  
API_URL=https://your-domain.com
```

## 🚀 Deploy

### Production Deployment

**Infrastructure:**
- **EC2 Instance**: Ubuntu server
- **Database**: PostgreSQL 15
- **Web Server**: Nginx reverse proxy
- **Process Manager**: PM2
- **Storage**: AWS S3 for file uploads

**Deployment Steps:**
```bash
# 1. Build applications
npm run build

# 2. Upload to S3
aws s3 sync ./dist s3://your-bucket/

# 3. Deploy to EC2
ssh user@server "cd /app && git pull && npm install && pm2 restart all"

# 4. Update Nginx configuration
sudo nginx -t && sudo systemctl reload nginx
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🏗️ Terraform

### Infrastructure as Code

**Status**: 🚧 **TODO** - Infrastructure automation planned

**Planned Resources:**
```hcl
# AWS Infrastructure
- EC2 instances (web servers)
- RDS PostgreSQL (database)
- S3 buckets (file storage)
- VPC and security groups
- Load balancer (ALB)
- Route53 (DNS)
- CloudFront (CDN)
```

## 🧪 Additional Unit Tests for Robustness

### High Priority Test Coverage Needed

**Domain Services & Value Objects:**
```bash
# Security Service
backend/__tests__/unit/domain/SecurityService.test.ts
- Password hashing validation
- Rate limiting logic
- IP whitelist/blacklist validation
- Token generation and validation

# Value Objects
backend/__tests__/unit/domain/valueObjects/
├── Price.test.ts          # Price validation and formatting
├── ProductId.test.ts      # UUID validation
└── ProductName.test.ts    # Name sanitization
```

**Utility Functions:**
```bash
# OpenAI/AI Service
backend/__tests__/unit/utils/openai.test.ts
- Model mapping logic
- API key validation
- Error handling for API failures
- Embedding generation mocking

# JWT Utilities
backend/__tests__/unit/utils/jwt.test.ts
- Token generation and validation
- Expiration handling
- Malformed token handling
```

**Service Layer:**
```bash
# Service Service
backend/__tests__/unit/services/service.service.test.ts
- CRUD operations with mocked Prisma
- Search and filtering logic
- Pagination calculations
- Error handling scenarios

# Embedding Service
backend/__tests__/unit/services/embedding.service.test.ts
- Cosine similarity calculations
- Text chunking logic
- Fallback to text search
- Embedding storage/retrieval
```

**Controllers:**
```bash
# Service Controller
backend/__tests__/unit/controllers/service.controller.test.ts
- Input validation with Zod schemas
- Error response formatting
- Authentication middleware integration
- Pagination parameter handling

# Embedding Controller
backend/__tests__/unit/controllers/embedding.controller.test.ts
- Async operation handling
- Error propagation
- Response formatting
```

**Middleware:**
```bash
# Security Middleware
backend/__tests__/unit/middlewares/security.middleware.test.ts
- Rate limiting logic
- Security headers validation
- Suspicious request detection
- CORS configuration
```

### Test Implementation Examples

**Example: Security Service Test**
```typescript
// backend/__tests__/unit/domain/SecurityService.test.ts
describe('SecurityService', () => {
  describe('hashPassword', () => {
    it('should hash password with proper salt rounds', async () => {
      const password = 'testPassword123';
      const hash = await SecurityService.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('should reject passwords shorter than minimum length', async () => {
      await expect(SecurityService.hashPassword('short'))
        .rejects.toThrow('Password must be at least 8 characters long');
    });
  });
});
```

**Example: OpenAI Utils Test**
```typescript
// backend/__tests__/unit/utils/openai.test.ts
describe('AIService', () => {
  describe('generateEmbedding', () => {
    it('should handle API key validation', async () => {
      process.env.OPENROUTER_API_KEY = '';
      await expect(aiService.generateEmbedding('test'))
        .rejects.toThrow('No valid API key available');
    });

    it('should handle API failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(openRouterClient.embeddings, 'create')
        .mockRejectedValue(new Error('API Error'));
      
      await expect(aiService.generateEmbedding('test'))
        .rejects.toThrow('Failed to generate embeddings');
    });
  });
});
```

### Benefits of Additional Tests

- **Error Handling**: Comprehensive testing of edge cases and error scenarios
- **Security**: Validation of security-critical functions
- **Performance**: Testing of algorithms like cosine similarity
- **Reliability**: Mocking external dependencies (OpenAI, Prisma)
- **Maintainability**: Easier refactoring with comprehensive test coverage


