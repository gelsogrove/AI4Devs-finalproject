# ShopMe MVP Task List

> **🔴 IMPORTANT NOTE:**  
> This task list is a living document. Every time a task is completed or modified:
> - Check the corresponding checkbox ✓
> - Add any relevant notes or changes made
> - Update acceptance criteria if needed
> - Document any deviations from the original plan
> - Add new subtasks if discovered during implementation
>
> Keep this document in sync with the actual project status!

### Short Description
ShopMe is a multilingual SaaS platform (Italian, English, Spanish) that turns WhatsApp into a complete sales channel. Customers can create smart chatbots, manage products, receive orders, and send invoices to their clients without any technical skills. Our AI technology automates customer-care responses, manages push notifications, and offers a 24/7 conversational shopping experience, all directly in the world's most popular messaging app.
BUT WE WIL CREATE ONLY A MVP con products faq solo in inglese, facciamo esempi con prodotti italiani con na societa che vende prodotti italiani



## Data Model

### Product
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  imageUrl    String
  category    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### FAQ
```prisma
model FAQ {
  id          String   @id @default(uuid())
  question    String
  answer      String   @db.Text
  category    String?
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### AgentConfig
```prisma
model AgentConfig {
  id          String   @id @default(uuid())
  temperature Float    @default(0.7)
  maxTokens   Int      @default(500)
  topP        Float    @default(0.9)
  model       String   @default("gpt-4-turbo")
  prompt      String   @db.Text
  updatedAt   DateTime @updatedAt
}
```

## Environment Variables (.env)

### Structure
- There will be **two separate `.env` files**:
  - One for the backend (e.g., `/backend/.env`)
  - One for the frontend (e.g., `/frontend/.env`)
- Each will have a corresponding `.env.example` template to document required variables

### Backend `.env` Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopme"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="24h"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"


# Server
PORT=3000
NODE_ENV="development"
API_PREFIX="/api"  # All routes will be prefixed with /api

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Chat History
CHAT_HISTORY_TTL="1h"  # How long to keep chat history in memory
```

### Frontend `.env` Variables
```env
# API
VITE_API_URL="http://localhost:3000"  # Only used in production
VITE_API_PREFIX="/api"                # Used in both dev and prod

# Feature Flags
VITE_ENABLE_CHAT_PERSISTENCE=true
VITE_ENABLE_DEBUG_MODE=false

# Analytics (if needed)
VITE_ANALYTICS_ID=""
```

### API Structure Note
All backend routes will be prefixed with `/api`:
- Authentication: `/api/auth/*`
- Products: `/api/products/*`
- FAQs: `/api/faqs/*`
- Chat: `/api/chat/*`
- Agent Config: `/api/agent-config/*`

In development:
- Frontend runs on `localhost:5173`
- Backend runs on `localhost:3000`
- Vite proxy forwards all `/api/*` requests to backend

### Security Notes
- Never commit real secrets to the repository
- Only commit `.env.example` files
- All sensitive operations must happen in the backend
- Frontend env vars are public - never put secrets there

## Context & Rationale

This document details the step-by-step tasks for building the ShopMe MVP within a 30-hour timeframe. The goal is to deliver a functional, testable, and visually appealing demo of a WhatsApp e-commerce platform, focusing strictly on essential features. The UI will use a clean white and green theme and must be fully responsive for both mobile and desktop.

avremo dopo il login una splashpage che spiega a grandi linee il progetto e che in questo caso facciamo 
Vedere come useremo le call function in un chatbot

### Objective
Build a production-ready MVP for ShopMe, demonstrating:
- User login (JWT, no roles/permissions)
- Product CRUD (API + UI)
- Dynamic AI Agent configuration (temperature, top_p, top_k, maxTokens, prompt)
- Chatbot (answers questions, shows product list, uses function calling)
- Testing (unit, integration, E2E)
- Deployment (EC2 + Nginx)
- Documentation (Swagger, README, seed script)

