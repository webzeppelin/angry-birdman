# Frontend - Angry Birdman

React-based frontend application for the Angry Birdman clan management system.

## Technology Stack

- **React 18+** - UI library
- **Vite 5+** - Build tool and dev server
- **TypeScript 5+** - Type safety
- **Tailwind CSS 3+** - Utility-first styling
- **React Query** - Server state management
- **React Router** - Client-side routing

## Getting Started

### Install Dependencies

From the project root:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev --workspace=frontend
# or from this directory
npm run dev
```

The application will be available at http://localhost:5173

### Build

Build for production:

```bash
npm run build --workspace=frontend
# or from this directory
npm run build
```

### Test

Run tests:

```bash
npm run test --workspace=frontend
# or from this directory
npm test
```

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── layout/         # Layout components (Header, Footer, Layout)
│   │   └── auth/           # Authentication components (ProtectedRoute)
│   ├── pages/              # Page components for routes
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ClansPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── CallbackPage.tsx
│   │   ├── SilentCallbackPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── contexts/           # React context providers
│   │   └── AuthContext.tsx # Authentication state and methods
│   ├── hooks/              # Custom React hooks (future)
│   ├── lib/                # Configuration and utilities
│   │   ├── api-client.ts  # Axios instance with interceptors
│   │   └── auth-config.ts # Keycloak/OIDC configuration
│   ├── types/              # TypeScript type definitions (future)
│   ├── App.tsx             # Root application component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles with Tailwind directives
├── tests/                  # Test files
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment variable template
├── index.html              # HTML entry point
├── tailwind.config.js      # Tailwind CSS configuration with design tokens
└── vite.config.ts          # Vite configuration
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Required variables:

- `VITE_API_URL` - API base URL (default: http://localhost:3001)
- `VITE_KEYCLOAK_URL` - Keycloak server URL (default: http://localhost:8080)
- `VITE_KEYCLOAK_REALM` - Keycloak realm name (default: angrybirdman)
- `VITE_KEYCLOAK_CLIENT_ID` - OAuth client ID (default: angrybirdman-frontend)
- `VITE_APP_URL` - Frontend URL for OAuth redirects (default:
  http://localhost:5173)

## Key Features Implemented

### Authentication (Step 3.4)

- OAuth2/OIDC integration with Keycloak using `oidc-client-ts`
- AuthContext provider for authentication state management
- Protected routes with role-based access control
- JWT token management with automatic renewal
- OAuth callback handling

### Routing

- React Router v6 with nested routes
- Public routes: Home, About, Clans, Login
- Protected routes: Dashboard (requires authentication)
- OAuth callback routes: /callback, /silent-callback
- 404 Not Found page

### Layout Components

- Header with responsive navigation and auth status
- Footer with links and legal information
- Layout wrapper for consistent page structure
- Mobile-responsive hamburger menu

### API Integration

- Axios client with request/response interceptors
- Automatic JWT token injection in requests
- Global error handling with 401 logout
- Type-safe API error responses

### Design System

- Tailwind CSS with custom design tokens
- Color palette from UX specs (primary, secondary, success, warning, neutral)
- Typography scale with custom fonts (Fredoka One, Inter, JetBrains Mono)
- Spacing system based on 8px grid
- Responsive breakpoints (mobile, tablet, desktop)

## Development Guidelines

- Follow the component structure in the user-experience-specs.md
- Use TypeScript for all new files
- Write tests for components using React Testing Library
- Use Tailwind CSS for styling with custom design tokens
- Import shared types and utilities from @angrybirdman/common
- Keep components focused and single-responsibility
- Use React Query for server state management
- Handle loading and error states consistently

## Next Steps

Phase 1 implementation will add:

- Clan directory page with search and filtering
- Battle entry forms
- Roster management interface
- Analytics dashboards
- User profile management
