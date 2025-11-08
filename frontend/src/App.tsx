/**
 * Main Application Component
 *
 * Sets up routing, authentication, and React Query for the entire application.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth';
import { Layout } from '@/components/layout';
import { AuthProvider } from '@/contexts/AuthContext';
import {
  HomePage,
  AboutPage,
  ClansPage,
  DashboardPage,
  LoginPage,
  CallbackPage,
  SilentCallbackPage,
  NotFoundPage,
} from '@/pages';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes with layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <AboutPage />
                </Layout>
              }
            />
            <Route
              path="/clans"
              element={
                <Layout>
                  <ClansPage />
                </Layout>
              }
            />
            <Route
              path="/login"
              element={
                <Layout>
                  <LoginPage />
                </Layout>
              }
            />

            {/* Protected routes with layout */}
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* OAuth callback routes (no layout) */}
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/silent-callback" element={<SilentCallbackPage />} />

            {/* 404 with layout */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFoundPage />
                </Layout>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
