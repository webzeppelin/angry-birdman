/**
 * PlayerPerformanceReportPage Component
 * Story 7.6: View Player Performance Over Time
 * Track individual player development with comparison to clan average
 */

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { apiClient } from '@/lib/api-client';

import { DateRangePicker } from '../../components/charts/DateRangePicker';

interface RosterMember {
  playerId: number;
  playerName: string;
  active: boolean;
}

interface PerformanceData {
  date: string;
  battleId: string;
  opponentName: string;
  playerRatio: number;
  clanRatio: number;
  clanAverageRatio: number;
  rank: number;
  ratioRank: number;
  score: number;
  fp: number;
  played: boolean;
}

interface PlayerPerformanceResponse {
  player: {
    playerId: number;
    name: string;
    active: boolean;
  };
  performance: PerformanceData[];
  summary: {
    totalBattles: number;
    battlesPlayed: number;
    participationRate: number;
    avgRatio: number;
    minRatio: number;
    maxRatio: number;
    clanAvgRatio: number;
    comparisonToClan: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export function PlayerPerformanceReportPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch roster members
  const {
    data: roster,
    isLoading: isLoadingRoster,
    error: rosterError,
  } = useQuery<{ members: RosterMember[] }>({
    queryKey: ['roster', clanId],
    queryFn: async () => {
      const response = await apiClient.get<{ members: RosterMember[] }>(
        `/api/clans/${clanId}/roster`
      );
      return response.data;
    },
    enabled: !!clanId,
  });

  // Auto-select first player when roster loads
  useEffect(() => {
    if (roster && roster.members.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(roster.members[0].playerId);
    }
  }, [roster, selectedPlayerId]);

  // Fetch player performance data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
  } = useQuery<PlayerPerformanceResponse>({
    queryKey: ['playerPerformance', clanId, selectedPlayerId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<PlayerPerformanceResponse>(
        `/api/clans/${clanId}/reports/player/${selectedPlayerId}?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!clanId && !!selectedPlayerId,
  });

  const isLoading = isLoadingRoster || isLoadingPerformance;
  const error = rosterError || performanceError;

  // Early return after all hooks
  if (!clanId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-red-600">Error: Clan ID is required</p>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving')
      return <ArrowUpIcon className="inline-block h-5 w-5 text-green-600" />;
    if (trend === 'declining')
      return <ArrowDownIcon className="inline-block h-5 w-5 text-red-600" />;
    return <MinusIcon className="inline-block h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          to={`/clans/${clanId}/reports`}
          className="mb-2 inline-block text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Reports
        </Link>
        <h1 className="font-display mb-2 text-3xl font-bold text-gray-900">
          Player Performance Report
        </h1>
        <p className="text-lg text-gray-600">
          Track individual player development and compare to clan average
        </p>
      </div>

      {/* Player Selector */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <label htmlFor="player-select" className="mb-2 block text-sm font-medium text-gray-700">
          Select Player
        </label>
        <select
          id="player-select"
          value={selectedPlayerId || ''}
          onChange={(e) => setSelectedPlayerId(parseInt(e.target.value))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoadingRoster}
        >
          {(roster?.members || []).map((member) => (
            <option key={member.playerId} value={member.playerId}>
              {member.playerName} {member.active ? '' : '(Inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        onDateRangeChange={(start, end) => {
          setStartDate(start || '');
          setEndDate(end || '');
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Loading player performance data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-md">
          <p className="text-red-800">
            Error loading player performance:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Performance Data */}
      {!isLoading && !error && performanceData && (
        <>
          {/* Summary Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Participation Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceData.summary.participationRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {performanceData.summary.battlesPlayed} / {performanceData.summary.totalBattles}{' '}
                battles
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Average Ratio</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceData.summary.avgRatio.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Min: {performanceData.summary.minRatio.toFixed(2)} | Max:{' '}
                {performanceData.summary.maxRatio.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">vs. Clan Average</p>
              <p
                className={`text-3xl font-bold ${
                  performanceData.summary.comparisonToClan > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {performanceData.summary.comparisonToClan > 0 ? '+' : ''}
                {performanceData.summary.comparisonToClan.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Player: {performanceData.summary.avgRatio.toFixed(2)} | Clan:{' '}
                {performanceData.summary.clanAvgRatio.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Performance Trend</p>
              <p className="text-3xl font-bold text-gray-900">
                {getTrendIcon(performanceData.summary.trend)}
                <span className="ml-2 capitalize">{performanceData.summary.trend}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">Based on recent battles</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Ratio Performance Over Time
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData.performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="playerRatio"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Player Ratio"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="clanAverageRatio"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Clan Avg Ratio"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Battle History Table */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Battle History</h2>
            {performanceData.performance.length === 0 ? (
              <p className="text-center text-gray-600">
                No battle participation in the selected date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Opponent
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Score
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        FP
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Ratio
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Ratio Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.performance.map((perf) => (
                      <tr key={perf.battleId} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-900">{perf.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{perf.opponentName}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{perf.rank}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {perf.score.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {perf.fp.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">
                          {perf.playerRatio.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {perf.ratioRank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
