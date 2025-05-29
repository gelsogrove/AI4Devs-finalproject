# ShopMe - AI-Powered E-commerce Platform

## 📋 Overview

ShopMe is a comprehensive SaaS platform that transforms traditional e-commerce into an AI-powered sales channel. The platform features:

- **AI Chatbot (Sofia)**: Intelligent customer service assistant
- **Product Management**: Complete catalog management system
- **Document Processing**: PDF upload and AI-powered content extraction
- **Service Management**: Business services catalog
- **User Authentication**: Secure login and profile management
- **Modern UI/UX**: Beautiful, responsive interface with animations

### 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI Integration**: OpenRouter API for chatbot functionality
- **File Processing**: PDF parsing and embedding generation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd AI4Devs-finalproject
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start development server
npm run dev
```

---

## 🖥️ Development

### Backend Development

```bash
cd backend

# Start development server with hot reload
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Reset database
npx prisma db push --force-reset

# View database in Prisma Studio
npx prisma studio
```

**Backend runs on**: `http://localhost:3000`

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Frontend runs on**: `http://localhost:3001` (or next available port)

### Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3000
NODE_ENV=development

# OpenRouter API (for AI chatbot)
OPENROUTER_API_KEY=your_openrouter_api_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/documents

# JWT (optional for production)
JWT_SECRET=your_jwt_secret
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests with Cypress
npm run cypress:open

# Run E2E tests headless
npm run cypress:run
```

### Test Coverage

- **Backend**: Unit tests for services, controllers, and repositories
- **Frontend**: Component tests and integration tests
- **E2E**: Full user journey testing with Cypress

---

## 🌐 URLs and Endpoints

### Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:3001` | Main application interface |
| Backend API | `http://localhost:3000` | REST API server |
| API Documentation | `http://localhost:3000/api-docs` | Swagger/OpenAPI docs |
| Health Check | `http://localhost:3000/api/health` | Server health status |
| Prisma Studio | `http://localhost:5555` | Database management UI |

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

#### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Documents
- `GET /api/documents` - List user documents
- `POST /api/documents/upload` - Upload PDF document
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/stats` - Get document statistics

#### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/active` - Get active services

#### Chatbot
- `POST /api/chat` - Send message to AI chatbot
- `GET /api/chat/history` - Get chat history

---

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Docker Services

- **Backend**: Node.js API server
- **Frontend**: Nginx serving React app
- **Database**: PostgreSQL database
- **Redis**: Session storage (optional)

---

## 📦 Production Deployment

### Build Process

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### Environment Setup

#### Production Backend
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/database
OPENROUTER_API_KEY=your_production_key
```

#### Production Frontend
```env
VITE_API_URL=https://your-domain.com
```

### Deployment Flow

1. **CI Pipeline** (GitHub Actions):
   - Install dependencies
   - Run linting and tests
   - Build applications
   - Upload artifacts to S3

2. **Deploy Pipeline**:
   - Download artifacts from S3
   - Deploy to EC2 instance
   - Configure Nginx reverse proxy
   - Start services with PM2

### Production URLs

| Service | URL | Description |
|---------|-----|-------------|
| Application | `https://your-domain.com` | Main application |
| API | `https://your-domain.com/api` | API endpoints |
| Health Check | `https://your-domain.com/api/health` | Server status |

---

## 🛠️ Development Scripts

### Backend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run db:reset     # Reset database
npm run db:seed      # Seed database with sample data
```

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

#### Database Issues
```bash
# Reset Prisma database
cd backend
npx prisma db push --force-reset
npx prisma generate
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Backend TypeScript Errors
```bash
# Regenerate Prisma client
cd backend
npx prisma generate
npm run build
```

### Debug Mode

#### Backend Debug
```bash
cd backend
DEBUG=* npm run dev
```

#### Frontend Debug
```bash
cd frontend
VITE_DEBUG=true npm run dev
```

---

## 📚 Additional Resources

- [API Documentation](http://localhost:3000/api-docs) - Swagger/OpenAPI docs
- [Prisma Documentation](https://www.prisma.io/docs) - Database ORM
- [React Documentation](https://react.dev) - Frontend framework
- [TailwindCSS Documentation](https://tailwindcss.com/docs) - CSS framework
- [OpenRouter API](https://openrouter.ai/docs) - AI API integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
