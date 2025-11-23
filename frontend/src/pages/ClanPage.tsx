/**
 * ClanPage - Individual Clan Landing Page
 *
 * Displays detailed information about a specific clan including:
 * - Clan profile (name, country, Rovio ID)
 * - Basic statistics (battle count, roster size)
 * - Recent battles
 * - Quick links to detailed views
 */

import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { AdminRequestButton } from '@/components/AdminRequestButton';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface ClanDetails {
  clanId: number;
  rovioId: number;
  name: string;
  country: string;
  registrationDate: string;
  active: boolean;
  stats: {
    totalBattles: number;
    activePlayers: number;
    totalPlayers: number;
  };
}

export function ClanPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user } = useAuth();

  // Fetch clan details
  const {
    data: clan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clan', clanId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}`);
      return response.data as ClanDetails;
    },
    enabled: !!clanId,
  });

  // Check if the current user is an admin/owner of this clan
  const isUserClanAdmin =
    user &&
    clan &&
    user.clanId === clan.clanId &&
    (user.roles.includes('clan-admin') ||
      user.roles.includes('clan-owner') ||
      user.roles.includes('superadmin'));

  // Determine roster link based on whether user is admin of this clan
  const rosterLink = isUserClanAdmin
    ? `/clans/${clan?.clanId}/roster`
    : `/clans/${clan?.clanId}/roster/public`;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Loading skeleton */}
            <div className="shadow-card rounded-lg bg-white p-8">
              <div className="mb-4 h-10 w-1/2 animate-pulse rounded bg-neutral-200"></div>
              <div className="mb-8 h-6 w-1/3 animate-pulse rounded bg-neutral-200"></div>
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded bg-neutral-100"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clan) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="shadow-card border-error rounded-lg border bg-white p-12 text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Clan Not Found</h2>
              <p className="mb-6 text-neutral-600">
                The clan you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link
                to="/clans"
                className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
              >
                ← Browse all clans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-neutral-600" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/clans" className="hover:text-primary">
                  Clans
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-neutral-800">{clan.name}</li>
            </ol>
          </nav>

          {/* Clan Header */}
          <div className="shadow-card mb-8 rounded-lg bg-white p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-display mb-2 text-4xl text-neutral-800">{clan.name}</h1>
                <p className="text-lg text-neutral-600">
                  {clan.country} • Rovio ID: {clan.rovioId}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                {!clan.active && (
                  <span className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700">
                    Inactive
                  </span>
                )}
                <AdminRequestButton clanId={clan.clanId.toString()} />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <div className="text-primary mb-2 text-4xl font-bold">
                  {clan.stats.totalBattles}
                </div>
                <div className="text-sm font-medium text-neutral-700">
                  {clan.stats.totalBattles === 1 ? 'Battle' : 'Battles'} Recorded
                </div>
              </div>

              <div className="bg-info/10 rounded-lg p-6 text-center">
                <div className="text-info mb-2 text-4xl font-bold">{clan.stats.activePlayers}</div>
                <div className="text-sm font-medium text-neutral-700">Active Players</div>
              </div>

              <div className="bg-success/10 rounded-lg p-6 text-center">
                <div className="text-success mb-2 text-4xl font-bold">
                  {clan.stats.totalPlayers}
                </div>
                <div className="text-sm font-medium text-neutral-700">Total Roster Size</div>
              </div>
            </div>

            {/* Registration Date */}
            <div className="mt-6 text-center text-sm text-neutral-500">
              Registered on {new Date(clan.registrationDate).toLocaleDateString()}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to={`/clans/${clan.clanId}/battles`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-6 transition-all hover:scale-105"
            >
              <div className="mb-3 text-3xl">⚔️</div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-semibold text-neutral-800">
                Battle History
              </h3>
              <p className="text-sm text-neutral-600">
                View all recorded battles and detailed performance statistics
              </p>
            </Link>

            <Link
              to={rosterLink}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-6 transition-all hover:scale-105"
            >
              <div className="mb-3 text-3xl">👥</div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-semibold text-neutral-800">
                Clan Roster
              </h3>
              <p className="text-sm text-neutral-600">
                {isUserClanAdmin
                  ? 'Manage clan roster and player information'
                  : 'View current and historical clan members'}
              </p>
            </Link>

            <Link
              to={`/clans/${clan.clanId}/reports`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-6 transition-all hover:scale-105"
            >
              <div className="mb-3 text-3xl">📊</div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-semibold text-neutral-800">
                Statistics & Reports
              </h3>
              <p className="text-sm text-neutral-600">Performance trends and analytical reports</p>
            </Link>

            <Link
              to={`/clans/${clan.clanId}/stats/months/${new Date().toISOString().slice(0, 7)}`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-6 transition-all hover:scale-105"
            >
              <div className="mb-3 text-3xl">📅</div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-semibold text-neutral-800">
                Monthly Stats
              </h3>
              <p className="text-sm text-neutral-600">
                View monthly performance summaries and player statistics
              </p>
            </Link>

            <Link
              to={`/clans/${clan.clanId}/stats/years/${new Date().getFullYear()}`}
              className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-6 transition-all hover:scale-105"
            >
              <div className="mb-3 text-3xl">🗓️</div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-semibold text-neutral-800">
                Yearly Stats
              </h3>
              <p className="text-sm text-neutral-600">
                Review annual performance and year-over-year trends
              </p>
            </Link>
          </div>

          {/* Coming Soon Notice */}
          {clan.stats.totalBattles === 0 && (
            <div className="shadow-card rounded-lg bg-white p-8 text-center">
              <div className="mb-4 text-5xl">📝</div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-800">No Battles Yet</h3>
              <p className="text-neutral-600">
                This clan hasn&apos;t recorded any battles yet. Check back later for statistics and
                performance data.
              </p>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              to="/clans"
              className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
            >
              ← Browse all clans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
