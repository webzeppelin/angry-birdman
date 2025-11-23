/**
 * RosterPage - Manage Clan Roster (Story 3.1)
 *
 * Displays and manages clan roster with:
 * - List of all players (active and inactive)
 * - Filter by active status
 * - Search by player name
 * - Sort by name, join date, left date, kicked date
 * - Add new player
 * - Edit player information
 * - Mark player as left/kicked
 * - Reactivate inactive players
 *
 * Accessible to: Clan admins and owners
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AddPlayerForm } from '@/components/roster/AddPlayerForm';
import { EditPlayerForm } from '@/components/roster/EditPlayerForm';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface RosterMember {
  playerId: number;
  clanId: number;
  playerName: string;
  active: boolean;
  joinedDate: string;
  leftDate: string | null;
  kickedDate: string | null;
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

type ActiveFilter = 'all' | 'active' | 'inactive';
type SortField = 'playerName' | 'joinedDate' | 'leftDate' | 'kickedDate';
type SortOrder = 'asc' | 'desc';

export function RosterPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for filters and search
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('playerName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterMember | null>(null);

  // Check authorization
  const isAuthorized =
    isAuthenticated &&
    user &&
    (user.roles.includes('superadmin') ||
      (user.clanId === Number(clanId) &&
        (user.roles.includes('clan-admin') || user.roles.includes('clan-owner'))));

  // Build query parameters (memoized to prevent re-creating on every render)
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    // Always include active parameter to prevent API default behavior
    if (activeFilter === 'all') {
      params.append('active', 'all');
    } else {
      params.append('active', String(activeFilter === 'active'));
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('page', String(page));
    params.append('limit', '50');
    return params;
  }, [activeFilter, searchQuery, sortBy, sortOrder, page]);

  // Fetch roster
  const {
    data: rosterData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roster', clanId, activeFilter, searchQuery, sortBy, sortOrder, page],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}/roster?${queryParams.toString()}`);
      return response.data as RosterListResponse;
    },
    enabled: Boolean(clanId && isAuthorized),
    refetchOnWindowFocus: false,
    staleTime: 5000, // Consider data fresh for 5 seconds
    placeholderData: (previousData: RosterListResponse | undefined) => previousData, // Keep showing old data while fetching new data
  });

  // Mark player as left mutation
  const markAsLeftMutation = useMutation({
    mutationFn: async ({ playerId, leftDate }: { playerId: number; leftDate: string }) => {
      await apiClient.post(`/api/clans/${clanId}/roster/${playerId}/left`, { leftDate });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId] });
    },
  });

  // Mark player as kicked mutation
  const markAsKickedMutation = useMutation({
    mutationFn: async ({ playerId, kickedDate }: { playerId: number; kickedDate: string }) => {
      await apiClient.post(`/api/clans/${clanId}/roster/${playerId}/kicked`, { kickedDate });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId] });
    },
  });

  // Reactivate player mutation
  const reactivateMutation = useMutation({
    mutationFn: async ({ playerId, joinedDate }: { playerId: number; joinedDate: string }) => {
      await apiClient.post(`/api/clans/${clanId}/roster/${playerId}/reactivate`, { joinedDate });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId] });
    },
  });

  // Memoized search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, []);

  // Export handler
  const handleExport = async () => {
    try {
      const response = await apiClient.get(
        `/api/clans/${clanId}/roster/export?active=${activeFilter === 'all' ? 'all' : activeFilter === 'active' ? 'true' : 'false'}`
      );
      const { csv, filename } = response.data as { csv: string; filename: string };

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting roster:', error);
      alert('Failed to export roster. Please try again.');
    }
  };

  // Redirect if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="shadow-card mx-auto max-w-2xl rounded-lg bg-white p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mb-6 text-neutral-600">
              You must be a clan admin or owner to manage the roster.
            </p>
            <Link
              to={`/clans/${clanId}`}
              className="bg-primary-600 hover:bg-primary-700 inline-block rounded px-6 py-2 text-white"
            >
              Back to Clan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleMarkAsLeft = (player: RosterMember) => {
    if (confirm(`Mark ${player.playerName} as left?`)) {
      const today = new Date().toISOString().split('T')[0] as string;
      markAsLeftMutation.mutate({ playerId: player.playerId, leftDate: today });
    }
  };

  const handleMarkAsKicked = (player: RosterMember) => {
    if (confirm(`Mark ${player.playerName} as kicked?`)) {
      const today = new Date().toISOString().split('T')[0] as string;
      markAsKickedMutation.mutate({ playerId: player.playerId, kickedDate: today });
    }
  };

  const handleReactivate = (player: RosterMember) => {
    if (confirm(`Reactivate ${player.playerName}?`)) {
      const today = new Date().toISOString().split('T')[0] as string;
      reactivateMutation.mutate({ playerId: player.playerId, joinedDate: today });
    }
  };

  const handleEdit = (player: RosterMember) => {
    setSelectedPlayer(player);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 h-10 w-1/3 animate-pulse rounded bg-neutral-200"></div>
            <div className="shadow-card rounded-lg bg-white p-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded bg-neutral-100"></div>
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
              onClick={() => navigate(-1)}
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
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-neutral-900">Roster Management</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 rounded px-4 py-2 text-white"
            >
              <span className="text-xl">+</span>
              Add Player
            </button>
          </div>

          {/* Filters and Search */}
          <div className="shadow-card mb-6 rounded-lg bg-white p-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div>
                <input
                  key="roster-search"
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-1"
                />
              </div>

              {/* Active Filter */}
              <div>
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value as ActiveFilter);
                    setPage(1);
                  }}
                  className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-1"
                >
                  <option value="all">All Players</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className="focus:border-primary-500 focus:ring-primary-500 flex-1 rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-1"
                >
                  <option value="playerName">Name</option>
                  <option value="joinedDate">Join Date</option>
                  <option value="leftDate">Left Date</option>
                  <option value="kickedDate">Kicked Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="rounded border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Player List */}
          <div className="shadow-card rounded-lg bg-white">
            {players.length === 0 ? (
              <div className="p-12 text-center">
                <p className="mb-2 text-4xl text-neutral-300">👥</p>
                <p className="text-lg text-neutral-600">No players found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-primary-600 hover:text-primary-700 mt-4"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-neutral-200 bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                          Player Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                          Left/Kicked
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {players.map((player) => (
                        <tr key={player.playerId} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 text-sm">
                            <Link
                              to={`/clans/${clanId}/roster/${player.playerId}/history`}
                              className="text-primary-600 hover:text-primary-800 font-medium hover:underline"
                            >
                              {player.playerName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {player.active ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                {player.kickedDate ? 'Kicked' : 'Left'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">
                            {formatDate(player.joinedDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">
                            {player.kickedDate
                              ? formatDate(player.kickedDate)
                              : formatDate(player.leftDate)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <div className="flex justify-end gap-2">
                              {player.active ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(player)}
                                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleMarkAsLeft(player)}
                                    className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700"
                                  >
                                    Mark Left
                                  </button>
                                  <button
                                    onClick={() => handleMarkAsKicked(player)}
                                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                                  >
                                    Kick
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(player)}
                                  className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                    <p className="text-sm text-neutral-600">
                      Showing {players.length} of {pagination.total} players
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                        className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Import/Export Actions */}
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to={`/clans/${clanId}/roster/import`}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Import CSV
            </Link>
            <button
              onClick={() => void handleExport()}
              className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPlayerForm
        clanId={Number(clanId)}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Optionally show success message
        }}
      />

      <EditPlayerForm
        clanId={Number(clanId)}
        player={selectedPlayer}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlayer(null);
        }}
        onSuccess={() => {
          // Optionally show success message
        }}
      />
    </div>
  );
}
