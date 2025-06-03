# CI/CD Workflow Generation Prompt

## 🎯 **Objective**
Create a GitHub Actions CI/CD workflow for a Node.js + TypeScript + React + PostgreSQL project.

## 📋 **Required Workflow Steps**

Create a `.github/workflows/ci.yml` file that implements these 20 steps in sequence:

### **Setup & Environment**
1. **Checkout repository**
2. **Set up Node.js** (version 20, with npm caching)
3. **Start PostgreSQL with Docker Compose**
4. **Install backend dependencies**
5. **Install frontend dependencies**
6. **Create backend .env file**
7. **Create frontend .env file**

### **Database & Build**
8. **Generate Prisma client**
9. **Setup test database schema**
10. **Build backend**
11. **Build frontend**

### **Testing**
12. **Run backend unit tests**
13. **Debug database state before integration tests**
14. **Test single integration test first**
15. **Run backend integration tests (with debug)**

### **E2E Testing**
16. **Start backend for E2E tests**
17. **Start frontend for E2E tests**
18. **Run E2E tests**

### **Cleanup**
19. **Stop frontend and backend**
20. **Stop Docker Compose**

## 🔧 **Technical Requirements**

- **OS**: ubuntu-latest
- **Node.js**: Version 20
- **Database**: PostgreSQL via Docker Compose (service name: `db`)
- **Package Manager**: npm with `--legacy-peer-deps` flag
- **Test Environment**: NODE_ENV=test
- **Database URL**: postgresql://shopmefy:shopmefy@localhost:5434/shopmefy

## 🧪 **Test Configuration**

- **Unit Tests**: `npm run test:unit` (213 tests)
- **Integration Tests**: `npm run test:integration` (70 tests) with debug flags
- **E2E Tests**: Cypress headless mode
- **Jest Flags**: `--verbose --detectOpenHandles --forceExit --runInBand --no-cache`

## 🚀 **Expected Features**

- npm caching for performance
- Health checks for database and servers
- Debug output for troubleshooting
- Proper cleanup with `if: always()`
- Environment variables with fallback values
- Sequential test execution to avoid conflicts

