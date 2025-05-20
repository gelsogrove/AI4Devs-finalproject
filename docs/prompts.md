# ShopMe WhatsApp E-commerce Platform Prompts

## META PROMPT

ROLE: Project manager,  Full-Stack Developer

The idea is to use WhatsApp as a tool for businesses to offer to their customers. Customers can ask questions, check product availability, request information, or ask for invoices - all managed by a well-trained chatbot.

We'll create an admin panel where users can set up their channel, add products, services, business hours, FAQs, and special offers. This gives the chatbot the data sources it needs to find answers for customers.

The agent is fully configurable - businesses can set the prompt, temperature, top-p, top-k, making the chatbot completely customizable.

I need you to discuss this with me, analyze the details, and go into technical specifics. The application should use React, Node, Prisma, PostgreSQL, and Docker. We'll use OpenRouter for AI and an external payment system.

It's crucial that sensitive data won't be processed inside the AI or sent to any LLM. Instead, we'll generate URLs with quickly-expiring tokens where users can enter sensitive information securely. For example, instead of asking for a delivery address in chat, we'll provide a secure link where customers can enter their address on our platform via HTTPS with a secure token.

We'll implement multiple security layers to prevent spam. Business users can review chat content and block problematic users - blocked users won't receive any more responses. We'll also include configurable message limits (default: 50 messages/day) that automatically block users who exceed them. The platform will require two-factor authentication (2FA) for admin access.

For now, I'll implement CRUD operations for: 
- Products, 
- Categories, 
- Suppliers, 
- Offers,
- Services, 
- GDPR,
- Clients.

The document should include example dialogues to clearly understand the situation, a data model, API list, testing strategy, and an MMP of required features. I also want a competitor analysis.

In my view, the main advantage of having a company chatbot that responds to questions about products, services, and FAQs 24/7 is extremely valuable. It can also function as an e-commerce platform since we can send payment links. The interesting part is that we'll build a database of phone numbers for sending push notifications to maintain customer relationships and alert them to special offers (with an easy opt-out by simply writing "I don't want to receive more offers," which will trigger a function call).

**Function calling is the technical core of this project.** When customers ask questions through WhatsApp, the system will:
1. Process the message with our AI model
2. Identify the customer's intent
3. Trigger the appropriate function call to query our database
4. Retrieve the relevant information (products, prices, availability, etc.)
5. Format the response in a conversational way
6. Send it back through WhatsApp

This approach keeps our data secure and up-to-date while maintaining fast, accurate responses. We'll implement functions for product searches, order creation, status checks, user registration, and more. Each function will be carefully designed to handle specific tasks within our system.

## PROMPT 1: DEVELOPMENT ROADMAP & COMPETITIVE ANALYSIS

ROLE: Product Strategist, Full-Stack Developer, Cloud Engineer

Add a detailed development roadmap to the document with:
- Phase 1: Core features and MVP requirements
- Phase 2: Additional features and platform enhancements
- Phase 3: Advanced capabilities and integrations
- Phase 4: Scaling and enterprise features

For each phase, include:
- Specific features to be developed
- Timeline estimates
- Key milestones
- Testing requirements
- Resources needed

Also add a comprehensive competitive analysis section that:
- Identifies main competitors in the WhatsApp commerce space
- Compares features across competitors
- Analyzes pricing strategies
- Highlights ShopMe's unique advantages
- Identifies potential market gaps

Create a visual comparison matrix to make it easy to see how ShopMe compares to competitors like WATI, Charles, and others. Focus on push notification capabilities as a key differentiator.

## PROMPT 2: INDUSTRY-CROSS SOLUTIONS

ROLE: Product Strategist

Explain how ShopMe can be adapted for different industries like:
- Hotels and accommodation
- Restaurants and food service
- Event venues and planning

For each industry, detail:
- Specific use cases and examples
- Custom features needed
- Example conversation flows
- Benefits over traditional solutions
- ROI potential

Show how the same core platform can be easily configured for these different industries with minimal customization. Highlight how the push notification system works particularly well for these sectors (e.g., reservation reminders, special menu promotions, event updates).

## PROMPT 3: MINIMUM MARKETABLE PRODUCT (MMP)

ROLE: Product Manager

Define what must be included in the Minimum Marketable Product (MMP) to successfully launch ShopMe:

- Core features that must be implemented:
  - List the essential functions and capabilities
  - Prioritize based on market need and technical feasibility
  - Explain why each feature is critical for launch

- Technical infrastructure requirements:
  - Backend services that must be operational
  - Frontend components needed for launch
  - Integration points that must be working

- User experience essentials:
  - Critical user journeys that must be perfect
  - Minimum viable UI requirements
  - Error handling and edge cases to address

- Go-to-market requirements:
  - Documentation needed
  - Support processes required
  - Initial pricing strategy

Differentiate between "must-have" versus "nice-to-have" features, and explain the reasoning behind these decisions. Create a clear checklist that can be used to determine when the product is ready for market.