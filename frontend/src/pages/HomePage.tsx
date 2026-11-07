/**
 * Home Page / Landing Page
 *
 * Welcome page with introduction, CTAs, and clan selector.
 */

import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export function HomePage() {
  const { isAuthenticated, login } = useAuth();

  const handleSignIn = () => {
    login().catch(console.error);
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="from-primary to-primary-700 bg-gradient-to-br py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display mb-4 text-4xl md:text-5xl">Angry Birdman</h1>
          <p className="mb-8 text-xl md:text-2xl">Clan Management for Angry Birds 2</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/clans"
              className="text-primary rounded-lg bg-white px-8 py-3 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
            >
              Browse Clans
            </Link>
            {!isAuthenticated && (
              <button
                onClick={handleSignIn}
                className="rounded-lg border-2 border-white bg-transparent px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display mb-8 text-center text-3xl text-neutral-800">How It Works</h2>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white">
                  1
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-neutral-800">
                    Browse or Register
                  </h3>
                  <p className="text-neutral-600">
                    View existing clan data as an anonymous user, or register to manage your own
                    clan.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white">
                  2
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-neutral-800">Enter Battle Data</h3>
                  <p className="text-neutral-600">
                    Quickly capture battle results using our streamlined data entry forms designed
                    for efficiency.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white">
                  3
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-neutral-800">Analyze & Improve</h3>
                  <p className="text-neutral-600">
                    Review analytics, track trends, and make data-driven decisions to improve clan
                    performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
