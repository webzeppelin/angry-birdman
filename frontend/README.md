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
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable React components
│   ├── pages/       # Page components for routes
│   ├── hooks/       # Custom React hooks
│   ├── contexts/    # React context providers
│   ├── utils/       # Utility functions
│   ├── styles/      # Global styles
│   ├── App.tsx      # Root application component
│   └── main.tsx     # Application entry point
├── tests/           # Test files
└── index.html       # HTML entry point
```

## Development Guidelines

- Follow the component structure in the user-experience-specs.md
- Use TypeScript for all new files
- Write tests for components using React Testing Library
- Use Tailwind CSS for styling
- Import shared types and utilities from @angrybirdman/common
