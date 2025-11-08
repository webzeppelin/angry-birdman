# API - Angry Birdman

Fastify-based REST API backend for the Angry Birdman clan management system.

## Technology Stack

- **Node.js 20 LTS+** - Runtime
- **Fastify 4+** - Web framework
- **TypeScript 5+** - Type safety
- **Prisma Client** - Database ORM
- **JWT** - Authentication
- **Zod** - Request validation

## Getting Started

### Install Dependencies

From the project root:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev --workspace=api
# or from this directory
npm run dev
```

The API will be available at http://localhost:3001

### Build

Build for production:

```bash
npm run build --workspace=api
# or from this directory
npm run build
```

### Test

Run tests:

```bash
npm run test --workspace=api
# or from this directory
npm test
```

## Project Structure

```
api/
├── src/
│   ├── routes/      # API route handlers
│   ├── plugins/     # Fastify plugins
│   ├── middleware/  # Authentication, logging, etc.
│   ├── schemas/     # Request/response schemas
│   ├── services/    # Business logic
│   └── index.ts     # Application entry point
└── tests/           # Test files
```

## API Documentation

Once running, OpenAPI documentation is available at:

- Swagger UI: http://localhost:3001/docs
- OpenAPI JSON: http://localhost:3001/docs/json

## Development Guidelines

- Follow RESTful API conventions
- Use TypeScript for all new files
- Validate requests with Zod schemas
- Write integration tests for all endpoints
- Use Prisma Client for database operations
- Import shared types and utilities from @angrybirdman/common
