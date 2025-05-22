# ShopMe Backend

This is the backend service for the ShopMe platform, providing API endpoints for products, FAQs, user authentication, and more.

## Project Structure

The backend follows Domain-Driven Design principles:

- `src/domain/` - Core domain entities, interfaces, and business logic
- `src/application/` - Application services and use cases
- `src/infrastructure/` - Database repositories and external services
- `src/controllers/` - API controllers and request handlers
- `src/routes/` - API route definitions
- `src/utils/` - Utility functions and helpers
- `__tests__/` - Unit and integration tests

## Environment Setup

```
PORT=3001                  # Server port
NODE_ENV=development       # Environment (development, production, test)
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS
DATABASE_URL=...           # Database connection string
JWT_SECRET=...             # JWT secret key
```

Copy the `.env.example` file to `.env` and update the values accordingly.

## Available Scripts

- `npm start` - Run in production mode
- `npm run dev` - Run in development mode with auto-reload
- `npm run build` - Build for production
- `npm run db:setup` - Reset database and run migrations and seed

## Known Issues

### Unit and Integration Tests

The unit and integration tests currently fail due to a mismatch between the test expectations and the actual implementation:

1. **Entity Schema Changes**: The entity structure has been updated, but tests haven't been updated to match.

2. **Service Method Changes**: Several methods in `ProductService` and other services have changed signatures or return types.

3. **Repository Pattern Changes**: The repository pattern implementation has evolved, but test mocks are still using the old pattern.

### Fix Plan

1. Update test mocks to match current implementation (in progress)
2. Fix service method signatures in tests
3. Update response expectations in controller tests
4. Fix integration test setup

Note: While these tests are being fixed, the frontend E2E tests provide reasonable coverage to ensure system functionality. 