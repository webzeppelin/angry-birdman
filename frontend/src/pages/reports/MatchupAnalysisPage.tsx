/**
 * MatchupAnalysisPage Component
 * Story 7.7: View Matchup Analysis
 * Analyze opponents and competitive environment
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { apiClient } from '@/lib/api-client';

import { DateRangePicker } from '../../components/charts/DateRangePicker';

interface Opponent {
  name: string;
  rovioId: string;
  country: string;
  battles: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  avgFpDiff: number;
  isRival: boolean;
  recentBattles: Array<{
    battleId: string;
    date: string;
    result: number;
    score: number;
    opponentScore: number;
    fpDiff: number;
  }>;
}

interface CountryStats {
  country: string;
  battles: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  percentage: number;
}

interface MatchupResponse {
  opponents: Opponent[];
  countries: CountryStats[];
  summary: {
    totalBattles: number;
    uniqueOpponents: number;
    uniqueCountries: number;
    rivals: number;
  };
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export function MatchupAnalysisPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);

  // Fetch matchup data
  const {
    data: matchupData,
    isLoading,
    error,
  } = useQuery<MatchupResponse>({
    queryKey: ['matchups', clanId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<MatchupResponse>(
        `/api/clans/${clanId}/reports/matchups?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!clanId,
  });

  // Early return after all hooks
  if (!clanId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-red-600">Error: Clan ID is required</p>
      </div>
    );
  }

  const getResultBadge = (result: number) => {
    if (result === 1)
      return (
        <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
          W
        </span>
      );
    if (result === -1)
      return (
        <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">L</span>
      );
    return (
      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">T</span>
    );
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
        <h1 className="mb-2 font-display text-3xl font-bold text-gray-900">Matchup Analysis</h1>
        <p className="text-lg text-gray-600">
          Analyze opponents and understand your competitive environment
        </p>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        onDateRangeChange={(start, end) => {
          setStartDate(start || '');
          setEndDate(end || '');
        }}
        className="mb-8"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Loading matchup data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-md">
          <p className="text-red-800">
            Error loading matchup data: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Matchup Data */}
      {!isLoading && !error && matchupData && (
        <>
          {/* Summary Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Total Battles</p>
              <p className="text-3xl font-bold text-gray-900">{matchupData.summary.totalBattles}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Unique Opponents</p>
              <p className="text-3xl font-bold text-gray-900">
                {matchupData.summary.uniqueOpponents}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Countries Faced</p>
              <p className="text-3xl font-bold text-gray-900">
                {matchupData.summary.uniqueCountries}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <p className="mb-1 text-sm text-gray-600">Rival Clans</p>
              <p className="text-3xl font-bold text-gray-900">{matchupData.summary.rivals}</p>
              <p className="mt-1 text-xs text-gray-500">Faced 3+ times</p>
            </div>
          </div>

          {/* Country Distribution */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Opponents by Country</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={matchupData.countries}
                    dataKey="battles"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: CountryStats) => `${entry.country} (${entry.percentage}%)`}
                  >
                    {matchupData.countries.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Win Rate by Country</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={matchupData.countries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Opponents Table */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Opponent History</h2>
            {matchupData.opponents.length === 0 ? (
              <p className="text-center text-gray-600">No opponents in the selected date range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Opponent
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Country
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Battles
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Record
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Win Rate
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Avg FP Diff
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchupData.opponents.map((opponent) => (
                      <tr key={opponent.name} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {opponent.name}
                            {opponent.isRival && (
                              <span className="ml-2 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                Rival
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">ID: {opponent.rovioId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{opponent.country}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {opponent.battles}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          <span className="text-green-600">{opponent.wins}</span>-
                          <span className="text-red-600">{opponent.losses}</span>-
                          <span className="text-gray-600">{opponent.ties}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {opponent.winRate.toFixed(1)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-sm font-semibold ${
                            opponent.avgFpDiff > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {opponent.avgFpDiff > 0 ? '+' : ''}
                          {opponent.avgFpDiff}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedOpponent(opponent)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Opponent Detail Modal */}
          {selectedOpponent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedOpponent.name}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedOpponent.country} | ID: {selectedOpponent.rovioId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOpponent(null)}
                    className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>

                {/* Head-to-Head Summary */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Total Battles</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedOpponent.battles}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Record</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedOpponent.wins}-{selectedOpponent.losses}-{selectedOpponent.ties}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedOpponent.winRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Recent Battles */}
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Recent Battles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                          Result
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                          Our Score
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                          Their Score
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                          FP Diff
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOpponent.recentBattles.map((battle) => (
                        <tr key={battle.battleId} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-900">{battle.date}</td>
                          <td className="px-4 py-2 text-center">{getResultBadge(battle.result)}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {battle.score.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {battle.opponentScore.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-2 text-right text-sm font-semibold ${
                              battle.fpDiff > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {battle.fpDiff > 0 ? '+' : ''}
                            {battle.fpDiff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
