# Angry Birdman - Technology Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Frontend Stack](#2-frontend-stack)
3. [API/Backend Stack](#3-apibackend-stack)
4. [Common Library](#4-common-library)
5. [Database & Data Layer](#5-database--data-layer)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Infrastructure & DevOps](#7-infrastructure--devops)
8. [Development Tools](#8-development-tools)
9. [Observability & Monitoring](#9-observability--monitoring)
10. [Architecture Patterns](#10-architecture-patterns)
11. [Security Stack](#11-security-stack)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. Overview

### Technology Philosophy

Angry Birdman is built using popular, well-supported open-source technologies to facilitate community collaboration and long-term maintainability. The stack prioritizes:

- **Developer Experience**: Modern tooling with excellent TypeScript support
- **Performance**: Fast build times, efficient runtime, optimized user experience
- **Scalability**: Container-based deployment with optional orchestration
- **Maintainability**: Clear architecture, consistent patterns, comprehensive testing
- **Community**: Popular frameworks with large communities and extensive documentation

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Tier 1)                   │
│                   React + Vite + TypeScript                  │
│                  (Client-side web application)               │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   API/Backend Layer (Tier 2)                 │
│                  Node.js + Fastify + TypeScript              │
│                     (RESTful API server)                     │
└─────────────────────────────────────────────────────────────┘
                              ↕ SQL/ORM
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Tier 3)                   │
│                    PostgreSQL + Prisma ORM                   │
│                    (Persistent data storage)                 │
└─────────────────────────────────────────────────────────────┘

                    Supporting Infrastructure:
    ┌─────────────┐  ┌──────────┐  ┌────────────────────┐
    │  Keycloak   │  │  Valkey  │  │  Docker + Docker   │
    │   (IdP)     │  │ (Cache)  │  │     Compose        │
    └─────────────┘  └──────────┘  └────────────────────┘
```

### TypeScript-First Approach

TypeScript is the primary development language across all layers:
- **Frontend**: Full type safety in React components and business logic
- **Backend**: Type-safe API routes, middleware, and business logic
- **Common**: Shared types, validation schemas, and utility functions
- **Database**: Type-safe database queries through Prisma

This unified language approach enables code sharing, consistent patterns, and reduced context switching for developers.

---

## 2. Frontend Stack

### Core Framework: React 18+

**Purpose**: User interface framework for building component-based web applications

**Why React**:
- Industry-standard with massive community and ecosystem
- Component-based architecture aligns with design system approach
- Excellent performance with virtual DOM and concurrent features
- Strong TypeScript support and extensive type definitions
- Hooks API enables clean, functional component patterns

**Key Features Used**:
- Functional components with Hooks (useState, useEffect, useCallback, useMemo)
- Context API for global UI state (theme, authentication status)
- Suspense for code splitting and lazy loading
- Error boundaries for graceful error handling

### Build Tool: Vite 5+

**Purpose**: Fast development server and optimized production bundler

**Why Vite**:
- Lightning-fast hot module replacement (HMR) during development
- Native ES modules in development for instant server start
- Optimized production builds using Rollup
- First-class TypeScript support without configuration
- Plugin ecosystem for extending functionality

**Configuration Highlights**:
- Code splitting by route for optimal loading
- Tree shaking for minimal bundle sizes
- Asset optimization (images, fonts, icons)
- Environment variable management
- Proxy configuration for local API development

### Language: TypeScript 5+

**Purpose**: Type-safe JavaScript with enhanced developer experience

**Why TypeScript**:
- Catch errors at compile-time rather than runtime
- Superior IDE support with autocomplete and refactoring
- Self-documenting code through type annotations
- Easier refactoring and maintenance
- Required for Prisma type generation

**Configuration**:
- Strict mode enabled for maximum type safety
- Path aliases for clean imports (@/components, @/utils, etc.)
- Shared types from common library
- React-specific type definitions

### State Management: React Query (TanStack Query) 5+

**Purpose**: Server state synchronization and caching

**Why React Query**:
- Eliminates boilerplate for fetching, caching, and updating data
- Automatic background refetching and cache invalidation
- Optimistic updates for immediate user feedback
- Built-in loading and error states
- Request deduplication and retry logic

**Usage Patterns**:
- `useQuery` for fetching clan and battle data
- `useMutation` for creating/updating battles and roster
- Query invalidation after mutations for data consistency
- Prefetching for anticipated navigation

### Routing: React Router 6+

**Purpose**: Client-side routing and navigation

**Why React Router**:
- Industry standard for React applications
- Declarative routing configuration
- Nested routes for complex layouts
- Data loading integration with React Query
- Search parameter and navigation state management

**Route Structure**:
```
/                           → Landing page
/clans                      → Clan directory
/clans/:clanId              → Clan overview
/clans/:clanId/battles      → Battle list
/clans/:clanId/battles/:id  → Battle detail
/clans/:clanId/roster       → Roster management
/clans/:clanId/analytics    → Analytics dashboard
/admin                      → Admin area (authenticated)
/admin/battle/new           → Battle entry form
/admin/roster               → Roster management
/signin                     → Authentication
/register                   → Registration
```

### Styling: Tailwind CSS 3+

**Purpose**: Utility-first CSS framework for rapid UI development

**Why Tailwind CSS**:
- Utility classes enable fast, consistent styling
- Design system tokens (colors, spacing, typography) defined in configuration
- Responsive design with mobile-first breakpoints
- PurgeCSS integration removes unused styles
- No CSS naming conflicts or specificity issues

**Configuration**:
- Custom color palette matching brand identity
- Typography scale defined in design system
- Spacing system based on 8px grid
- Custom component classes for common patterns
- Dark mode support (future enhancement)

**Plugin Ecosystem**:
- `@tailwindcss/forms` for consistent form styling
- `@tailwindcss/typography` for content-rich pages
- Custom plugins for project-specific utilities

### UI Components: Headless UI + Radix UI

**Purpose**: Accessible, unstyled component primitives

**Why Headless/Radix UI**:
- Accessible by default (WCAG 2.1 AA compliance)
- Unstyled components work perfectly with Tailwind
- Keyboard navigation and focus management built-in
- Comprehensive component library (dialogs, dropdowns, tabs, etc.)

**Components Used**:
- Dialog/Modal for confirmations and forms
- Dropdown Menu for actions and navigation
- Select for form inputs
- Tabs for battle detail views
- Toast notifications for feedback

### Data Visualization: Recharts / Chart.js

**Purpose**: Interactive charts and data visualizations

**Why Recharts**:
- React-first charting library with composable API
- Responsive charts that work across devices
- Customizable styling to match design system
- Touch-friendly interactions for mobile

**Chart Types**:
- Line charts for trend analysis (ratio over time)
- Bar charts for comparative analysis (win/loss records)
- Pie/donut charts for composition (participation rates)
- Area charts for cumulative metrics

### Form Management: React Hook Form 7+

**Purpose**: Performant, flexible form validation and management

**Why React Hook Form**:
- Minimal re-renders for better performance
- Simple API for complex forms
- Integration with validation libraries (Zod)
- Built-in error handling and validation
- Excellent TypeScript support

**Usage in Battle Entry**:
- Multi-step form with state preservation
- Field-level validation with immediate feedback
- Dynamic field arrays for player entries
- Integration with auto-save functionality

### Validation: Zod 3+

**Purpose**: TypeScript-first schema validation

**Why Zod**:
- Shared validation schemas between frontend and backend
- Excellent TypeScript inference
- Composable schemas for complex validation
- Runtime type checking
- Clear, customizable error messages

**Shared Schemas**:
- Battle data validation
- Roster member validation
- User registration validation
- API request/response validation

### HTTP Client: Fetch API + React Query

**Purpose**: HTTP requests to backend API

**Why Fetch API**:
- Native browser API, no additional dependencies
- Modern, promise-based interface
- Sufficient for REST API communication
- Works seamlessly with React Query

**Request Configuration**:
- Base URL configuration per environment
- JWT token injection for authenticated requests
- Request/response interceptors for error handling
- Content-Type and Accept headers

---

## 3. API/Backend Stack

### Runtime: Node.js 20 LTS+

**Purpose**: JavaScript runtime for server-side execution

**Why Node.js**:
- Same language (TypeScript) as frontend
- Excellent performance for I/O-bound applications
- Massive ecosystem of packages (npm)
- Long-term support (LTS) for stability
- Cross-platform (Windows, Linux, macOS)

**Runtime Features**:
- ES Modules for modern import/export syntax
- Built-in test runner (supplemented with Vitest)
- Performance hooks for monitoring
- Cluster mode for multi-core scaling

### Web Framework: Fastify 4+

**Purpose**: Fast, low-overhead web framework for building REST APIs

**Why Fastify**:
- Excellent performance (faster than Express)
- Schema-based validation with JSON Schema
- First-class TypeScript support
- Built-in logging with Pino
- Plugin architecture for modularity
- OpenAPI/Swagger documentation generation

**Key Features**:
- Request/response validation against schemas
- Automatic serialization for performance
- Lifecycle hooks for custom logic
- Decorator pattern for route organization
- Built-in testing utilities

**Plugin Ecosystem**:
- `@fastify/cors` for cross-origin resource sharing
- `@fastify/helmet` for security headers
- `@fastify/rate-limit` for API rate limiting
- `@fastify/jwt` for JWT authentication
- `@fastify/swagger` for OpenAPI documentation

### API Design: RESTful with OpenAPI 3.1

**Purpose**: Standard, documented HTTP API

**REST Principles**:
- Resource-based URLs (`/clans/:clanId/battles`)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response bodies
- HTTP status codes for result indication
- Stateless requests (state in JWT tokens)

**OpenAPI Documentation**:
- Auto-generated from Fastify schemas
- Interactive API explorer (Swagger UI)
- Request/response examples
- Authentication requirements documented
- Client SDK generation potential

### Authentication: JWT (JSON Web Tokens)

**Purpose**: Stateless authentication for API requests

**Why JWT**:
- Stateless, scalable authentication
- Standard format (RFC 7519)
- Contains user identity and claims
- Can be validated without database lookup
- Works across distributed systems

**Token Structure**:
- **Header**: Algorithm and token type
- **Payload**: User ID, clan ID, role, expiration
- **Signature**: Verifies token integrity

**Token Lifecycle**:
- Issued by Keycloak after successful authentication
- Included in Authorization header (`Bearer <token>`)
- Validated on each API request
- Short expiration (15-30 minutes)
- Refresh tokens for renewal

### Session State: Valkey (Redis fork)

**Purpose**: Fast in-memory data store for session management

**Why Valkey**:
- Redis-compatible, open-source fork
- Sub-millisecond latency for session lookups
- Automatic expiration for session cleanup
- Pub/sub for real-time features (future)
- Persistent storage options for durability

**Usage**:
- Session data storage (user preferences, draft battles)
- Rate limiting counters
- Cache for frequently accessed data
- Distributed locking for concurrent operations

### Language: TypeScript 5+

**Purpose**: Type-safe JavaScript with enhanced developer experience

**Backend-Specific Configuration**:
- Node.js target for compatibility
- CommonJS/ES Module interoperability
- Strict mode for maximum safety
- Decorators for Fastify plugins
- Path aliases for clean imports

---

## 4. Common Library

### Purpose: Shared Code Between Frontend and Backend

**Why Common Library**:
- Eliminates code duplication
- Ensures consistency in business logic
- Shared validation schemas (Zod)
- Type definitions used across tiers
- Utility functions (calculations, formatting)

### Library Contents

**Type Definitions**:
- Data entity interfaces (Clan, Battle, Player, etc.)
- API request/response types
- Enum definitions (ActionCode, BattleResult)
- Utility types for TypeScript magic

**Validation Schemas** (Zod):
- Battle data validation (matches Prisma schema)
- Roster member validation
- User registration validation
- Query parameter validation

**Business Logic**:
- Ratio score calculations
- Projected score calculations
- Margin calculations
- Monthly/yearly aggregation formulas

**Utility Functions**:
- Date formatting and manipulation
- Number formatting (FP, scores, ratios)
- Battle ID generation (YYYYMMDD format)
- Month/Year ID generation

**Constants**:
- Action code definitions
- Validation constraints (max FP, max players, etc.)
- Default values
- Error messages

### Distribution

**Build Output**:
- Compiled to JavaScript with TypeScript definitions
- Separate builds for ES Modules and CommonJS
- Tree-shakeable exports

**Usage**:
- Frontend imports: `import { calculateRatio } from '@angrybirdman/common'`
- Backend imports: `import { validateBattle } from '@angrybirdman/common'`
- Version synchronized across projects

---

## 5. Database & Data Layer

### Database: PostgreSQL 15+

**Purpose**: Reliable, ACID-compliant relational database

**Why PostgreSQL**:
- Industry-leading open-source RDBMS
- ACID compliance for data integrity
- Rich data types (JSON, arrays, custom types)
- Excellent performance for complex queries
- Mature replication and backup solutions
- Strong community and tooling

**Key Features**:
- Transactions for data consistency
- Foreign keys for referential integrity
- Indexes for query performance
- JSON support for flexible data
- Full-text search capabilities
- Row-level security (optional enhancement)

**Database Design**:
- Normalized schema following data specifications
- Composite primary keys where appropriate
- Foreign key constraints for relationships
- Check constraints for data validation
- Indexes on frequently queried columns
- Calculated fields handled in application layer

### ORM: Prisma 5+

**Purpose**: Type-safe database access layer

**Why Prisma**:
- Type-safe database queries (compile-time errors)
- Excellent TypeScript integration
- Declarative schema definition
- Automatic migration generation
- Query builder with IntelliSense
- Connection pooling built-in

**Prisma Schema**:
- Single source of truth for data model
- Maps to PostgreSQL tables
- Defines relationships between entities
- Generates TypeScript types automatically
- Version controlled with migrations

**Prisma Client**:
- Auto-generated based on schema
- Type-safe CRUD operations
- Relation queries with eager/lazy loading
- Transaction support
- Raw SQL escape hatch when needed

**Migrations**:
- Version-controlled schema changes
- Automatic migration generation from schema changes
- Rollback capability for safe deployments
- Seed scripts for development data

### Data Access Patterns

**Repository Pattern**:
- Abstraction layer over Prisma Client
- Business logic separated from data access
- Reusable query functions
- Easier testing with mocks

**Query Optimization**:
- Select only needed fields
- Batch queries to reduce round-trips
- Eager loading for related data
- Pagination for large result sets
- Database indexes on common queries

---

## 6. Authentication & Authorization

### Identity Provider: Keycloak 23+

**Purpose**: Enterprise-grade identity and access management

**Why Keycloak**:
- Open-source, mature IAM solution
- OAuth 2.0 and OpenID Connect support
- Built-in user management UI
- Customizable login flows
- Social login integration (future)
- Multi-factor authentication (future)

**Keycloak Features**:
- User registration and management
- Password policies and validation
- Email verification
- Password reset flows
- Session management
- Role-based access control

**Integration with Angry Birdman**:
- Backend validates JWT tokens from Keycloak
- User roles stored in token claims
- Frontend redirects to Keycloak for authentication
- API secured with JWT validation middleware

### Authentication Flow

**Login Process**:
1. User clicks "Sign In" on frontend
2. Frontend redirects to Keycloak login page
3. User enters credentials
4. Keycloak validates credentials
5. Keycloak redirects back with authorization code
6. Frontend exchanges code for JWT access token
7. Frontend stores token and includes in API requests

**Token Validation**:
1. API receives request with JWT in Authorization header
2. API validates token signature against Keycloak public key
3. API checks token expiration
4. API extracts user ID, clan ID, role from token
5. API authorizes request based on user role and clan ID

### Authorization Model

**Roles**:
- **Anonymous**: Read-only access to all clan data
- **Clan Admin**: Full access to their clan's data
- **Clan Owner**: Admin access + ownership management
- **Superadmin**: Full access to all clans and system settings

**Permission Checks**:
- Route-level authorization (e.g., `/admin/*` requires authentication)
- Resource-level authorization (e.g., can only edit own clan)
- Action-level authorization (e.g., only owners can transfer ownership)

---

## 7. Infrastructure & DevOps

### Containerization: Docker 24+

**Purpose**: Consistent, portable application packaging

**Why Docker**:
- Consistent environment across development, staging, production
- Isolated dependencies per service
- Easy local development setup
- Industry-standard container format
- Extensive image registry (Docker Hub)

**Dockerfiles**:
- **Frontend**: Multi-stage build (build → serve with nginx)
- **API**: Node.js with production dependencies only
- **Database**: Official PostgreSQL image
- **Keycloak**: Official Keycloak image with custom configuration
- **Valkey**: Official Redis/Valkey image

**Image Optimization**:
- Alpine Linux base images for smaller sizes
- Multi-stage builds to exclude build tools
- Layer caching for faster rebuilds
- `.dockerignore` to exclude unnecessary files

### Orchestration: Docker Compose (Local), Kubernetes (Production)

**Docker Compose for Development**:
- Single command to start entire stack (`docker-compose up`)
- Service networking configured automatically
- Volume mounts for hot-reloading
- Environment variable management
- Easy scaling of services

**Docker Compose Services**:
- `frontend`: React application (port 3000)
- `api`: Fastify backend (port 3001)
- `database`: PostgreSQL (port 5432)
- `keycloak`: Identity provider (port 8080)
- `valkey`: Session store (port 6379)

**Kubernetes for Production** (Optional):
- Horizontal pod autoscaling for load
- Rolling deployments with zero downtime
- Health checks and automatic restarts
- Secrets management
- Ingress for HTTPS and routing

### CI/CD: GitHub Actions

**Purpose**: Automated testing, building, and deployment

**Why GitHub Actions**:
- Integrated with GitHub (where code is hosted)
- Free for public repositories
- Extensive marketplace of actions
- Flexible workflow configuration
- Matrix builds for multiple environments

**Continuous Integration Workflow**:
1. Trigger on push/pull request
2. Install dependencies
3. Run linters (ESLint, Prettier)
4. Run type checking (TypeScript)
5. Run tests (Vitest)
6. Build application
7. Report status to GitHub

**Continuous Deployment Workflow**:
1. Trigger on push to main branch (or tag)
2. Build Docker images
3. Push images to registry
4. Deploy to staging environment
5. Run smoke tests
6. Deploy to production (manual approval)

### Version Control: Git + GitHub

**Purpose**: Source code management and collaboration

**Branching Strategy**:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `hotfix/*`: Urgent production fixes

**Commit Conventions**:
- Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
- Small, focused commits
- Descriptive commit messages
- Reference issues/stories in commits

### Environment Management

**Environment Variables**:
- `.env.local`: Local development overrides (not committed)
- `.env.development`: Development defaults (committed)
- `.env.production`: Production configuration (not committed, managed via CI/CD)

**Configuration Per Environment**:
- API URLs (localhost vs production)
- Database connection strings
- Keycloak configuration
- Valkey connection
- Feature flags

---

## 8. Development Tools

### Code Editor: VS Code (Recommended)

**Why VS Code**:
- Excellent TypeScript support
- Extensions for all stack technologies
- Integrated terminal and debugging
- Git integration
- Free and open-source

**Recommended Extensions**:
- ESLint for code linting
- Prettier for code formatting
- Prisma for schema editing
- Tailwind CSS IntelliSense
- GitLens for Git visualization

### Linting: ESLint 8+

**Purpose**: Enforce code quality and consistency

**Configuration**:
- TypeScript-aware rules
- React-specific rules
- Accessibility rules (eslint-plugin-jsx-a11y)
- Import order rules
- Tailwind CSS class order rules

### Formatting: Prettier 3+

**Purpose**: Consistent code formatting

**Configuration**:
- Single quotes for strings
- 2-space indentation
- Semicolons required
- Trailing commas in multi-line
- Integration with Tailwind (prettier-plugin-tailwindcss)

### Package Management: npm 10+

**Purpose**: Dependency management and script running

**Why npm**:
- Default package manager for Node.js
- Workspaces support for monorepo
- Lock file for reproducible builds
- Scripts for common tasks

**Workspace Structure**:
```
angrybirdman/
├── package.json              (root workspace)
├── frontend/
│   ├── package.json
│   └── ...
├── api/
│   ├── package.json
│   └── ...
├── common/
│   ├── package.json
│   └── ...
└── database/
    ├── package.json
    └── ...
```

### API Documentation: Swagger UI / Scalar

**Purpose**: Interactive API documentation

**Features**:
- Auto-generated from OpenAPI schema
- Try-it-out functionality
- Request/response examples
- Authentication integration
- Shareable documentation URL

---

## 9. Observability & Monitoring

### Logging: Pino (Backend) + Console (Frontend)

**Purpose**: Application logging for debugging and monitoring

**Pino Features**:
- Extremely fast JSON logging
- Structured log format
- Log levels (trace, debug, info, warn, error, fatal)
- Child loggers for context
- Pretty printing for development

**Log Structure**:
```json
{
  "level": "info",
  "time": 1699000000000,
  "pid": 12345,
  "hostname": "api-server",
  "reqId": "abc-123",
  "msg": "Battle created",
  "clanId": 1,
  "battleId": "20251101"
}
```

### Error Tracking: Sentry (Optional)

**Purpose**: Real-time error monitoring and alerting

**Why Sentry**:
- Automatic error capture
- Source map support for readable stack traces
- User context for debugging
- Performance monitoring
- Release tracking

**Integration**:
- Frontend: React error boundary integration
- Backend: Fastify plugin for error capture

### Metrics: Prometheus + Grafana (Optional)

**Purpose**: Application and infrastructure metrics

**Prometheus**:
- Time-series metric storage
- PromQL query language
- Alerting based on metrics
- Service discovery

**Grafana**:
- Metric visualization dashboards
- Custom queries and graphs
- Alert management UI
- Dashboard sharing

**Key Metrics**:
- Request rate, duration, error rate
- Database query performance
- Memory and CPU usage
- User activity metrics

---

## 10. Architecture Patterns

### API Architecture Patterns

**Layered Architecture**:
```
Routes (HTTP) → Controllers → Services → Repositories → Database
```

- **Routes**: HTTP endpoint definitions, request validation
- **Controllers**: Request/response handling, minimal logic
- **Services**: Business logic, orchestration
- **Repositories**: Data access abstraction
- **Database**: Prisma + PostgreSQL

**Dependency Injection**:
- Services injected into controllers
- Repositories injected into services
- Easy testing with mocks

**Error Handling**:
- Custom error classes (NotFoundError, ValidationError, etc.)
- Global error handler middleware
- Consistent error response format
- Logging of errors

### Frontend Architecture Patterns

**Component Organization**:
```
components/
├── common/        (Shared, reusable components)
├── features/      (Feature-specific components)
├── layouts/       (Page layouts)
└── pages/         (Top-level route components)
```

**State Management Strategy**:
- Server state: React Query (battles, roster, analytics)
- UI state: React Context + hooks (theme, modals, navigation)
- Form state: React Hook Form (battle entry, roster management)
- URL state: React Router (selected clan, filters, pagination)

**Custom Hooks**:
- `useAuth()`: Authentication state and actions
- `useClan()`: Current clan context
- `useBattles()`: Battle data fetching
- `useRoster()`: Roster data and mutations

### Design Patterns

**Repository Pattern**: Abstraction over data access
**Factory Pattern**: Creating complex objects (battle summary)
**Strategy Pattern**: Different calculation strategies
**Observer Pattern**: Event-driven updates (React Query invalidation)
**Singleton Pattern**: Database connection, logger instances

---

## 11. Security Stack

### HTTPS/TLS

**Purpose**: Encrypted communication between client and server

**Implementation**:
- Let's Encrypt certificates for production
- Self-signed certificates for development
- Automatic certificate renewal
- HTTP to HTTPS redirect

### Security Headers: Helmet.js

**Purpose**: Set security-related HTTP headers

**Headers Set**:
- Content Security Policy (CSP)
- X-Frame-Options (prevent clickjacking)
- X-Content-Type-Options (prevent MIME sniffing)
- Strict-Transport-Security (HSTS)
- X-XSS-Protection (legacy XSS protection)

### CORS Configuration

**Purpose**: Control cross-origin resource sharing

**Configuration**:
- Allow specific origins (frontend URLs)
- Allow credentials (cookies, auth headers)
- Allowed methods (GET, POST, PUT, DELETE)
- Allowed headers (Content-Type, Authorization)

### Rate Limiting

**Purpose**: Prevent abuse and DDoS attacks

**Configuration**:
- Global rate limit (e.g., 100 requests per minute)
- Stricter limits for authentication endpoints
- Per-IP address tracking
- Temporary ban for repeated violations

### Input Validation & Sanitization

**Purpose**: Prevent injection attacks and invalid data

**Implementation**:
- Schema validation with Zod (frontend and backend)
- Parameterized queries via Prisma (SQL injection prevention)
- HTML sanitization for user-generated content
- File upload validation (future)

### Password Security

**Purpose**: Protect user credentials

**Implementation** (via Keycloak):
- Bcrypt hashing with salt
- Minimum password strength requirements
- Password history to prevent reuse
- Account lockout after failed attempts
- Password reset with email verification

---

## 12. Testing Strategy

### Frontend Testing

**Unit Testing: Vitest + React Testing Library**

**Purpose**: Test individual components and functions

**What to Test**:
- Component rendering and behavior
- User interactions (clicks, form input)
- Utility functions and calculations
- Custom hooks

**Testing Approach**:
- Render components with React Testing Library
- Query elements by accessible role/text
- Simulate user events (click, type, submit)
- Assert expected behavior and output

**Example Test**:
```typescript
test('calculates ratio score correctly', () => {
  const ratio = calculateRatio(1000, 100);
  expect(ratio).toBe(100.0);
});
```

**Integration Testing**:
- Test component interactions
- Test routing and navigation
- Test React Query integration
- Mock API responses with MSW (Mock Service Worker)

### Backend Testing

**Unit Testing: Vitest**

**Purpose**: Test services, repositories, and utilities

**What to Test**:
- Service business logic
- Data transformation functions
- Calculation functions
- Error handling

**Integration Testing**:
- Test API routes end-to-end
- Test database operations with test database
- Test authentication middleware
- Test error handling middleware

**Testing Utilities**:
- Fastify inject for HTTP testing (no server needed)
- Prisma test database with migrations
- Factory functions for test data

**Example Test**:
```typescript
test('POST /clans/:clanId/battles creates battle', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/clans/1/battles',
    headers: { authorization: `Bearer ${token}` },
    payload: battleData
  });
  expect(response.statusCode).toBe(201);
  expect(response.json()).toMatchObject({ battleId: '20251101' });
});
```

### E2E Testing: Playwright (Optional)

**Purpose**: Test complete user flows across frontend and backend

**What to Test**:
- Authentication flow
- Battle entry workflow
- Roster management workflow
- Data viewing and navigation

**Testing Approach**:
- Real browser automation (Chromium, Firefox, WebKit)
- Visual regression testing
- Accessibility testing
- Mobile device emulation

### Test Coverage Goals

**Coverage Targets**:
- Overall: 80%+ coverage
- Critical paths (battle entry, calculations): 95%+
- Services and repositories: 90%+
- UI components: 70%+ (focus on behavior, not markup)

**Continuous Integration**:
- Run tests on every commit
- Block merges if tests fail
- Report coverage in pull requests
- Track coverage trends over time

---

## Technology Versions & Compatibility

### Version Requirements

| Technology | Minimum Version | Recommended Version |
|:-----------|:---------------:|:-------------------:|
| Node.js | 20.0.0 | 20.x LTS (latest) |
| TypeScript | 5.0.0 | 5.3+ |
| React | 18.0.0 | 18.2+ |
| Vite | 5.0.0 | 5.0+ |
| Fastify | 4.0.0 | 4.24+ |
| Prisma | 5.0.0 | 5.6+ |
| PostgreSQL | 15.0 | 15.5+ or 16.x |
| Keycloak | 23.0.0 | 23.0+ |
| Docker | 24.0.0 | 24.0+ |
| Valkey | 7.2.0 | 7.2+ (Redis 7.2+ compatible) |

### Browser Support

**Target Browsers**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Android 10+

**Progressive Enhancement**:
- Core functionality works in all modern browsers
- Enhanced features for browsers with latest APIs
- Graceful degradation for older browsers

### Operating System Compatibility

**Development**:
- **Windows**: 10/11 with WSL2 recommended for Docker
- **macOS**: 12 (Monterey) or later
- **Linux**: Ubuntu 22.04+, Debian 11+, Fedora 37+, or compatible

**Production**:
- Linux-based containers (Alpine, Ubuntu)
- Kubernetes on any cloud provider
- Docker Swarm as alternative

---

## Deployment Considerations

### Environment Requirements

**Development**:
- 8GB RAM minimum, 16GB recommended
- Multi-core CPU for fast builds
- SSD storage for Node.js dependencies
- Docker Desktop or Docker Engine

**Production** (estimated for small-medium clans):
- Frontend: Static files on CDN/nginx (minimal resources)
- API: 2 CPU cores, 4GB RAM per instance
- Database: 2 CPU cores, 8GB RAM, SSD storage
- Keycloak: 1 CPU core, 2GB RAM
- Valkey: 1 CPU core, 1GB RAM

### Scalability Strategy

**Horizontal Scaling**:
- Multiple API instances behind load balancer
- Stateless API design enables easy scaling
- Session state in Valkey (shared across instances)
- Database connection pooling

**Vertical Scaling**:
- Database can scale to larger instances
- Caching reduces database load
- Read replicas for analytics queries (future)

**Performance Optimization**:
- Frontend: CDN for static assets, code splitting, lazy loading
- API: Response caching, query optimization, connection pooling
- Database: Indexes, query optimization, partitioning (if needed)

---

## Future Technology Considerations

### Potential Enhancements

**Real-time Features** (WebSockets):
- Live battle updates during entry
- Real-time notifications
- Collaborative features
- Technology: Socket.IO or native WebSockets

**Mobile Applications** (React Native):
- Native iOS and Android apps
- Shared React components with web
- Optimized mobile data entry
- Push notifications

**Advanced Analytics** (Machine Learning):
- Predictive analytics for clan performance
- Player performance trends and predictions
- Matchup difficulty prediction
- Technology: Python + scikit-learn or TensorFlow

**Social Features**:
- User profiles and achievements
- Clan-to-clan messaging
- Leaderboards and competitions
- Social media integration

### Technology Migration Paths

**If needs change**, the architecture supports:
- GraphQL API (in addition to or instead of REST)
- Alternative frontend frameworks (Vue, Svelte) - API unchanged
- Microservices architecture - split API into smaller services
- Serverless deployment - AWS Lambda, Google Cloud Functions

---

## Conclusion

This technology stack provides a modern, scalable, and maintainable foundation for Angry Birdman. The choices prioritize:

- **Developer experience** with TypeScript throughout
- **Performance** with Vite, Fastify, and Valkey
- **Scalability** with containerization and stateless design
- **Security** with Keycloak, JWT, and security best practices
- **Maintainability** with testing, linting, and documentation
- **Community** with popular, well-supported technologies

The stack is proven in production environments, has excellent documentation and community support, and provides clear paths for future enhancements and scaling.
