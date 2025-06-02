# 🛍️ ShopMefy - AI4Devs Final Project

##  Overview

**ShopMefy** is a multilingual SaaS platform  that turns WhatsApp into a complete sales channel. Businesses can create smart chatbots, manage products, and handle customer inquiries without any technical skills. Our AI technology automates customer-care responses and offers a 24/7 conversational shopping experience, all directly in the world's most popular messaging app. Customers can request information, browse products, and ask for documents like invoices through natural conversation with the AI assistant.

All sensitive operations are handled securely through temporary links with security tokens. These links direct customers to our secure website for registration forms, payments, invoices, and accessing personal data. This keeps all sensitive information outside of chat conversations, ensuring data protection while maintaining a smooth customer experience.

### 🎯 Current MVP Scope

**This MVP focuses on the core RAG (Retrieval-Augmented Generation) functionality.** Business owners can manage their knowledge base through:

- **Products**: Complete catalog management with categories and pricing
- **Services**: Service offerings with descriptions and pricing  
- **FAQ**: Question-answer pairs for customer support
- **Documents**: PDF upload and processing for company policies/information

The **AI chatbot** uses **function calling** and **embeddings** to intelligently search and retrieve information from this knowledge base to answer customer inquiries.

### 🚧 Features Not Yet Implemented

The following features are planned for future releases but not included in this MVP:

- **Customers Table**: Customer registration and profile management
- **Orders Table**: Order processing and management system
- **Chat History**: Conversation persistence and analytics
- **WhatsApp Business API**: Direct WhatsApp integration for live messaging


### 🏪 Example Client: Gusto Italiano

**Gusto Italiano** is an example Italian specialty foods store that uses the ShopMefy platform. Their AI assistant **Sofia** helps customers discover authentic Italian products, provides expert recommendations, and handles customer inquiries through WhatsApp. This demonstrates how any food business can leverage ShopMefy to create their own branded e-commerce experience.

### 🏗️ Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenRouter API + LangChain
 
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

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run chatbot tests
npm run test:chatbot
```

### Frontend E2E Tests
```bash
cd frontend

# Run end-to-end tests
npm run test:e2e
```

## 📚 API Documentation

**Swagger UI**: Interactive API documentation available at `http://localhost:8080/api-docs`
 