### Key Constraints & Best Practices
- **No user roles:** Only basic authentication, no role/permission logic.
- **Responsiveness:** All UI must be mobile and desktop friendly.
- **Accessibility:** Color contrast, focus states, labels, and basic usability.
- **UI/UX:** White/green theme, simple wireframes, clear flows.
- **Data from DB:** All data fetched from the database must be post-processed (e.g., price formatting, image URLs, description cleanup) before being shown in the UI or chatbot.
- **MVP focus:** Only essential features, no unnecessary refactors or extras.
- **Security:** JWT, basic rate limiting, no sensitive data in clear text.
- **Chat history is managed on the server:** The server maintains the conversation memory, so the frontend only sends the new message. This avoids sending the full chat history from the frontend each time, improving efficiency and privacy.

### Dynamic Agent Configuration (OpenRouter-style)
The agent (chatbot) configuration is dynamically adjustable at runtime, similar to OpenRouter. Parameters (temperature, top_p, maxTokens, prompt) can be set and updated via UI/API, and the chatbot must always use the latest config for its responses—no backend restart required.

### Chatbot Function Calling & Product List
The chatbot must support function calling: when a user requests the product list, it triggers a backend function to fetch products from the DB, which are then post-processed and formatted for user-friendly display in chat.

### Data Post-Processing
All data from the DB (especially product lists) must be mapped, formatted, and cleaned before being sent to the frontend or chatbot.

### Roadmap (MVP Steps)
1. Project setup (repo, env, lint, backend/frontend base)
2. UI/UX design (wireframes, palette, base components, share compoenents)
3. Auth (User model, login API/UI, no roles)
4. Product CRUD (API + UI)
5. AgentConfig (API + UI)
6. Chatbot (UI + backend, function calling, config compliance)
7. Testing (unit, integration, E2E)
8. Documentation & Swagger
9. Deploy (EC2/Nginx)
10. Final polish & QA

---


Use  ./owasp-secure-coding.md for AWASP security



## 0. Cursor Rules & Project Standards
- [ ] Write and share Cursor Rules (language, commit, DDD, FE best practice, PRD reference, etc.)
ask me....and you will copy  from my cursorRukes!!!

---

## 1. Project Setup
- [x] Initialize repo, env, lint, Prettier, .env.example
- [x] Setup backend (Node.js, Express, TypeScript, Prisma, PostgreSQL):
    - Configure Express server on port 3000
    - Setup API routes under `/api` prefix
    - Configure CORS for development
    - Setup database scripts in package.json:
      ```json
      {
        "scripts": {
          "db:reset": "prisma migrate reset --force && prisma migrate deploy",
          "db:seed": "prisma db seed",
          "db:setup": "npm run db:reset && npm run db:seed"
        },
        "prisma": {
          "seed": "ts-node prisma/seed.ts"
        }
      }
      ```
- [x] Setup frontend (React, TailwindCSS, TypeScript, Vite/Next.js):
    - Configure Vite proxy for development:
      ```js
      // vite.config.ts
      export default defineConfig({
        server: {
          proxy: {
            '/api': 'http://localhost:3000'
          }
        }
      })
      ```
    - All API calls will use `/api` prefix
- [x] Setup unit test folder   __test/unit
- [x] Setup integration test folder   __test/integration
- [x] Setup Cypress  

Acceptance Criteria:
- Project runs with `npm run start` command
- All test commands work: `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`
- Database commands work: `npm run db:reset`, `npm run db:seed`, `npm run db:setup`
- ESLint and Prettier are configured and working
- TypeScript compilation succeeds without errors
- Database connection is established successfully
- Basic Hello World endpoints work in both frontend and backend
- Frontend successfully proxies requests to backend
- API endpoints are accessible through `/api` prefix
- .gitinore 

---

## 2. UI/UX Design & Shared Components
- [x] Define color palette (white/green), typography
- [x] UI for all screens (login, splash, product list, product form, agent config, chat, faq management) will be designed and implemented directly in code, following the provided UI/UX specifications (color palette, layout, flows, responsiveness).
- [x] Implement login page
- [x] Implement splash modal (closeable, MVP info)
- [x] Implement main menu (Products, FAQs, Agent settings, Chatbot)
- [x] Build shared UI components (buttons, cards, forms, modals)
    - [x] Use shared components wherever possible for consistency
    - [x] Ensure all UI elements (colors, buttons, spacing) are uniform and responsive
