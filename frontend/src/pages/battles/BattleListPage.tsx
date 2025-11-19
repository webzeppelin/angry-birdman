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

  const clanIdNum = clanId ? parseInt(clanId, 10) : null;

  // Fetch battle list (must be before early return per React hooks rules)
  const { data, isLoading, error } = useQuery<BattleListResponse>({
    queryKey: ['battles', clanIdNum, { page, limit }],
    queryFn: async () => {
      const response = await fetch(`/api/clans/${clanIdNum}/battles?page=${page}&limit=${limit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch battles');
      return response.json();
    },
    enabled: !!clanIdNum,
  });

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
            {data ? `${data.total} total battles` : 'Loading battles...'}
          </p>
        </div>
        {canCreateBattle && (
          <Link
            to={`/clans/${clanIdNum}/battles/new`}
            className="bg-primary hover:bg-primary-dark rounded-md px-6 py-2 font-semibold text-white transition-colors"
          >
            + Record New Battle
          </Link>
        )}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Result
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Ratio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                    Players
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.battles.map((battle) => {
                  const result =
                    battle.result === 1 ? '✅ Win' : battle.result === -1 ? '❌ Loss' : '🤝 Tie';
                  return (
                    <tr key={battle.battleId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          to={`/clans/${clanIdNum}/battles/${battle.battleId}`}
                          className="text-primary font-medium hover:underline"
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
                        <span className="font-semibold">{result}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium">{battle.score}</div>
                        <div className="text-xs text-gray-500">vs {battle.opponentScore}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium">{battle.ratio.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">
                          {battle.playerStats?.length || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
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
                className="bg-primary hover:bg-primary-dark inline-block rounded-md px-6 py-2 text-white transition-colors"
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
