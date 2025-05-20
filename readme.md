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
- React 19
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- Docker and Docker Compose
- PostgreSQL

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/shopme.git
cd shopme
```

2. Start the Docker environment
```bash
docker-compose up -d
```

3. Install dependencies and set up the backend
```bash
cd backend
npm install
npm run db:setup
npm run dev
```

4. Install dependencies and start the frontend
```bash
cd frontend
npm install
npm run dev
```

5. Access the application at http://localhost:3000

## 📝 Project Structure

```
shopme/
├── backend/               # Backend Express application
│   ├── prisma/            # Database schema and migrations
│   ├── src/               # Source code
│   └── __tests__/         # Test files
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   └── src/               # Source code
├── docs/                  # Documentation files
│   └── PRD.md             # Product Requirements Document
└── docker-compose.yml     # Docker configuration
```

## 💻 Development

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

For detailed information about the project, refer to the documentation in the `docs` folder:
- [Product Requirements Document](docs/PRD.md)
- [Task List](docs/task-list.md)
- [OWASP Secure Coding Guidelines](docs/owasp-secure-coding.md)

## 🌐 Business Model

ShopMe offers a tiered subscription model:
- **Basic Plan (€49/month)**: Single WhatsApp line, 1000 AI messages
- **Professional Plan (€149/month)**: 3 WhatsApp numbers, 5000 AI messages
- **Enterprise Plan (custom)**: Unlimited connections, white-label options
