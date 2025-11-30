/**
 * MonthlyStatsPage - View Monthly Clan and Individual Statistics
 *
 * Stories: 6.1, 6.2, 6.3, 6.4
 *
 * Displays:
 * - Monthly clan performance summary
 * - Individual player performance for the month
 * - Mark complete/reopen controls (admin only)
 * - Navigation to other months
 *
 * Accessible to: All users (anonymous viewing allowed)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

interface MonthlyClanPerformance {
  clanId: number;
  year: number;
  month: number;
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

interface MonthlyIndividualPerformance {
  clanId: number;
  year: number;
  month: number;
  playerId: number;
  playerName: string;
  battleCount: number;
  averageScore: number;
  averageFp: number;
  averageRatio: number;
  averageRank: number;
  averageRatioRank: number;
}

interface MonthOption {
  monthId: string;
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

export default function MonthlyStatsPage() {
  const { clanId, monthId } = useParams<{ clanId: string; monthId: string }>();
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

  // Fetch available months
  const { data: monthsData } = useQuery<MonthOption[]>({
    queryKey: ['months', clanIdNum],
    queryFn: async () => {
      const response = await apiClient.get<MonthOption[]>(`/api/clans/${clanIdNum}/stats/months`);
      return response.data;
    },
    enabled: !!clanIdNum,
  });

  // Fetch monthly clan summary
  const {
    data: clanSummary,
    isLoading: clanLoading,
    error: clanError,
  } = useQuery<MonthlyClanPerformance>({
    queryKey: ['monthly-clan-stats', clanIdNum, monthId],
    queryFn: async () => {
      const response = await apiClient.get<MonthlyClanPerformance>(
        `/api/clans/${clanIdNum}/stats/months/${monthId}`
      );
      return response.data;
    },
    enabled: !!clanIdNum && !!monthId,
  });

  // Fetch monthly individual performance
  const {
    data: playerStats,
    isLoading: playersLoading,
    error: playersError,
  } = useQuery<MonthlyIndividualPerformance[]>({
    queryKey: ['monthly-player-stats', clanIdNum, monthId],
    queryFn: async () => {
      const response = await apiClient.get<MonthlyIndividualPerformance[]>(
        `/api/clans/${clanIdNum}/stats/months/${monthId}/players`
      );
      return response.data;
    },
    enabled: !!clanIdNum && !!monthId,
  });

  // Mark complete/reopen mutation
  const completeMutation = useMutation({
    mutationFn: async (complete: boolean) => {
      const response = await apiClient.post<MonthlyClanPerformance>(
        `/api/clans/${clanIdNum}/stats/months/${monthId}/complete`,
        { complete }
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monthly-clan-stats', clanIdNum, monthId] });
      void queryClient.invalidateQueries({ queryKey: ['months', clanIdNum] });
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
      window.confirm(`Are you sure you want to mark ${formatMonthDisplay(monthId)} as complete?`)
    ) {
      void completeMutation.mutate(true);
    }
  };

  const handleReopen = () => {
    if (window.confirm(`Are you sure you want to reopen ${formatMonthDisplay(monthId)}?`)) {
      void completeMutation.mutate(false);
    }
  };

  // Format month ID for display (YYYYMM -> "January 2025")
  const formatMonthDisplay = (monthId?: string): string => {
    if (!monthId || monthId.length !== 6) return '';
    const year = parseInt(monthId.substring(0, 4), 10);
    const month = parseInt(monthId.substring(4, 6), 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const isLoading = clanLoading || playersLoading;
  const error = clanError || playersError;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h2 className="text-lg font-semibold">Error Loading Monthly Stats</h2>
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
            <h1 className="text-3xl font-bold text-gray-900">Monthly Statistics</h1>
            <p className="mt-1 text-gray-600">{formatMonthDisplay(monthId)}</p>
          </div>
          <div className="flex gap-3">
            {/* Month Selector */}
            <select
              value={monthId}
              onChange={(e) => navigate(`/clans/${clanId}/stats/months/${e.target.value}`)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {monthsData?.map((month) => (
                <option key={month.monthId} value={month.monthId}>
                  {formatMonthDisplay(month.monthId)} ({month.battleCount} battles)
                  {month.isComplete ? ' ✓' : ''}
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
                    ? 'Reopen Month'
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
                ✓ Month Complete
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                ○ Month In Progress
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading monthly statistics...</div>
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
                No players with 3+ battles this month.
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
                              to={`/clans/${clanId}/roster/${player.playerId}/history?from=monthly&monthId=${monthId}`}
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
        <Link
          to={`/clans/${clanId}/stats/years/${monthId?.substring(0, 4)}`}
          className="text-blue-600 hover:text-blue-800"
        >
          View Yearly Stats →
        </Link>
      </div>
    </div>
  );
}
