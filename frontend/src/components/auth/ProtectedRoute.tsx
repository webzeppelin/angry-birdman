/**
 * Protected Route Component
 *
 * Wraps routes that require authentication and/or specific roles.
 * Redirects to login if not authenticated or shows error if lacking permissions.
 */

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

import type React from 'react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * ProtectedRoute Component
 *
 * @param children - The component to render if authorized
 * @param requiredRoles - Optional array of roles required to access this route
 */
export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-primary mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="shadow-card max-w-md rounded-lg bg-white p-8 text-center">
            <div className="mb-4 text-6xl">🚫</div>
            <h1 className="mb-2 text-2xl font-bold text-neutral-800">Access Denied</h1>
            <p className="mb-4 text-neutral-600">
              You don&apos;t have permission to access this page.
            </p>
            <p className="mb-6 text-sm text-neutral-500">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Required role: {requiredRoles.join(' or ')}
              <br />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */}
              Your roles: {(user?.profile as any)?.realm_access?.roles?.join(', ') || 'none'}
            </p>
            <a
              href="/"
              className="bg-primary hover:bg-primary-600 inline-block rounded px-6 py-2 text-white"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
