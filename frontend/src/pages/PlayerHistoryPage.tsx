/**
 * Player History Page
 * Displays comprehensive player history including battle participation and statistics
 * Story 3.8: View Player History
 */

import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';

import { apiClient } from '../lib/api-client';

interface PlayerHistory {
  player: {
    playerId: number;
    playerName: string;
    active: boolean;
    joinedDate: string;
    leftDate: string | null;
    kickedDate: string | null;
  };
  summary: {
    totalBattles: number;
    totalParticipated: number;
    totalNonparticipated: number;
    averageScore: number;
    averageFp: number;
    averageRatio: number;
    averageRank: number;
    averageRatioRank: number;
    participationRate: number;
  };
  recentBattles: Array<{
    battleId: string;
    startDate: string;
    endDate: string;
    participated: boolean;
    rank: number | null;
    score: number | null;
    fp: number | null;
    ratio: number | null;
    ratioRank: number | null;
    actionCode: string;
    actionReason: string | null;
  }>;
  actionCodeHistory: Array<{
    actionCode: string;
    count: number;
    percentage: number;
  }>;
}

export default function PlayerHistoryPage() {
  const { clanId, playerId } = useParams<{ clanId: string; playerId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine the context from which the user navigated to this page
  const from = searchParams.get('from'); // 'monthly' | 'yearly' | null (default to roster)
  const monthId = searchParams.get('monthId');
  const yearId = searchParams.get('yearId');

  // Helper to format month display (YYYYMM -> "January 2025")
  const formatMonthDisplay = (monthId: string): string => {
    if (!monthId || monthId.length !== 6) return '';
    const year = parseInt(monthId.substring(0, 4), 10);
    const month = parseInt(monthId.substring(4, 6), 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Generate breadcrumb text and back button info based on context
  const getNavigationInfo = () => {
    if (from === 'monthly' && monthId) {
      return {
        breadcrumb: `Home / Clans / Clan ${clanId} / Monthly Stats / ${formatMonthDisplay(monthId)} / Player History`,
        backPath: `/clans/${clanId}/stats/months/${monthId}`,
        backLabel: 'Back to Monthly Stats',
      };
    } else if (from === 'yearly' && yearId) {
      return {
        breadcrumb: `Home / Clans / Clan ${clanId} / Yearly Stats / ${yearId} / Player History`,
        backPath: `/clans/${clanId}/stats/years/${yearId}`,
        backLabel: 'Back to Yearly Stats',
      };
    } else {
      // Default to roster context
      return {
        breadcrumb: `Home / Clans / Clan ${clanId} / Roster / Player ${playerId} / History`,
        backPath: `/clans/${clanId}/roster`,
        backLabel: 'Back to Roster',
      };
    }
  };

  const navInfo = getNavigationInfo();

  const {
    data: history,
    isLoading,
    error,
  } = useQuery<PlayerHistory>({
    queryKey: ['playerHistory', clanId, playerId],
    queryFn: async (): Promise<PlayerHistory> => {
      const response = await apiClient.get(`/api/clans/${clanId}/roster/${playerId}/history`);
      return response.data as PlayerHistory;
    },
    enabled: !!clanId && !!playerId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-32 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-xl font-bold text-red-800">Error Loading Player History</h2>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Failed to load player history'}
          </p>
          <button
            onClick={() => void navigate(navInfo.backPath)}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            {navInfo.backLabel}
          </button>
        </div>
      </div>
    );
  }

  const { player, summary, recentBattles, actionCodeHistory } = history;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{player.playerName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span
                className={`rounded px-2 py-1 ${player.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {player.active ? 'Active' : 'Inactive'}
              </span>
              <span>Joined: {new Date(player.joinedDate).toLocaleDateString()}</span>
              {player.leftDate && (
                <span>Left: {new Date(player.leftDate).toLocaleDateString()}</span>
              )}
              {player.kickedDate && (
                <span>Kicked: {new Date(player.kickedDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <Link
            to={navInfo.backPath}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            {navInfo.backLabel}
          </Link>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Battle Participation */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Battle Participation</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Battles:</span>
              <span className="font-semibold">{summary.totalBattles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Participated:</span>
              <span className="font-semibold text-green-600">{summary.totalParticipated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Non-Participated:</span>
              <span className="font-semibold text-gray-600">{summary.totalNonparticipated}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Participation Rate:</span>
              <span className="font-semibold">{summary.participationRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Performance Statistics */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Performance Averages</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Score:</span>
              <span className="font-semibold">{summary.averageScore.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flock Power:</span>
              <span className="font-semibold">{summary.averageFp.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ratio:</span>
              <span className="font-semibold text-primary-600">
                {summary.averageRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Score Rank:</span>
              <span className="font-semibold">{summary.averageRank.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ratio Rank:</span>
              <span className="font-semibold">{summary.averageRatioRank.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Action Code Frequency */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Action Codes</h2>
          <div className="space-y-2">
            {actionCodeHistory.slice(0, 5).map((ac) => (
              <div key={ac.actionCode} className="flex items-center justify-between">
                <span className="text-gray-600">{ac.actionCode}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ac.count}</span>
                  <span className="text-sm text-gray-500">({ac.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
            {actionCodeHistory.length === 0 && (
              <p className="text-sm text-gray-500">No action codes recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Battles */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Battles</h2>

        {recentBattles.length === 0 ? (
          <p className="text-gray-500">No battle history available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Battle Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    FP
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ratio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ratio Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action Code
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentBattles.map((battle) => (
                  <tr key={battle.battleId} className={battle.participated ? '' : 'bg-gray-50'}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        to={`/clans/${clanId}/battles/${battle.battleId}`}
                        className="text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {new Date(battle.startDate).toLocaleDateString()}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs ${battle.participated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {battle.participated ? 'Played' : 'Did Not Play'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {battle.rank !== null ? battle.rank : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {battle.score !== null ? battle.score.toLocaleString() : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {battle.fp !== null ? battle.fp.toLocaleString() : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {battle.ratio !== null ? battle.ratio.toFixed(2) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {battle.ratioRank !== null ? battle.ratioRank : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm font-medium">{battle.actionCode}</span>
                      {battle.actionReason && (
                        <span className="block text-xs text-gray-500" title={battle.actionReason}>
                          {battle.actionReason.substring(0, 30)}
                          {battle.actionReason.length > 30 ? '...' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
