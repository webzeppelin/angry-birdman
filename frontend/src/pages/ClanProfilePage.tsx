/**
 * ClanProfilePage - View Clan Profile (Story 2.9)
 *
 * Displays detailed clan profile information including:
 * - Clan name, Rovio ID, country
 * - Registration date
 * - Active status
 * - Edit button for clan owners
 *
 * Accessible to: All users (public view)
 * Edit access: Clan owners only
 */

import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

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

export function ClanProfilePage() {
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

  // Check if user is owner of this clan
  const isOwner = user && clan && user.clanId === clan.clanId && user.owner;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Loading skeleton */}
            <div className="rounded-lg bg-white p-8 shadow-card">
              <div className="mb-6 h-10 w-1/2 animate-pulse rounded bg-neutral-200"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between border-b border-neutral-100 py-3">
                    <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-6 w-1/2 animate-pulse rounded bg-neutral-200"></div>
                  </div>
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
          <div className="mx-auto max-w-3xl">
            <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
              <div className="mb-4 text-6xl">⚠️</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Clan Not Found</h2>
              <p className="mb-6 text-neutral-600">
                The clan you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link
                to="/clans"
                className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
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
              <li>
                <Link to={`/clans/${clan.clanId}`} className="hover:text-primary">
                  {clan.name}
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-neutral-800">Profile</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl text-neutral-800">Clan Profile</h1>
              <p className="text-neutral-600">View detailed clan information</p>
            </div>
            {isOwner && (
              <Link
                to={`/clans/${clan.clanId}/profile/edit`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>

          {/* Profile Details Card */}
          <div className="rounded-lg bg-white p-8 shadow-card">
            {/* Status Badge */}
            {!clan.active && (
              <div className="mb-6">
                <span className="rounded-lg bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700">
                  Inactive Clan
                </span>
              </div>
            )}

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex justify-between border-b border-neutral-100 py-3">
                <dt className="font-medium text-neutral-600">Clan Name</dt>
                <dd className="text-neutral-800">{clan.name}</dd>
              </div>

              <div className="flex justify-between border-b border-neutral-100 py-3">
                <dt className="font-medium text-neutral-600">Rovio ID</dt>
                <dd className="font-mono text-neutral-800">{clan.rovioId}</dd>
              </div>

              <div className="flex justify-between border-b border-neutral-100 py-3">
                <dt className="font-medium text-neutral-600">Country</dt>
                <dd className="text-neutral-800">{clan.country}</dd>
              </div>

              <div className="flex justify-between border-b border-neutral-100 py-3">
                <dt className="font-medium text-neutral-600">Status</dt>
                <dd>
                  <span
                    className={`rounded px-2 py-1 text-sm font-medium ${
                      clan.active ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {clan.active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="font-medium text-neutral-600">Registration Date</dt>
                <dd className="text-neutral-800">
                  {new Date(clan.registrationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-8 border-t border-neutral-200 pt-8">
              <h3 className="mb-4 text-lg font-semibold text-neutral-800">Clan Statistics</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <div className="mb-1 text-3xl font-bold text-primary">
                    {clan.stats.totalBattles}
                  </div>
                  <div className="text-sm font-medium text-neutral-700">
                    {clan.stats.totalBattles === 1 ? 'Battle' : 'Battles'}
                  </div>
                </div>

                <div className="bg-info/10 rounded-lg p-4 text-center">
                  <div className="text-info mb-1 text-3xl font-bold">
                    {clan.stats.activePlayers}
                  </div>
                  <div className="text-sm font-medium text-neutral-700">Active Players</div>
                </div>

                <div className="rounded-lg bg-success/10 p-4 text-center">
                  <div className="mb-1 text-3xl font-bold text-success">
                    {clan.stats.totalPlayers}
                  </div>
                  <div className="text-sm font-medium text-neutral-700">Total Roster</div>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            {isOwner && (
              <div className="mt-8 rounded-lg bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl text-primary">👑</div>
                  <div>
                    <p className="font-medium text-neutral-800">You are the clan owner</p>
                    <p className="text-sm text-neutral-600">
                      You can edit clan information, manage admins, and control clan settings.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to={`/clans/${clan.clanId}`}
              className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
            >
              ← Back to Clan Dashboard
            </Link>
            {user && user.clanId === clan.clanId && (
              <>
                <span className="text-neutral-300">•</span>
                <Link
                  to={`/clans/${clan.clanId}/admins`}
                  className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
                >
                  View Admins
                </Link>
                {isOwner && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <Link
                      to={`/clans/${clan.clanId}/settings`}
                      className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
                    >
                      Clan Settings
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
