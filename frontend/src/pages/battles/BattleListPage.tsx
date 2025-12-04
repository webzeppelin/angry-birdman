import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import type { BattleListResponse } from '../../types/battle';

export default function BattleListPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState<'startDate' | 'ratio' | 'score'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    opponentName: '',
    opponentCountry: '',
    result: '', // '' = all, '1' = won, '-1' = lost, '0' = tied
  });

  const clanIdNum = clanId ? parseInt(clanId, 10) : null;

  // Build query string with filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.opponentName) params.set('opponentName', filters.opponentName);
    if (filters.opponentCountry) params.set('opponentCountry', filters.opponentCountry);
    if (filters.result) params.set('result', filters.result);
    return params.toString();
  };

  // Fetch battle list (must be before early return per React hooks rules)
  const { data, isLoading, error } = useQuery<BattleListResponse>({
    queryKey: ['battles', clanIdNum, { page, limit, sortBy, sortOrder, filters }],
    queryFn: async (): Promise<BattleListResponse> => {
      const response = await fetch(`/api/clans/${clanIdNum}/battles?${buildQueryString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch battles');
      return response.json() as Promise<BattleListResponse>;
    },
    enabled: !!clanIdNum,
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      opponentName: '',
      opponentCountry: '',
      result: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (!clanIdNum) {
    return <Navigate to="/" replace />;
  }

  const canCreateBattle = isAuthenticated && user?.clanId === clanIdNum;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Battle History</h1>
          <p className="mt-1 text-gray-600">
            {data ? (
              <>
                <span className="font-semibold">{data.total}</span> total battles{' '}
                {data.battles.length > 0 && (
                  <span className="ml-3 text-sm">
                    <span className="text-green-600">
                      ✅ {data.battles.filter((b) => b.result === 1).length}
                    </span>{' '}
                    <span className="text-red-600">
                      ❌ {data.battles.filter((b) => b.result === -1).length}
                    </span>{' '}
                    <span className="text-gray-500">
                      🤝 {data.battles.filter((b) => b.result === 0).length}
                    </span>
                  </span>
                )}
              </>
            ) : (
              'Loading battles...'
            )}
          </p>
          <div className="mt-2 flex gap-3">
            <Link
              to={`/clans/${clanIdNum}/stats/months/${new Date().toISOString().slice(0, 7).replace('-', '')}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📊 View Monthly Stats
            </Link>
            <Link
              to={`/clans/${clanIdNum}/stats/years/${new Date().getFullYear()}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📈 View Yearly Stats
            </Link>
          </div>
        </div>
        {canCreateBattle && (
          <Link
            to={`/clans/${clanIdNum}/battles/new`}
            className="hover:bg-primary-dark rounded-md bg-primary px-6 py-2 font-semibold text-white transition-colors"
          >
            + Record New Battle
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="hover:text-primary-dark text-sm font-medium text-primary"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* Date Range */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Opponent Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Opponent Name</label>
            <input
              type="text"
              placeholder="Search..."
              value={filters.opponentName}
              onChange={(e) => handleFilterChange('opponentName', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              placeholder="Search..."
              value={filters.opponentCountry}
              onChange={(e) => handleFilterChange('opponentCountry', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Result Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Result</label>
            <select
              value={filters.result}
              onChange={(e) => handleFilterChange('result', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Results</option>
              <option value="1">Won</option>
              <option value="-1">Lost</option>
              <option value="0">Tied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-gray-600">Loading battles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Error loading battles</p>
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* Battle List */}
      {data && data.battles.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                    <button
                      onClick={() => {
                        setSortBy('startDate');
                        setSortOrder(
                          sortBy === 'startDate' && sortOrder === 'desc' ? 'asc' : 'desc'
                        );
                      }}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Date</span>
                      {sortBy === 'startDate' && (
                        <span className="text-sm">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Result
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    <button
                      onClick={() => {
                        setSortBy('score');
                        setSortOrder(sortBy === 'score' && sortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      className="flex w-full items-center justify-center space-x-1 hover:text-primary"
                    >
                      <span>Score</span>
                      {sortBy === 'score' && (
                        <span className="text-sm">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    <button
                      onClick={() => {
                        setSortBy('ratio');
                        setSortOrder(sortBy === 'ratio' && sortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      className="flex w-full items-center justify-center space-x-1 hover:text-primary"
                    >
                      <span>Ratio</span>
                      {sortBy === 'ratio' && (
                        <span className="text-sm">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Players
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Participation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.battles.map((battle) => {
                  const result =
                    battle.result === 1 ? 'Win' : battle.result === -1 ? 'Loss' : 'Tie';
                  const resultClass =
                    battle.result === 1
                      ? 'bg-green-100 text-green-800'
                      : battle.result === -1
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800';
                  const participationRate = battle.playerStats?.length
                    ? (
                        (battle.playerStats.length /
                          (battle.playerStats.length + battle.nonplayingCount)) *
                        100
                      ).toFixed(0)
                    : '0';
                  return (
                    <tr key={battle.battleId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          to={`/clans/${clanIdNum}/battles/${battle.battleId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {battle.battleId}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {battle.opponentName}
                        </div>
                        {battle.opponentCountry && (
                          <div className="text-sm text-gray-500">{battle.opponentCountry}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${resultClass}`}
                        >
                          {result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium">{battle.score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          vs {battle.opponentScore.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold text-primary">
                          {battle.ratio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          avg: {battle.averageRatio.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {battle.playerStats?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-700">{participationRate}%</span>
                        {battle.nonplayingCount > 0 && (
                          <div className="text-xs text-gray-500">
                            {battle.nonplayingCount} absent
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total > limit && (
            <div className="mt-6 flex items-center justify-center space-x-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {Math.ceil(data.total / limit)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(data.total / limit), p + 1))}
                disabled={page >= Math.ceil(data.total / limit)}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        !isLoading &&
        !error && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
            <p className="mb-4 text-gray-600">No battles recorded yet</p>
            {canCreateBattle && (
              <Link
                to={`/clans/${clanIdNum}/battles/new`}
                className="hover:bg-primary-dark inline-block rounded-md bg-primary px-6 py-2 text-white transition-colors"
              >
                Record Your First Battle
              </Link>
            )}
          </div>
        )
      )}
    </div>
  );
}
