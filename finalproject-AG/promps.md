# ShopMe WhatsApp E-commerce Platform - Prompts

## PROMPT 1: PROJECT VISION

**ROLE**: Product Strategist

The idea is to use WhatsApp as a tool for businesses to offer to their customers. Customers can ask questions, check product availability, request information, or ask for invoices - all managed by a well-trained chatbot.

**PROJECT VISION:**
ShopMe transforms WhatsApp into a complete sales and customer service channel for businesses. The platform enables companies to deploy AI-powered chatbots that handle customer inquiries, manage orders, provide product information, and send digital documents like invoices - all through WhatsApp without requiring technical knowledge.

**OUTPUT**: Generate the Project Vision section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 2: BUSINESS CONCEPT

**ROLE**: Business Analyst

**BUSINESS VALUE:**
- Provide 24/7 customer service without additional staff
- Automate routine support tasks and inquiries
- Deliver targeted promotional notifications
- Build customer loyalty through fast, intelligent responses
- Reduce operational costs while improving customer satisfaction

**ADMIN PANEL CONCEPT:**
We'll create an admin panel where users can set up their channel, add products, services, business hours, FAQs, and special offers. This gives the chatbot the data sources it needs to find answers for customers through the RAG system.

**OUTPUT**: Generate the Business Concept section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 3: TECHNICAL ARCHITECTURE

**ROLE**: Solution Architect

**CHATBOT ARCHITECTURE:**
The core of the platform is an intelligent WhatsApp chatbot powered by:
- **LangChain** for agent orchestration and function calling
- **OpenRouter** for AI model access (supporting multiple LLM providers)
- **RAG (Retrieval-Augmented Generation)** system that combines:
  - Vector embeddings for semantic search of FAQs, services, and documents
  - Direct database queries for structured data (products, prices, inventory)
  - Real-time data retrieval to ensure accurate, up-to-date responses

**TECHNICAL STACK:**
- **Frontend**: React with TypeScript for admin dashboard
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: LangChain + OpenRouter for multiple LLM providers
- **Containerization**: Docker for deployment
- **Authentication**: JWT-based secure authentication

**OUTPUT**: Generate the Technical Architecture section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 4: SYSTEM DESIGN

**ROLE**: Technical Lead

**DATA FLOW:**
1. Customer sends WhatsApp message
2. LangChain agent processes the message and determines intent
3. System executes appropriate function calls:
   - Products: Direct database search with filters
   - Services/FAQs: Semantic search using embeddings
   - Documents: Vector similarity search through uploaded content
4. RAG system combines retrieved data with conversational context
5. OpenRouter generates natural language response
6. Response sent back via WhatsApp

**AGENT CONFIGURATION:**
The agent is fully configurable - businesses can set the prompt, temperature, top-p, top-k, making the chatbot completely customizable.

**OUTPUT**: Generate the System Design section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 5: SECURITY FRAMEWORK

**ROLE**: Security Engineer

**SECURITY PRINCIPLES:**
It's crucial that sensitive data won't be processed inside the AI or sent to any LLM. Instead, we'll generate URLs with quickly-expiring tokens where users can enter sensitive information securely.

**DATA PROTECTION STRATEGY:**
- No sensitive data (addresses, payment info, personal details) sent to LLMs
- Secure token-based URLs for sensitive data collection
- HTTPS encryption for all data transmission
- Temporary tokens with short expiration times
- Secure data storage with encryption at rest

**OUTPUT**: Generate the Security Framework section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 6: DATA PROTECTION

**ROLE**: Data Protection Officer

**SECURE DATA HANDLING EXAMPLE:**
Instead of asking for a delivery address in chat, we'll provide a secure link where customers can enter their address on our platform via HTTPS with a secure token.

**AUTHENTICATION SECURITY:**
The platform will require two-factor authentication (2FA) for admin access to ensure only authorized personnel can manage business settings and customer data.

**OUTPUT**: Generate the Data Protection section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 7: ANTI-SPAM

**ROLE**: Security Specialist

**SPAM PREVENTION:**
We'll implement multiple security layers to prevent spam. Business users can:
- Review chat content and block problematic users
- Blocked users won't receive any more responses
- Configure message limits (default: 50 messages/day)
- Automatically block users who exceed message limits

**OUTPUT**: Generate the Anti-Spam section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 8: FUNCTION CALLING ARCHITECTURE

**ROLE**: System Administrator

**FUNCTION CALLING CORE ARCHITECTURE:**
**Function calling is the technical core of this project.** When customers ask questions through WhatsApp, the system will:
1. Process the message with our AI model
2. Identify the customer's intent
3. Trigger the appropriate function call to query our database
4. Retrieve the relevant information (products, prices, availability, etc.)
5. Format the response in a conversational way
6. Send it back through WhatsApp

**FUNCTION IMPLEMENTATION:**
This approach keeps our data secure and up-to-date while maintaining fast, accurate responses. We'll implement functions for:
- Product searches
- Order creation
- Status checks
- User registration
- And more specific business tasks

Each function will be carefully designed to handle specific tasks within our system.

