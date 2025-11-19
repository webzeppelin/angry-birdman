import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
      const response = await fetch(
        `/api/clans/${clanIdNum}/battles?page=${page}&limit=${limit}`,
        { credentials: 'include' }
      );
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Battle History</h1>
          <p className="text-gray-600 mt-1">
            {data ? `${data.total} total battles` : 'Loading battles...'}
          </p>
        </div>
        {canCreateBattle && (
          <Link
            to={`/clans/${clanIdNum}/battles/new`}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-semibold"
          >
            + Record New Battle
          </Link>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading battles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-800 font-semibold">Error loading battles</p>
          <p className="text-red-700 text-sm">{(error as Error).message}</p>
        </div>
      )}

      {/* Battle List */}
      {data && data.battles.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ratio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Players
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.battles.map((battle) => {
                  const result =
                    battle.result === 1 ? '✅ Win' : battle.result === -1 ? '❌ Loss' : '🤝 Tie';
                  return (
                    <tr key={battle.battleId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/clans/${clanIdNum}/battles/${battle.battleId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {battle.battleId}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{battle.opponentName}</div>
                        {battle.opponentCountry && (
                          <div className="text-sm text-gray-500">{battle.opponentCountry}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="font-semibold">{result}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium">{battle.score}</div>
                        <div className="text-xs text-gray-500">vs {battle.opponentScore}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium">{battle.clanRatio.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">{battle.playerStats?.length || 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        !isLoading &&
        !error && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No battles recorded yet</p>
            {canCreateBattle && (
              <Link
                to={`/clans/${clanIdNum}/battles/new`}
                className="inline-block px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
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
