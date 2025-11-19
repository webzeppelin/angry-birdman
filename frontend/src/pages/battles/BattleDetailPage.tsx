import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDateISO } from '@angrybirdman/common';
import type { BattleResponse } from '../../types/battle';

export default function BattleDetailPage() {
  const { clanId, battleId } = useParams<{ clanId: string; battleId: string }>();

  const clanIdNum = clanId ? parseInt(clanId, 10) : null;

  // Fetch battle details (must be before early returns per React hooks rules)
  const { data: battle, isLoading, error } = useQuery<BattleResponse>({
    queryKey: ['battle', clanIdNum, battleId],
    queryFn: async () => {
      const response = await fetch(`/api/clans/${clanIdNum}/battles/${battleId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch battle');
      return response.json();
    },
    enabled: !!clanIdNum && !!battleId,
  });

  if (!clanIdNum || !battleId) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading battle details...</p>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-800 font-semibold">Error loading battle</p>
          <p className="text-red-700 text-sm">{error ? (error as Error).message : 'Battle not found'}</p>
        </div>
        <Link
          to={`/clans/${clanIdNum}/battles`}
          className="inline-block mt-4 text-primary hover:underline"
        >
          ← Back to Battles
        </Link>
      </div>
    );
  }

  const result =
    battle.result === 1 ? '✅ Win' : battle.result === -1 ? '❌ Loss' : '🤝 Tie';

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/clans/${clanIdNum}/battles`}
          className="text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Battles
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Battle {battleId}</h1>
        <p className="text-gray-600 mt-1">
          {formatDateISO(new Date(battle.startDate))} - {formatDateISO(new Date(battle.endDate))}
        </p>
      </div>

      {/* Battle Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Result</h3>
          <p className="text-3xl font-bold">{result}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Clan Ratio</h3>
          <p className="text-3xl font-bold text-primary">{battle.clanRatio.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Ratio</h3>
          <p className="text-3xl font-bold text-secondary">{battle.averageRatio.toFixed(2)}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Scores</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Our Clan</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Score:</dt>
                <dd className="font-semibold">{battle.score}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Baseline FP:</dt>
                <dd className="font-semibold">{battle.baselineFp}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Actual FP:</dt>
                <dd className="font-semibold">{battle.fp}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{battle.opponentName}</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Score:</dt>
                <dd className="font-semibold">{battle.opponentScore}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">FP:</dt>
                <dd className="font-semibold">{battle.opponentFp}</dd>
              </div>
              {battle.opponentCountry && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Country:</dt>
                  <dd className="font-semibold">{battle.opponentCountry}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Player Stats */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Player Performance ({battle.playerStats?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Player ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                  FP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                  Ratio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                  Ratio Rank
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {battle.playerStats?.map((player) => (
                <tr key={player.playerId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {player.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {player.playerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {player.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {player.fp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                    {player.ratio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {player.ratioRank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {player.actionCode}
                    </span>
                    {player.actionReason && (
                      <p className="text-xs text-gray-500 mt-1">{player.actionReason}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Player Stats */}
      {battle.nonplayerStats && battle.nonplayerStats.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Non-Players ({battle.nonplayerStats.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Player ID
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    FP
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Reserve
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {battle.nonplayerStats.map((nonplayer, index) => (
                  <tr key={index} className={nonplayer.reserve ? 'bg-orange-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {nonplayer.playerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {nonplayer.fp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {nonplayer.reserve ? '✓' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        {nonplayer.actionCode}
                      </span>
                      {nonplayer.actionReason && (
                        <p className="text-xs text-gray-500 mt-1">{nonplayer.actionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
