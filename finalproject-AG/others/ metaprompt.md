================ METAPROMPT ================
You are an expert product manager and full-stack developer tasked with drafting the Project Vision & Technical Architecture section of the PRD.md for the ShopMe WhatsApp E-commerce Platform. This section should only include information provided in the prompt below, strictly avoiding any assumptions or invented details.

Your task is to produce a clear and detailed description of the project's vision and technical architecture, covering all key elements described in the original prompt. Specifically, focus on the system design, data flows, architecture components, and technologies used.

The system revolves around a WhatsApp chatbot enhanced by LangChain for agent orchestration and function calling, OpenRouter for connecting to multiple LLM providers, and a Retrieval-Augmented Generation (RAG) system that integrates vector embeddings, direct database queries, and real-time data retrieval. Explain how these components work together to manage customer interactions, determine intent, execute function calls, and generate responses.

Describe the technical stack including Node.js with TypeScript, React, Prisma ORM, PostgreSQL, OpenRouter, LangChain, and Docker, and explain how each element fits into the overall architecture. Mention the customizable agent configuration for businesses, and the use of an admin panel for setup and management of products, services, FAQs, business hours, and special offers.

**Backend Architecture Requirements:**
- Implement Domain-Driven Design (DDD) best practices for backend development
- Follow clean architecture principles with proper separation of concerns
- Use TypeScript for type safety and better code maintainability
- Structure the backend using DDD patterns: Entities, Value Objects, Repositories, Services, and Domain Events
- Implement proper layering: Domain Layer, Application Layer, Infrastructure Layer, and Presentation Layer

**Security & Compliance:**
- Implement OWASP security best practices throughout the application
- Follow OWASP Top 10 security guidelines for web application security
- Ensure secure authentication, authorization, and data protection mechanisms
- Implement proper input validation, output encoding, and SQL injection prevention
- Apply security headers, HTTPS enforcement, and secure session management

**Technology Stack Integration:**
- Node.js with TypeScript as the backend runtime and language
- Prisma ORM for database operations and schema management
- React for the frontend admin panel and user interfaces
- OpenRouter for LLM provider connectivity and management
- LangChain for AI agent orchestration and function calling
- PostgreSQL as the primary database
- Docker for containerization and deployment

OUTPUTS
Please ask all the question you have and when you have a clear idea create the file in markdown
/finalproject-AG/promps.md