/**
 * PostRegistrationTriagePage Component
 *
 * Epic 2 Story 2.3: Post-Registration Triage
 *
 * Guides newly registered users to their next step:
 * - Register a new clan if they are starting fresh
 * - Find and request access to an existing clan
 *
 * This page helps users understand what to do after account creation.
 */

import { Link, useLocation } from 'react-router-dom';

/**
 * PostRegistrationTriagePage Component
 */
export default function PostRegistrationTriagePage() {
  const location = useLocation();
  const state = location.state as { userId?: string; username?: string } | null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Success Message */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome{state?.username ? `, ${state.username}` : ''}!
          </h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            Your account has been created successfully
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-8">
          <h3 className="mb-6 text-center text-xl font-bold text-gray-900">
            What would you like to do next?
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Register New Clan */}
            <Link
              to="/register/clan"
              className="hover:border-primary focus:ring-primary relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-primary-100 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg
                    className="text-primary h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Register New Clan</h4>
                  <p className="mt-2 text-sm text-gray-600">
                    Create a new clan and become its owner. You&apos;ll be able to manage your
                    clan&apos;s roster and track battle statistics.
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-primary inline-flex items-center text-sm font-medium">
                    Get started
                    <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Find Existing Clan */}
            <Link
              to="/clans"
              className="hover:border-primary focus:ring-primary relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-secondary-100 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg
                    className="text-secondary h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Find Existing Clan</h4>
                  <p className="mt-2 text-sm text-gray-600">
                    Search for your clan in our directory and request administrative access from the
                    current owners.
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-secondary inline-flex items-center text-sm font-medium">
                    Browse clans
                    <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 rounded-md border border-blue-200 bg-blue-50 p-4">
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
              <h3 className="text-sm font-medium text-blue-800">Need help deciding?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  <strong>Register a new clan</strong> if you&apos;re the first from your clan to
                  use this system.
                </p>
                <p className="mt-1">
                  <strong>Find existing clan</strong> if someone else from your clan has already set
                  it up.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skip for now */}
        <div className="text-center">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            I&apos;ll do this later, take me to the home page
          </Link>
        </div>
      </div>
    </div>
  );
}
