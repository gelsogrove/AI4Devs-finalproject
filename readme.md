# ShopMe - WhatsApp E-commerce Platform

ShopMe is a multilingual SaaS platform that transforms WhatsApp into a complete sales channel. The platform allows businesses to create smart chatbots, manage products, receive orders, and send invoices to their clients without requiring technical skills.

## 🌟 Features

- **WhatsApp Integration**: Turn WhatsApp into a complete sales channel
- **AI-Powered Chatbots**: Automate customer-care responses and shopping experiences
- **Product Catalog Management**: Easy interface to manage products and inventory
- **Secure Transactions**: Token-based system for sensitive operations
- **Multilingual Support**: Available in Italian, English, and Spanish

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Domain-Driven Design (DDD) architecture

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- Docker and Docker Compose
- PostgreSQL

### Installation

1. Clone the repository
```bash
git clone https://github.com/AI4Devs-finalproject/shopme.git
cd shopme
```

2. Start the Docker environment
```bash
docker-compose up -d
```

3. Install dependencies for both backend and frontend
```bash
# Backend dependencies
cd backend
npm install
npm run db:setup

# Frontend dependencies
cd ../frontend
npm install
```

4. Start the application in development mode
```bash
# Da eseguire nella root del progetto
./dev.sh
```

5. Access the application at http://localhost:5173

### Alternative Manual Startup
You can also start the frontend and backend separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Project Structure

```
shopme/
├── backend/               # Backend Express application with DDD architecture
│   ├── prisma/            # Database schema and migrations
│   ├── src/               
│   │   ├── domain/        # Domain entities and business logic
│   │   ├── application/   # Application services and use cases
│   │   ├── infrastructure/# Database repositories and external services
│   │   └── interfaces/    # API controllers and routes
│   └── __tests__/         # Test files
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   └── src/               # Source code
├── docs/                  # Documentation files
│   └── PRD.md             # Product Requirements Document
├── dev.sh                 # Script per avviare l'app in modalità sviluppo
├── start.sh               # Script per avviare l'app in modalità produzione
└── docker-compose.yml     # Docker configuration
```

## 💻 Development

### Scripts principali
- Avviare in sviluppo: `./dev.sh` (avvia sia backend che frontend)
- Avviare in produzione: `./start.sh` (richiede di aver già fatto la build)

### Backend
- Run development server: `cd backend && npm run dev`
- Run tests: `cd backend && npm test`
- Reset database: `cd backend && npm run db:reset`

### Frontend
- Run development server: `cd frontend && npm run dev`
- Run Cypress tests: `cd frontend && npm run cypress:open`
- Build for production: `cd frontend && npm run build`

## 🔒 Security

The application implements OWASP security best practices:
- Token-based authentication
- Secure data handling
- Links with security tokens for sensitive operations

## 📚 Documentation

For detailed information about the project, refer to the documentation:
- [Product Requirements Document](docs/PRD.md)
- [Task List](task-list.md)
- [OWASP Secure Coding Guidelines](docs/owasp-secure-coding.md)

## 🌐 Business Model

ShopMe offers a tiered subscription model:
- **Basic Plan (€49/month)**: Single WhatsApp line, 1000 AI messages
- **Professional Plan (€149/month)**: 3 WhatsApp numbers, 5000 AI messages
- **Enterprise Plan (custom)**: Unlimited connections, white-label options
