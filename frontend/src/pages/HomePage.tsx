/**
 * Home Page / Landing Page
 *
 * Welcome page with introduction, CTAs, and clan selector.
 */

import { Link } from 'react-router-dom';

import { ClanSelector } from '@/components/clans/ClanSelector';
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
          <img
            src="/images/angry_birdman_logo_512.png"
            alt="Angry Birdman"
            className="mx-auto mb-4 h-64 w-64 md:h-96 md:w-96 lg:h-[512px] lg:w-[512px]"
          />
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

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display mb-12 text-center text-3xl text-neutral-800">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Battle Tracking */}
            <div className="shadow-card hover:shadow-card-hover rounded-lg bg-white p-6 transition-shadow">
              <div className="mb-4 text-4xl">⚔️</div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-800">Battle Tracking</h3>
              <p className="text-neutral-600">
                Efficiently capture and store Clan-vs-Clan battle results with detailed player
                performance data.
              </p>
            </div>

            {/* Analytics */}
            <div className="shadow-card hover:shadow-card-hover rounded-lg bg-white p-6 transition-shadow">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-800">Advanced Analytics</h3>
              <p className="text-neutral-600">
                Analyze performance trends with ratio scores, win rates, and participation tracking
                over time.
              </p>
            </div>

            {/* Roster Management */}
            <div className="shadow-card hover:shadow-card-hover rounded-lg bg-white p-6 transition-shadow">
              <div className="mb-4 text-4xl">👥</div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-800">Roster Management</h3>
              <p className="text-neutral-600">
                Manage clan members, track status changes, and assign action codes after each
                battle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clan Browser Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display mb-8 text-center text-3xl text-neutral-800">Browse Clans</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-neutral-600">
            Explore clan statistics and battle performance. Find your clan or check out the
            competition!
          </p>
          <ClanSelector maxDisplay={6} />
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
