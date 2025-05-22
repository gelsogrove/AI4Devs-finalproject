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
The API will be available at http://localhost:3000

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
