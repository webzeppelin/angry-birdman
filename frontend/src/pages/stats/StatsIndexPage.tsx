/**
 * StatsIndexPage - Statistics Navigation Page
 *
 * Provides links to monthly and yearly statistics views.
 * Acts as a landing page for the statistics section.
 *
 * Accessible to: All users (anonymous viewing allowed)
 */

import { Link, useParams } from 'react-router-dom';

export default function StatsIndexPage() {
  const { clanId } = useParams<{ clanId: string }>();

  // Get current month and year for default links
  const currentDate = new Date();
  const currentMonthId = currentDate.toISOString().slice(0, 7).replace('-', ''); // YYYYMM format
  const currentYear = currentDate.getFullYear();

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display mb-2 text-4xl text-neutral-800">Statistics</h1>
            <p className="text-lg text-neutral-600">
              View monthly and yearly performance summaries
            </p>
          </div>

          {/* Stats Navigation Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              to={`/clans/${clanId}/stats/months/${currentMonthId}`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-8 transition-all hover:scale-105"
            >
              <div className="mb-4 text-5xl">📅</div>
              <h3 className="group-hover:text-primary mb-3 text-2xl font-semibold text-neutral-800">
                Monthly Stats
              </h3>
              <p className="text-neutral-600">
                View monthly performance summaries and player statistics
              </p>
            </Link>

            <Link
              to={`/clans/${clanId}/stats/years/${currentYear}`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-8 transition-all hover:scale-105"
            >
              <div className="mb-4 text-5xl">🗓️</div>
              <h3 className="group-hover:text-primary mb-3 text-2xl font-semibold text-neutral-800">
                Yearly Stats
              </h3>
              <p className="text-neutral-600">
                Review annual performance and year-over-year trends
              </p>
            </Link>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              to={`/clans/${clanId}`}
              className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
            >
              ← Back to Clan Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
