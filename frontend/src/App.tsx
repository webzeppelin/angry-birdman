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
  ClanPage,
  ClanProfilePage,
  EditClanProfilePage,
  ClanAdminsPage,
  ClanSettingsPage,
  AdminRequestsPage,
  DashboardPage,
  LoginPage,
  CallbackPage,
  SilentCallbackPage,
  RegisterPage,
  PostRegistrationTriagePage,
  ClanRegistrationPage,
  ProfilePage,
  PasswordChangePage,
  ForgotPasswordPage,
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
              path="/clans/:clanId"
              element={
                <Layout>
                  <ClanPage />
                </Layout>
              }
            />
            <Route
              path="/clans/:clanId/profile"
              element={
                <Layout>
                  <ClanProfilePage />
                </Layout>
              }
            />
            <Route
              path="/clans/:clanId/profile/edit"
              element={
                <Layout>
                  <ProtectedRoute>
                    <EditClanProfilePage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/clans/:clanId/admins"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ClanAdminsPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/clans/:clanId/settings"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ClanSettingsPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/admin-requests"
              element={
                <Layout>
                  <ProtectedRoute>
                    <AdminRequestsPage />
                  </ProtectedRoute>
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
            <Route
              path="/forgot-password"
              element={
                <Layout>
                  <ForgotPasswordPage />
                </Layout>
              }
            />
            <Route
              path="/register"
              element={
                <Layout>
                  <RegisterPage />
                </Layout>
              }
            />
            <Route
              path="/register/triage"
              element={
                <Layout>
                  <PostRegistrationTriagePage />
                </Layout>
              }
            />
            <Route
              path="/register/clan"
              element={
                <Layout>
                  <ClanRegistrationPage />
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
            <Route
              path="/profile"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/profile/change-password"
              element={
                <Layout>
                  <ProtectedRoute>
                    <PasswordChangePage />
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
