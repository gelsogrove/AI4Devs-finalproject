# 📁 AI4Devs Final Project - Folder Structure

This document defines the **mandatory folder structure** that must be followed throughout the project. All code, tests, and documentation must adhere to this organization.

## 🏗️ Root Project Structure

```
AI4Devs-finalproject/
├── 📁 backend/                     # Backend Node.js application
├── 📁 frontend/                    # Frontend React application  
├── 📁 scripts/                     # Project automation scripts
├── 📁 prompts/                     # Documentation and prompts
├── 📄 docker-compose.yml           # Docker services configuration
├── 📄 .gitignore                   # Git ignore rules
└── 📄 README.md                    # Project overview
```

## 🔧 Backend Structure (`/backend/`)

```
backend/
├── 📁 src/                         # Source code
│   ├── 📁 controllers/             # API controllers (DDD Application Layer)
│   ├── 📁 services/                # Business logic services (DDD Domain Layer)
│   ├── 📁 repositories/            # Data access layer (DDD Infrastructure)
│   ├── 📁 middleware/              # Express middleware
│   ├── 📁 routes/                  # API route definitions
│   ├── 📁 types/                   # TypeScript type definitions
│   ├── 📁 utils/                   # Utility functions
│   └── 📄 index.ts                 # Application entry point
├── 📁 prisma/                      # Database schema and migrations
│   ├── 📁 migrations/              # Database migration files
│   ├── 📁 temp/                    # Temporary files for seeding
│   ├── 📄 schema.prisma            # Database schema definition
│   └── 📄 seed.ts                  # Database seeding script
├── 📁 uploads/                     # File upload storage
│   └── 📁 documents/               # Document storage directory
├── 📁 __tests__/                   # Test files (MANDATORY structure)
│   ├── 📁 unit/                    # Unit tests
│   │   ├── 📁 __mocks__/           # Unit test mocks
│   │   └── 📄 *.spec.ts            # Unit test files
│   └── 📁 integration/             # Integration tests
│       ├── 📁 __mocks__/           # Integration test mocks
│       └── 📄 *.integration.spec.ts # Integration test files
├── 📄 package.json                 # Dependencies and scripts
├── 📄 jest.config.js               # Jest testing configuration
├── 📄 tsconfig.json                # TypeScript configuration
└── 📄 .env                         # Environment variables (DO NOT COMMIT)
```

## ⚛️ Frontend Structure (`/frontend/`)

```
frontend/
├── 📁 src/                         # Source code
│   ├── 📁 components/              # React components
│   │   ├── 📁 ui/                  # Reusable UI components (shadcn/ui)
│   │   └── 📁 layout/              # Layout components
│   ├── 📁 pages/                   # Page components
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 services/                # API service functions
│   ├── 📁 types/                   # TypeScript type definitions
│   ├── 📁 utils/                   # Utility functions
│   ├── 📁 styles/                  # CSS and styling files
│   └── 📄 main.tsx                 # Application entry point
├── 📁 public/                      # Static assets
├── 📁 __test__/                    # Test files (MANDATORY structure)
│   ├── 📁 unit/                    # Unit tests
│   │   └── 📄 *.{test,spec}.{js,ts,tsx} # Unit test files
│   └── 📁 e2e/                     # End-to-end tests
│       ├── 📁 support/             # Cypress support files
│       │   ├── 📄 commands.js      # Custom Cypress commands
│       │   └── 📄 e2e.js           # Cypress setup file
│       └── 📄 *.cy.{js,ts,tsx}     # E2E test files
├── 📄 package.json                 # Dependencies and scripts
├── 📄 vite.config.ts               # Vite configuration
├── 📄 vitest.config.ts             # Vitest testing configuration
├── 📄 cypress.config.cjs           # Cypress E2E testing configuration
├── 📄 tailwind.config.js           # Tailwind CSS configuration
└── 📄 tsconfig.json                # TypeScript configuration
```

## 🤖 Scripts Structure (`/scripts/`)

```
scripts/
├── 📄 move-temp-files.sh           # Move files from temp to uploads
├── 📄 restart-all.sh               # Restart all services
├── 📄 run-e2e-tests.sh             # Run E2E test suite
└── 📄 generate-zip-archives.sh     # Generate project archives
```

## 📚 Documentation Structure (`/prompts/`)

```
prompts/
├── 📁 docs/                        # Technical documentation
│   ├── 📄 PRD.md                   # Product Requirements Document
│   ├── 📄 langchain.md             # LangChain implementation guide
│   ├── 📄 metaprompt.md            # AI agent metaprompt
│   ├── 📄 owasp.md                 # Security guidelines
│   └── 📄 prompt_agent.md          # Agent prompt configuration
├── 📄 04_task-list.md              # Project task tracking
└── 📄 folder-structure.md          # This document
```

## 🚫 Forbidden Patterns

### ❌ DO NOT CREATE:
- `package.json` in project root
- Test files outside `__tests__/` or `__test__/` directories
- Loose configuration files in root
- `cypress/` directory in frontend (use `__test__/e2e/` instead)
- Files directly in `src/` without proper subdirectories

### ❌ DO NOT USE:
- Mixed naming conventions (stick to kebab-case for files)
- Nested test directories beyond the defined structure
- Hardcoded paths that don't follow this structure

## ✅ Mandatory Rules

### 📁 **Directory Naming**
- Use **kebab-case** for directory names: `document-service`, `user-controller`
- Use **camelCase** for TypeScript files: `userService.ts`, `documentController.ts`
- Use **PascalCase** for React components: `UserProfile.tsx`, `DocumentList.tsx`

### 🧪 **Test Organization**
- **Unit tests**: `__tests__/unit/` (backend) or `__test__/unit/` (frontend)
- **Integration tests**: `__tests__/integration/` (backend only)
- **E2E tests**: `__test__/e2e/` (frontend only)
- **Mocks**: Always in `__mocks__/` subdirectory within test folders

### 📦 **File Placement**
- **Controllers**: Business logic entry points → `src/controllers/`
- **Services**: Core business logic → `src/services/`
- **Repositories**: Data access → `src/repositories/`
- **Types**: Shared TypeScript definitions → `src/types/`
- **Utils**: Helper functions → `src/utils/`

### 🔧 **Configuration Files**
- Keep configuration files at the appropriate level (backend/frontend)
- Environment files (`.env`) must never be committed
- All scripts must be executable and placed in `/scripts/`

## 📋 Compliance Checklist

Before creating any new file or directory, verify:

- [ ] Does it follow the defined folder structure?
- [ ] Is it in the correct directory for its purpose?
- [ ] Does the naming convention match the rules?
- [ ] Are test files in the proper test directories?
- [ ] Are mocks in the appropriate `__mocks__/` subdirectory?

## 🎯 Benefits of This Structure

1. **Consistency**: Everyone knows where to find and place files
2. **Scalability**: Clear separation of concerns supports growth
3. **Testing**: Organized test structure ensures comprehensive coverage
4. **DDD Compliance**: Backend follows Domain-Driven Design principles
5. **Tool Integration**: Proper structure supports IDE and tool features
6. **Onboarding**: New developers can quickly understand the codebase

---

**⚠️ IMPORTANT**: This structure is **mandatory** and must be followed by all team members and AI assistants. Any deviation requires explicit approval and documentation update. 