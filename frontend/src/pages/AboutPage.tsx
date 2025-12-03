/**
 * About Page
 *
 * System information and help content.
 */

import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 text-6xl">🐦</div>
          <h1 className="mb-4 font-display text-4xl text-neutral-800">About Angry Birdman</h1>
          <p className="text-xl text-neutral-600">
            A comprehensive clan management system for Angry Birds 2
          </p>
        </div>

        {/* Purpose Section */}
        <section className="mb-8 rounded-lg bg-white p-8 shadow-card">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-800">What is Angry Birdman?</h2>
          <p className="mb-4 text-neutral-700">
            Angry Birdman is a specialized clan management system designed for Angry Birds 2 clan
            administrators. It provides tools to efficiently track Clan-vs-Clan (CvC) battle
            performance, manage clan rosters, and analyze performance trends over time.
          </p>
          <p className="text-neutral-700">
            Built by clan managers for clan managers, Angry Birdman emphasizes efficiency and data
            accuracy, with keyboard-optimized workflows and mobile-friendly interfaces.
          </p>
        </section>

        {/* Key Features */}
        <section className="mb-8 rounded-lg bg-white p-8 shadow-card">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-800">Key Features</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-800">
                <span className="text-2xl">⚔️</span>
                Battle Data Tracking
              </h3>
              <p className="text-neutral-700">
                Efficiently capture battle results with streamlined data entry forms that follow the
                Angry Birds 2 UI flow. Track clan scores, opponent performance, and individual
                player contributions.
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-800">
                <span className="text-2xl">📊</span>
                Advanced Analytics
              </h3>
              <p className="text-neutral-700">
                Analyze performance with <strong>Ratio Scores</strong> that normalize performance
                across different Flock Power levels. View monthly and yearly summaries, trend
                analysis, and comparative statistics.
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-800">
                <span className="text-2xl">👥</span>
                Roster Management
              </h3>
              <p className="text-neutral-700">
                Manage clan members with ease. Track joins, departures, and status changes. Assign
                action codes after battles to guide roster decisions (Hold, Warn, Kick, Reserve).
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-800">
                <span className="text-2xl">🔐</span>
                Secure & Multi-Tenant
              </h3>
              <p className="text-neutral-700">
                Secure authentication via Keycloak with role-based access control. Each clan has its
                own isolated data. Anonymous users can view all statistics without signing in.
              </p>
            </div>
          </div>
        </section>

        {/* Key Concepts */}
        <section className="mb-8 rounded-lg bg-white p-8 shadow-card">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-800">Key Concepts</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Flock Power (FP)</h3>
              <p className="text-sm text-neutral-700">
                A player&apos;s base multiplier (typically 50-4000+) that grows with game
                progression. Represents the strength potential of a player&apos;s bird collection.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Ratio Score</h3>
              <p className="text-sm text-neutral-700">
                The key performance metric:{' '}
                <code className="text-primary">(score / fp) × 1,000</code>. Normalizes performance
                across different FP levels, allowing fair comparison between players of different
                strengths.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Baseline FP</h3>
              <p className="text-sm text-neutral-700">
                The clan&apos;s total FP at the time of battle capture, used for calculating the
                official clan ratio score.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Reserve Players</h3>
              <p className="text-sm text-neutral-700">
                Low-FP inactive players kept on the roster to suppress the clan&apos;s total FP for
                more favorable matchmaking. Their FP is tracked separately in statistics.
              </p>
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className="mb-8 rounded-lg bg-white p-8 shadow-card">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-800">User Roles</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Anonymous User</h3>
              <p className="text-sm text-neutral-700">
                Anyone can browse clans and view all battle statistics without creating an account.
                Perfect for clan members checking performance or opponents researching matchups.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Clan Admin</h3>
              <p className="text-sm text-neutral-700">
                Registered users who manage battle data entry and roster maintenance for their clan.
                Can record battles, manage players, and view administrative analytics.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Clan Owner</h3>
              <p className="text-sm text-neutral-700">
                The clan administrator who registered the clan. Has all admin permissions plus the
                ability to manage clan profile, promote/demote admins, and transfer ownership.
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-neutral-800">Superadmin</h3>
              <p className="text-sm text-neutral-700">
                System administrators with access to all clans. Can manage global settings, action
                codes, and provide support across the platform.
              </p>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-8 rounded-lg bg-primary/10 p-8">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Getting Started</h2>
          <div className="space-y-3">
            <p className="text-neutral-700">
              <strong>To browse data:</strong> No account needed! Click{' '}
              <Link to="/clans" className="font-medium text-primary hover:underline">
                Browse Clans
              </Link>{' '}
              to explore clan statistics and battle history.
            </p>
            <p className="text-neutral-700">
              <strong>To manage your clan:</strong> Create an account, then either register your
              clan if it&apos;s new or request admin access if your clan already exists in the
              system.
            </p>
          </div>
        </section>

        {/* Support */}
        <section className="rounded-lg bg-white p-8 shadow-card">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Support & Feedback</h2>
          <p className="text-neutral-700">
            Angry Birdman is an independent project built for the Angry Birds 2 community.
            We&apos;re constantly improving based on user feedback.
          </p>
          <p className="mt-4 text-sm text-neutral-600">
            <em>Note: This is a fan-made tool and is not affiliated with Rovio Entertainment.</em>
          </p>
        </section>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
