/**
 * Login Page
 *
 * Simple page that initiates OAuth login flow.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If already authenticated, redirect to intended destination
    if (isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const from: string = location.state?.from?.pathname || '/dashboard';

      // Superadmins should go to admin dashboard by default
      if (user?.roles?.includes('superadmin') && from === '/dashboard') {
        void navigate('/admin', { replace: true });
      } else {
        void navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location, user]);

  const handleLogin = () => {
    void login().catch(console.error);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-12">
      <div className="shadow-card w-full max-w-md rounded-lg bg-white p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🔐</div>
          <h1 className="font-display mb-2 text-3xl text-neutral-800">Sign In</h1>
          <p className="text-neutral-600">Sign in to manage your clan&apos;s information</p>
        </div>

        <button
          onClick={handleLogin}
          className="bg-primary hover:bg-primary-600 w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-colors"
        >
          Sign In with Keycloak
        </button>

        <div className="mt-6 space-y-3 text-center text-sm">
          <Link to="/forgot-password" className="text-primary block hover:underline">
            Forgot your password?
          </Link>
          <p className="text-neutral-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
