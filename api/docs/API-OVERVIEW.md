# Angry Birdman API Documentation

## Overview

The Angry Birdman API is a RESTful service that provides comprehensive clan
management capabilities for Angry Birds 2 players. Built with Fastify and
TypeScript, it offers high performance and type-safe data operations.

## Quick Links

- [Getting Started](./GETTING-STARTED.md) - Setup and first API calls
- [Authentication Guide](./AUTHENTICATION.md) - OAuth2/JWT authentication flows
- [API Reference](./API-REFERENCE.md) - Complete endpoint documentation
- [Integration Examples](./INTEGRATION-EXAMPLES.md) - Code samples for common
  use cases
- [Error Handling](./ERROR-HANDLING.md) - Error codes and troubleshooting

## Base URL

```
Local Development: http://localhost:3001
Production: [To be configured]
```

## API Version

Current Version: **1.0.0**

The API version follows semantic versioning (SEMVER). Breaking changes will
increment the major version number.

## Core Features

### 1. Clan Management

- Create and manage clans
- Browse clan directory
- Update clan profiles
- Track clan statistics

### 2. Roster Management

- Add and remove players
- Track player status (active/inactive)
- Record join/leave/kick dates
- View player history and performance

### 3. Battle Data Entry

- Record battle results
- Track individual player performance
- Calculate performance metrics (Ratio Scores)
- Assign post-battle action codes

### 4. Statistics & Analytics

- Monthly performance summaries
- Yearly rollup statistics
- Performance trend analysis
- Comparative analytics

### 5. User Management

- User registration and authentication
- Profile management
- Admin access control
- Audit logging

## Authentication

The API uses **JWT tokens** issued by Keycloak (OpenID Connect provider). Most
endpoints require authentication, while some (viewing statistics) are publicly
accessible.

See [Authentication Guide](./AUTHENTICATION.md) for detailed information.

## Data Formats

### Date Formats

- **Battle IDs**: `YYYYMMDD` (e.g., "20231215")
- **Month IDs**: `YYYYMM` (e.g., "202312")
- **Year IDs**: `YYYY` (e.g., "2023")
- **Timestamps**: ISO 8601 format (e.g., "2023-12-15T10:30:00Z")

### Numeric Values

- **Flock Power (FP)**: Integer, range 50-4000+
- **Scores**: Integer, >= 0
- **Ratio Scores**: Decimal, calculated as `(score / fp) * 10`
- **Percentages**: Decimal, 0-100

### Response Formats

All responses are JSON. Successful responses include relevant data, while errors
follow a standard format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description"
}
```

## Rate Limiting

To ensure fair usage, the API implements rate limiting:

- **Default**: 100 requests per 15-minute window per IP address
- **Authenticated**: Higher limits may apply based on user tier
- **Header**: `X-RateLimit-Remaining` indicates remaining requests

When rate limited, you'll receive a `429 Too Many Requests` response.

## Pagination

List endpoints support pagination with query parameters:

- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 20, max: 100)

Paginated responses include:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

- `sortBy`: Field name to sort by
- `sortOrder`: `asc` or `desc`
- Additional filters vary by endpoint

Example:

```
GET /api/clans?sortBy=name&sortOrder=asc&country=Canada
```

## CORS Policy

The API implements CORS headers for browser-based clients:

- Allowed origins configured via `CORS_ORIGIN` environment variable
- Credentials (cookies) are supported
- Preflight requests are handled automatically

## Security Features

### HTTPS

Production deployments must use HTTPS for all API communication.

### HTTP Security Headers

- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security (HSTS)

### Input Validation

All request data is validated using Zod schemas before processing.

### SQL Injection Prevention

Prisma ORM provides parameterized queries to prevent SQL injection.

## Versioning Strategy

API versioning will be introduced if breaking changes are necessary:

- Version in URL path: `/api/v2/...`
- Previous versions maintained for transition period
- Deprecation notices provided in advance

## Support and Feedback

- **GitHub Issues**:
  [Report bugs or request features](https://github.com/webzeppelin/angry-birdman/issues)
- **Discussions**:
  [Ask questions and share ideas](https://github.com/webzeppelin/angry-birdman/discussions)
- **Documentation Updates**: Submit PRs to improve docs

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:3001/docs`
- **OpenAPI JSON**: `http://localhost:3001/docs/json`

The Swagger UI allows you to:

- Browse all endpoints with descriptions
- View request/response schemas
- Try out API calls directly in browser
- Generate client code for various languages

## SDK and Client Libraries

Currently, no official SDKs are provided. The OpenAPI specification can be used
to generate client libraries for various programming languages:

**Recommended Generators**:

- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)

**Supported Languages**:

- JavaScript/TypeScript
- Python
- Java
- C#
- Go
- Ruby
- PHP
- And many more...

## Change Log

See [CHANGELOG.md](../../CHANGELOG.md) for version history and breaking changes.

## Next Steps

1. [Get Started](./GETTING-STARTED.md) with your first API calls
2. Review [Authentication](./AUTHENTICATION.md) to understand security flows
3. Explore [API Reference](./API-REFERENCE.md) for complete endpoint
   documentation
4. Check out [Integration Examples](./INTEGRATION-EXAMPLES.md) for code samples
