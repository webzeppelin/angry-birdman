/**
 * ForgotPasswordPage Component
 *
 * Epic 2 Story 2.8: Reset My Password
 *
 * Redirects users to Keycloak's password reset flow.
 * Since Keycloak manages authentication, password reset is handled by Keycloak.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { authConfig } from '@/lib/auth-config';

/**
 * Build Keycloak password reset URL
 */
const getPasswordResetUrl = (): string => {
  const { keycloakUrl, realm, clientId, appUrl } = authConfig;

  // Keycloak password reset endpoint
  const keycloakBase = `${keycloakUrl}/realms/${realm}`;
  const resetUrl = `${keycloakBase}/protocol/openid-connect/auth`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    // This parameter tells Keycloak to show the password reset form
    kc_action: 'UPDATE_PASSWORD',
  });

  return `${resetUrl}?${params.toString()}`;
};

/**
 * ForgotPasswordPage Component
 */
export default function ForgotPasswordPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * Handle redirect to Keycloak password reset
   */
  const handleResetPassword = () => {
    setIsRedirecting(true);
    const resetUrl = getPasswordResetUrl();
    window.location.href = resetUrl;
  };

  /**
   * Auto-redirect after 3 seconds (optional)
   * Uncomment to enable auto-redirect
   */
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     handleResetPassword();
  //   }, 3000);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-lg bg-white px-8 py-10 shadow-md">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="mb-8 text-center text-sm text-gray-600">
            You&apos;ll be redirected to our secure password reset page to update your credentials.
          </p>

          {/* How it works */}
          <div className="mb-8 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">How it works:</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span>You&apos;ll be taken to our identity provider&apos;s secure page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span>Enter your account email or username</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>Follow the instructions to reset your password</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  4
                </span>
                <span>Return here and log in with your new password</span>
              </li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You may need to check your email for a password reset link depending on your
                  account settings.
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleResetPassword}
            disabled={isRedirecting}
            className="hover:bg-primary-dark w-full rounded-md border border-transparent bg-primary px-4 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRedirecting ? 'Redirecting...' : 'Continue to Password Reset'}
          </button>

          {/* Links */}
          <div className="mt-6 flex flex-col items-center space-y-2 text-sm">
            <Link to="/login" className="text-gray-600 hover:text-gray-900">
              ← Back to login
            </Link>
            <Link to="/register" className="hover:text-primary-dark text-primary">
              Don&apos;t have an account? Register
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-4 text-center text-xs text-gray-500">
          Having trouble? Contact your clan administrator for assistance.
        </p>
      </div>
    </div>
  );
}
