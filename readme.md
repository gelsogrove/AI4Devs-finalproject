# ShopMe - WhatsApp E-commerce Platform

## Overview
ShopMe is a SaaS platform that transforms WhatsApp into a complete sales channel for businesses. It enables product management, order processing, and customer interaction through WhatsApp using AI-powered chatbots.

## How to Run Docker
```bash
# Start the Docker environment
docker-compose up -d
```

## Run the Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will be available at http://localhost:5173

## Run the Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up the database
npm run db:setup

# Start development server
npm run dev
```
The API will be available at http://localhost:3001
API Documentation (Swagger) will be available at http://localhost:3001/api-docs

## Run Unit Tests
```bash
# Run backend unit tests
cd backend
npm test

# Run frontend unit tests
cd frontend
npm test
```

## Run Integration Tests
```bash
# Run backend integration tests
cd backend
npm run test:integration
```

## Run E2E Tests
```bash
# Run Cypress E2E tests
cd frontend
npm run cypress:open
```

## Quick Start
For development, you can use the provided script to start both frontend and backend:
```bash
./dev.sh
```

## Deploy Process (Summary)

1. **CI Pipeline** (GitHub Actions):
   - Installs dependencies, lints, runs unit/integration/E2E tests for backend and frontend.
   - Builds backend and frontend.
   - Uploads build artifacts to an S3 bucket if all tests pass.

2. **Deploy Pipeline** (GitHub Actions):
   - Downloads artifacts from S3.
   - Connects to the EC2 instance via SSH.
   - Deploys backend and frontend to EC2 (`/home/shopme/backend` and `/home/shopme/frontend`).
   - Installs dependencies, builds, and starts backend with PM2.
   - Configures Nginx as a reverse proxy (port 80 → 8080 for backend, 80 → 3000 for frontend).

3. **Database**:
   - The production database is managed by AWS RDS PostgreSQL (not on EC2).
   - The backend connects to RDS using the `DATABASE_URL` environment variable.

4. **Infrastructure as Code**:
   - Infrastructure provisioning (EC2, RDS, S3, etc.) can be automated with Terraform (recommended for future improvements).

## Network & Port Flow: Development vs Production

### Development
```
[Browser]
   |\
   | \-- http://localhost:5173  (Frontend - Vite)
   |____ http://localhost:3001  (Backend - Node.js/Express)

[Frontend] (5173) <---proxy---> [Backend] (3001)
[Database] (5432, Docker Compose)
```
- You access frontend and backend directly on their respective ports.
- Vite may proxy `/api` calls to backend.

### Production (on EC2, with Nginx)
```
[Internet]
   |
   |  (public)
   v
[Nginx Reverse Proxy] (port 80)
   |-----------------------------|
   |                             |
   v                             v
[Frontend] (localhost:3000)   [Backend] (localhost:8080)

[Database: AWS RDS PostgreSQL] (outside EC2, private)
```
- Only Nginx (port 80) is exposed to the internet.
- Nginx routes:
  - `/api` requests → backend (8080)
  - all other requests → frontend (3000)
- Backend connects to RDS PostgreSQL (not on EC2).

**Summary Table:**

| Environment   | Frontend | Backend | DB      | Nginx | Public Port | Notes                      |
|---------------|----------|---------|---------|-------|-------------|----------------------------|
| Development   | 5173     | 3001    | 5432    | -     | 5173, 3001  | Direct access to FE & BE   |
| Production    | 3000     | 8080    | RDS     | 80    | 80          | Only Nginx is public       |
