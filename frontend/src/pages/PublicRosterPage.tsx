/**
 * PublicRosterPage - View Clan Roster (Story 3.2)
 *
 * Public read-only view of clan roster for anonymous users.
 * Shows only active players with name and join date.
 * No edit buttons or administrative features.
 *
 * Accessible to: Everyone (no authentication required)
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { apiClient } from '@/lib/api-client';

interface RosterMember {
  playerId: number;
  clanId: number;
  playerName: string;
  active: boolean;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface RosterListResponse {
  players: RosterMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function PublicRosterPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const navigate = useNavigate();

  // Fetch active players only (no authentication required)
  const {
    data: rosterData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roster', 'public', clanId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/clans/${clanId}/roster?active=true&sortBy=playerName&sortOrder=asc`
      );
      return response.data as RosterListResponse;
    },
    enabled: !!clanId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 h-10 w-1/3 animate-pulse rounded bg-neutral-200"></div>
            <div className="shadow-card rounded-lg bg-white p-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-neutral-100"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="shadow-card mx-auto max-w-2xl rounded-lg bg-white p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Roster</h1>
            <p className="mb-6 text-neutral-600">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => void navigate(-1)}
              className="bg-primary-600 hover:bg-primary-700 rounded px-6 py-2 text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const players = rosterData?.players || [];
  const pagination = rosterData?.pagination;

  return (
    <div className="min-h-[60vh] bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900">Clan Roster</h1>
            <p className="mt-2 text-neutral-600">
              {pagination?.total || 0} active {pagination?.total === 1 ? 'player' : 'players'}
            </p>
          </div>

          {/* Player List */}
          <div className="shadow-card rounded-lg bg-white">
            {players.length === 0 ? (
              <div className="p-12 text-center">
                <p className="mb-2 text-4xl text-neutral-300">👥</p>
                <p className="text-lg text-neutral-600">No active players found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                        Player Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {players.map((player) => (
                      <tr key={player.playerId} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                          {player.playerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {formatDate(player.joinedDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-4 rounded bg-blue-50 p-4 text-sm text-blue-700">
            <p>
              <strong>Note:</strong> This is a public view showing only active players. Clan
              administrators can{' '}
              <button
                onClick={() => void navigate(`/clans/${clanId}/roster`)}
                className="underline hover:text-blue-800"
              >
                sign in
              </button>{' '}
              to manage the full roster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