**OUTPUT**: Generate the Function Calling Architecture section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 9: CORE FEATURES

**ROLE**: Product Manager

**CORE CRUD OPERATIONS:**
For now, I'll implement CRUD operations for:
- Products
- Categories
- Suppliers
- Offers
- Services
- Clients
- Orders

**EXAMPLE DIALOGUES:**
The document should include example dialogues to clearly understand the situation and demonstrate how the chatbot will interact with customers in real scenarios.

**OUTPUT**: Generate the Core Features section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 10: DATA MODEL

**ROLE**: Data Architect

**DATA MODEL REQUIREMENTS:**
The document should include a comprehensive data model that shows relationships between all entities, field specifications, and database schema design.

**API SPECIFICATIONS:**
Include a complete API list with:
- Endpoint definitions
- Request/response formats
- Authentication requirements
- Error handling specifications

**OUTPUT**: Generate the Data Model section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 11: E-COMMERCE INTEGRATION

**ROLE**: E-commerce Specialist

**E-COMMERCE INTEGRATION:**
The main advantage of having a company chatbot that responds to questions about products, services, and FAQs 24/7 is extremely valuable. It can also function as an e-commerce platform since we can send payment links.

**BUSINESS IMPACT:**
- 24/7 automated customer service
- Increased sales through instant product information
- Reduced operational costs
- Enhanced customer engagement
- Automated marketing capabilities

**OUTPUT**: Generate the E-commerce Integration section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 12: CUSTOMER RELATIONSHIP MANAGEMENT

**ROLE**: Business Analyst

**CUSTOMER RELATIONSHIP MANAGEMENT:**
The interesting part is that we'll build a database of phone numbers for sending push notifications to:
- Maintain customer relationships
- Alert customers to special offers
- Provide easy opt-out functionality (customers can simply write "I don't want to receive more offers," which will trigger a function call)

**OUTPUT**: Generate the Customer Relationship Management section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 13: TESTING STRATEGY

**ROLE**: Quality Assurance Lead

**TESTING STRATEGY:**
Include a comprehensive testing strategy covering:
- Unit testing for all functions
- Integration testing for WhatsApp API
- End-to-end testing for customer journeys
- Load testing for high-volume scenarios

**OUTPUT**: Generate the Testing Strategy section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 14: DEVELOPMENT ROADMAP

**ROLE**: Project Manager

**DEVELOPMENT PHASES:**

**Phase 1: Core Features and MVP Requirements**
- Basic WhatsApp chatbot functionality
- Product catalog management
- Simple FAQ system
- User authentication and admin panel
- Basic AI integration with OpenRouter

**Phase 2: Additional Features and Platform Enhancements**
- Advanced AI with LangChain integration
- Document processing and embeddings
- Multi-language support
- Enhanced security features
- Performance optimization

**Phase 3: Advanced Capabilities and Integrations**
- Analytics and reporting dashboard
- Advanced agent configuration
- Integration APIs for external systems
- Mobile app for business owners
- Advanced spam protection

**Phase 4: Scaling and Enterprise Features**
- Multi-tenant architecture
- Enterprise security features
- Advanced integrations (CRM, ERP)
- White-label solutions
- API marketplace

**OUTPUT**: Generate the Development Roadmap section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 15: MILESTONES

**ROLE**: Development Lead

**PHASE DETAILS:**
For each phase, include:
- Specific features to be developed
- Timeline estimates
- Key milestones
- Testing requirements
- Resources needed

**OUTPUT**: Generate the Milestones section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 16: COMPETITIVE ANALYSIS

**ROLE**: Market Research Analyst

**COMPETITIVE LANDSCAPE:**
Add a comprehensive competitive analysis section that:
- Identifies main competitors in the WhatsApp commerce space
- Compares features across competitors
- Analyzes pricing strategies
- Highlights ShopMe's unique advantages
- Identifies potential market gaps

**COMPETITOR COMPARISON:**
Create a visual comparison matrix to make it easy to see how ShopMe compares to competitors like WATI, Charles, and others. Focus on push notification capabilities as a key differentiator.

**OUTPUT**: Generate the Competitive Analysis section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

---

## PROMPT 17: MARKET POSITIONING

**ROLE**: Competitive Intelligence Specialist

**MINIMUM MARKETABLE PRODUCT (MMP):**
Define what must be included in the Minimum Marketable Product to successfully launch ShopMe:

**Core Features for Launch:**
- List the essential functions and capabilities
- Prioritize based on market need and technical feasibility
- Explain why each feature is critical for launch

**Technical Infrastructure Requirements:**
- Backend services that must be operational
- Frontend components needed for launch
- Integration points that must be working

**User Experience Essentials:**
- Critical user journeys that must be perfect
- Minimum viable UI requirements
- Error handling and edge cases to address

**Go-to-Market Requirements:**
- Documentation needed
- Support processes required
- Initial pricing strategy

**OUTPUT**: Generate the Market Positioning section for PRD.md. If you have doubts, let's discuss them. DO NOT implement anything and DO NOT invent anything.

 