- [x] Implement chatbot UI (bubbles, loading, left/right, green/gray, style as img/chatHistory.png)
- [x] Implement agent settings UI (large textarea, sliders, style as img/agentConfiguration.png)
- [x] Accessibility: labels, focus, color contrast

Acceptance Criteria:
- All UI components are responsive (mobile and desktop)
- Color scheme matches white/green theme
- Components are reusable across the application
- UI is consistent across all pages
- All interactive elements have proper loading and error states

---

## 3. Authentication
- [ ] User model/schema (Prisma)
- [ ] JWT-based login API
- [ ] Login form (frontend) with validation
- [ ] Secure JWT storage (httpOnly/localStorage for demo)
- [ ] Protect all sensitive endpoints with JWT middleware

Acceptance Criteria:
- Users can log in with email/password
- JWT tokens are stored securely
- Protected routes redirect to login
- Error messages are clear and user-friendly
- Session persists after page reload
- Logout functionality works correctly

---

## 4. Product & FAQ Management (CRUD)
- [ ] Product model/schema (Prisma)
- [ ] FAQ model/schema (Prisma)
- [ ] Product API endpoints (GET, POST, PUT, DELETE, with filters)
- [ ] FAQ API endpoints (GET, POST, PUT, DELETE, with filters)
- [ ] Product CRUD UI (cards, create/edit form, delete with confirmation)
- [ ] FAQ CRUD UI (list view, create/edit form, delete with confirmation)
- [ ] Product images: upload/seed at least one image per product
- [ ] Form validation and error handling for both Products and FAQs

Acceptance Criteria:
- Products and FAQs can be created, read, updated, and deleted
- Image upload works for products
- All forms have proper validation
- List views support pagination
- Search and filters work correctly
- Changes are reflected immediately in the UI
- All operations are properly logged
- Error handling is implemented for all operations

---

## 5. Agent Configuration
- [ ] AgentConfig model/schema (Prisma)
- [ ] API endpoints: GET, PUT (set temperature, top_p, maxTokens, model, prompt)
- [ ] AgentConfig UI: 
    - Sliders for temperature, top_p
    - Number input for maxTokens
    - Dropdown for model selection
    - Textarea for prompt
    - Validation for all fields
- [ ] IMPORTANT CLARIFICATIONS ON AGENT CONFIG:
    - Agent configuration affects HOW the LLM responds, not WHAT functions it can call
    - Available parameters:
        - temperature: controls response randomness
        - top_p: nucleus sampling parameter
        - maxTokens: maximum response length
        - model: OpenAI model to use
        - prompt: system message that guides LLM behavior
    - Function calling capabilities are defined separately in the backend
    - Changes to agent config take effect immediately on next chat message

Acceptance Criteria:
- All agent parameters can be updated (temperature, top_p, maxTokens, model, prompt)
- Changes take effect immediately
- Configuration persists across sessions
- Validation prevents invalid values
- UI shows current configuration status
- Changes are logged for debugging

---

