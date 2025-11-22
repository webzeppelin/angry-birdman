/**
 * YearlyStatsPage - View Yearly Clan and Individual Statistics
 *
 * Stories: 6.5, 6.6, 6.7, 6.8
 *
 * Displays:
 * - Yearly clan performance summary
 * - Individual player performance for the year
 * - Mark complete/reopen controls (admin only)
 * - Note: Completing year also marks all months complete
 * - Navigation to other years and months
 *
 * Accessible to: All users (anonymous viewing allowed)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

interface YearlyClanPerformance {
  clanId: number;
  year: number;
  battleCount: number;
  wonCount: number;
  lostCount: number;
  tiedCount: number;
  averageFp: number;
  averageBaselineFp: number;
  averageRatio: number;
  averageMarginRatio: number;
  averageFpMargin: number;
  averageNonplayingCount: number;
  averageNonplayingFpRatio: number;
  averageReserveCount: number;
  averageReserveFpRatio: number;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface YearlyIndividualPerformance {
  clanId: number;
  year: number;
  playerId: number;
  playerName: string;
  battleCount: number;
  averageScore: number;
  averageFp: number;
  averageRatio: number;
  averageRank: number;
  averageRatioRank: number;
}

interface YearOption {
  yearId: string;
  battleCount: number;
  isComplete: boolean;
}

type SortField =
  | 'playerName'
  | 'battleCount'
  | 'averageScore'
  | 'averageFp'
  | 'averageRatio'
  | 'averageRank'
  | 'averageRatioRank';
type SortOrder = 'asc' | 'desc';

export default function YearlyStatsPage() {
  const { clanId, yearId } = useParams<{ clanId: string; yearId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortField>('averageRatio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const clanIdNum = clanId ? parseInt(clanId, 10) : 0;

  // Check if user can manage period (admin or superadmin)
  const canManagePeriod =
    isAuthenticated &&
    user &&
    (user.roles.includes('superadmin') ||
      (user.clanId === clanIdNum &&
        (user.roles.includes('clan-admin') || user.roles.includes('clan-owner'))));

  // Fetch available years
  const { data: yearsData } = useQuery<YearOption[]>({
    queryKey: ['years', clanIdNum],
    queryFn: async () => {
      const response = await apiClient.get<YearOption[]>(`/api/clans/${clanIdNum}/stats/years`);
      return response.data;
    },
    enabled: !!clanIdNum,
  });

  // Fetch yearly clan summary
  const {
    data: clanSummary,
    isLoading: clanLoading,
    error: clanError,
  } = useQuery<YearlyClanPerformance>({
    queryKey: ['yearly-clan-stats', clanIdNum, yearId],
    queryFn: async () => {
      const response = await apiClient.get<YearlyClanPerformance>(
        `/api/clans/${clanIdNum}/stats/years/${yearId}`
      );
      return response.data;
    },
    enabled: !!clanIdNum && !!yearId,
  });

  // Fetch yearly individual performance
  const {
    data: playerStats,
    isLoading: playersLoading,
    error: playersError,
  } = useQuery<YearlyIndividualPerformance[]>({
    queryKey: ['yearly-player-stats', clanIdNum, yearId],
    queryFn: async () => {
      const response = await apiClient.get<YearlyIndividualPerformance[]>(
        `/api/clans/${clanIdNum}/stats/years/${yearId}/players`
      );
      return response.data;
    },
    enabled: !!clanIdNum && !!yearId,
  });

  // Mark complete/reopen mutation
  const completeMutation = useMutation({
    mutationFn: async (complete: boolean) => {
      const response = await apiClient.post<YearlyClanPerformance>(
        `/api/clans/${clanIdNum}/stats/years/${yearId}/complete`,
        { complete }
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['yearly-clan-stats', clanIdNum, yearId] });
      void queryClient.invalidateQueries({ queryKey: ['years', clanIdNum] });
      void queryClient.invalidateQueries({ queryKey: ['months', clanIdNum] }); // Also refresh months since they may be affected
    },
  });

  // Sort player stats
  const sortedPlayerStats = playerStats
    ? [...playerStats].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const comparison =
          typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : aVal - (bVal as number);
        return sortOrder === 'asc' ? comparison : -comparison;
      })
    : [];

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  const handleComplete = () => {
    if (
      window.confirm(
        `Are you sure you want to mark ${yearId} as complete?\n\nNote: This will also mark ALL MONTHS in ${yearId} as complete.`
      )
    ) {
      void completeMutation.mutate(true);
    }
  };

  const handleReopen = () => {
    if (window.confirm(`Are you sure you want to reopen ${yearId}?`)) {
      void completeMutation.mutate(false);
    }
  };

  const isLoading = clanLoading || playersLoading;
  const error = clanError || playersError;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h2 className="text-lg font-semibold">Error Loading Yearly Stats</h2>
          <p className="mt-1">{getApiErrorMessage(error)}</p>
          <Link
            to={`/clans/${clanId}/battles`}
            className="mt-3 inline-block text-sm font-medium text-red-900 underline"
          >
            ← Back to Battles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yearly Statistics</h1>
            <p className="mt-1 text-gray-600">{yearId}</p>
          </div>
          <div className="flex gap-3">
            {/* Year Selector */}
            <select
              value={yearId}
              onChange={(e) => navigate(`/clans/${clanId}/stats/years/${e.target.value}`)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {yearsData?.map((year) => (
                <option key={year.yearId} value={year.yearId}>
                  {year.yearId} ({year.battleCount} battles)
                  {year.isComplete ? ' ✓' : ''}
                </option>
              ))}
            </select>

            {/* Complete/Reopen Button */}
            {canManagePeriod && clanSummary && (
              <button
                onClick={clanSummary.isComplete ? handleReopen : handleComplete}
                disabled={completeMutation.isPending}
                className={`rounded-md px-6 py-2 font-semibold text-white transition-colors ${
                  clanSummary.isComplete
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-400`}
              >
                {completeMutation.isPending
                  ? 'Updating...'
                  : clanSummary.isComplete
                    ? 'Reopen Year'
                    : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>

        {/* Completion Status Badge */}
        {clanSummary && (
          <div className="mt-3">
            {clanSummary.isComplete ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                ✓ Year Complete
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                ○ Year In Progress
              </span>
            )}
            {canManagePeriod && !clanSummary.isComplete && (
              <span className="ml-3 text-sm text-gray-600">
                (Note: Completing the year will also mark all months as complete)
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading yearly statistics...</div>
        </div>
      ) : (
        <>
          {/* Clan Summary Section */}
          {clanSummary && (
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Clan Performance Summary</h2>

              {/* Battle Results */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-sm font-medium text-blue-600">Total Battles</div>
                  <div className="mt-1 text-3xl font-bold text-blue-900">
                    {clanSummary.battleCount}
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-sm font-medium text-green-600">Wins</div>
                  <div className="mt-1 text-3xl font-bold text-green-900">
                    {clanSummary.wonCount}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="text-sm font-medium text-red-600">Losses</div>
                  <div className="mt-1 text-3xl font-bold text-red-900">
                    {clanSummary.lostCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-600">Ties</div>
                  <div className="mt-1 text-3xl font-bold text-gray-900">
                    {clanSummary.tiedCount}
                  </div>
                </div>
              </div>

              {/* Win Rate */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-500">Win Rate</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(clanSummary.wonCount / clanSummary.battleCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {((clanSummary.wonCount / clanSummary.battleCount) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Average Ratio</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageRatio.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Average FP</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageFp.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Average Baseline FP</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageBaselineFp.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Average Margin Ratio</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageMarginRatio.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Average FP Margin</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageFpMargin.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Avg Non-Playing Count</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageNonplayingCount.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Avg Non-Playing FP Ratio</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageNonplayingFpRatio.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Avg Reserve Count</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageReserveCount.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Avg Reserve FP Ratio</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {clanSummary.averageReserveFpRatio.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Player Performance */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Individual Player Performance
            </h2>

            {sortedPlayerStats.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No players with 3+ battles this year.
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Only showing players with 3+ battles ({sortedPlayerStats.length} players)
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          onClick={() => handleSort('playerName')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Player Name {sortBy === 'playerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('battleCount')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Battles {sortBy === 'battleCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('averageScore')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Avg Score {sortBy === 'averageScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('averageFp')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Avg FP {sortBy === 'averageFp' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('averageRatio')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Avg Ratio {sortBy === 'averageRatio' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('averageRank')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Avg Rank {sortBy === 'averageRank' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('averageRatioRank')}
                          className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        >
                          Avg Ratio Rank{' '}
                          {sortBy === 'averageRatioRank' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sortedPlayerStats.map((player, index) => (
                        <tr key={`${player.playerId}-${index}`} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <Link
                              to={`/clans/${clanId}/roster/${player.playerId}/history`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {player.playerName}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {player.battleCount}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {player.averageScore.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {player.averageFp.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                            {player.averageRatio.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {player.averageRank.toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {player.averageRatioRank.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Navigation Links */}
      <div className="mt-6 flex justify-between">
        <Link to={`/clans/${clanId}/battles`} className="text-blue-600 hover:text-blue-800">
          ← Back to Battles
        </Link>
      </div>
    </div>
  );
}