## 6. Chatbot (Conversational UI & OpenRouter Integration)
- [ ] Chat UI (input, bubbles, loading, responsive)
- [ ] Backend chat endpoint (`POST /api/chat`)
- [ ] Integrate with real OpenAI API (use agent config params)
- [ ] Implement function calling:
    - [ ] IMPORTANT CLARIFICATIONS ON FUNCTION CALLING:
        - The chatbot will only implement READ operations via these functions:
            1. getProductList (pagination, filters by category/price)
            2. getProductDetails (by productId)
            3. searchProducts (by query string)
            4. getFAQs (all or by category)
            5. searchFAQs (by query string)
        - The LLM (not the backend) decides when to call these functions
        - Function call flow:
            1. User sends message
            2. Backend sends message + function schemas to LLM
            3. LLM decides if/which function to call
            4. Backend executes function (DB query)
            5. Results sent back to LLM for natural language response
    - [ ] Parse prompt, detect when DB data is needed
    - [ ] Build and validate SELECT query (fields, where, limit)
    - [ ] Execute query, post-process data
    - [ ] Return data to LLM, let LLM format the final response
    - [ ] Return formatted response to user
    - [ ] All logic must be clearly documented and easily extensible for future function calls
    - [ ] Once the backend has post-processed the data, it must return the result to the LLM (OpenAI), which will analyze and generate a natural, formatted response for the user, integrating the data into the chat reply. The pipeline should be: user request → function call → DB → post-processing → LLM → user response.
- [ ] (Optional) Persist chat history (Conversation/Message)

Acceptance Criteria:
- Chatbot responds within 2 seconds
- All 5 function calls work correctly (3 product-related, 2 FAQ-related)
- Chat history is displayed correctly
- Error states are handled gracefully
- Messages are properly formatted
- Function calling logic works as documented
- Chat interface is responsive and user-friendly
- Agent configuration affects responses as expected

---

## 7. Seed & Demo Data
- [ ] Seed script for at least 10 products (name, description, category, price, image)
- [ ] Seed script for at least 5 FAQs covering:
    - Shipping and delivery information
    - Return policy
    - Payment methods
    - Product warranty
    - How to use the chatbot
- [ ] Seed at least one agent configuration
- [ ] Seed at least one user (for login)

Acceptance Criteria:
- All seed scripts run without errors
- Product data is realistic and varied
- FAQs cover all specified categories
- Images are properly stored and served
- Seed data is consistent with schema
- Demo account works for testing
- Data can be reset to initial state

---

## 8. Testing
### 8.1 Unit Tests
- [ ] Backend: services, controllers, utils
- [ ] Frontend: shared components, hooks

### 8.2 Integration Tests
- [ ] Backend: API endpoints (auth, products, agent config, chat)

### 8.3 E2E Tests con Cypress
- [ ] E2E: login, CRUD products, agent config, chat flow
- [ ] E2E: error cases (invalid login, invalid product, etc.)
- [ ] E2E: must run in CI, block deploy if fail

### 8.4 Manual QA
- [ ] Walkthrough all flows on desktop and mobile

Acceptance Criteria:
- Unit test coverage > 80%
- Integration tests cover all main flows
- E2E tests cover critical user journeys
- Tests run in CI pipeline
- All tests pass before deployment
- Test reports are generated
- Edge cases are covered

---

## 9. Documentation
- [ ] Swagger/OpenAPI docs (all endpoints, in English)
- [ ] README (setup, usage, deploy, in English)
- [ ] Document function call contract and pipeline

Acceptance Criteria:
- API documentation is complete and accurate
- Setup instructions work on fresh install
- All endpoints are documented in Swagger
- Code is properly commented
- README includes all necessary information
- Troubleshooting guide is included
- Documentation is in English

---

## 10. CI/CD & Deployment
- [ ] CI pipeline: lint, build, seed, E2E (block deploy if fail)
- [ ] Setup EC2 instance with required dependencies
- [ ] Setup and configure Nginx as reverse proxy:
    - Configure SSL/TLS
    - Setup proper caching headers
    - Configure gzip compression
    - Setup proper security headers
    - Configure rate limiting
    - Setup proper logging
- [ ] Configure PM2 for Node.js process management
- [ ] Deploy pipeline: 
    - SSH to EC2
    - Pull latest changes
    - Run migrations/seeds
    - Build frontend
    - Restart services
- [ ] Setup monitoring and logging
- [ ] Smoke test after deploy
- [ ] Deliver all credentials, links, and documentation

Acceptance Criteria:
- Automatic deployment on main branch
- Rollback mechanism works
- Environment variables are properly managed
- SSL is configured correctly
- Application runs without errors on EC2
- Nginx is properly configured as reverse proxy
- Monitoring is in place

