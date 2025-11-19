import { formatDateISO } from '@angrybirdman/common';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, Navigate } from 'react-router-dom';

import type { BattleResponse } from '../../types/battle';

export default function BattleDetailPage() {
  const { clanId, battleId } = useParams<{ clanId: string; battleId: string }>();

  const clanIdNum = clanId ? parseInt(clanId, 10) : null;

  // Fetch battle details (must be before early returns per React hooks rules)
  const {
    data: battle,
    isLoading,
    error,
  } = useQuery<BattleResponse>({
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
      <div className="mx-auto max-w-7xl p-6">
        <div className="py-12 text-center">
          <p className="text-gray-600">Loading battle details...</p>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Error loading battle</p>
          <p className="text-sm text-red-700">{error ? error.message : 'Battle not found'}</p>
        </div>
        <Link
          to={`/clans/${clanIdNum}/battles`}
          className="text-primary mt-4 inline-block hover:underline"
        >
          ← Back to Battles
        </Link>
      </div>
    );
  }

  const result = battle.result === 1 ? '✅ Win' : battle.result === -1 ? '❌ Loss' : '🤝 Tie';

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/clans/${clanIdNum}/battles`}
          className="text-primary mb-2 inline-block hover:underline"
        >
          ← Back to Battles
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Battle {battleId}</h1>
        <p className="mt-1 text-gray-600">
          {formatDateISO(new Date(battle.startDate))} - {formatDateISO(new Date(battle.endDate))}
        </p>
      </div>

      {/* Battle Overview */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Result</h3>
          <p className="text-3xl font-bold">{result}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Clan Ratio</h3>
          <p className="text-primary text-3xl font-bold">{battle.ratio.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Average Ratio</h3>
          <p className="text-secondary text-3xl font-bold">{battle.averageRatio.toFixed(2)}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Scores</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700">Our Clan</h3>
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
            <h3 className="mb-2 text-lg font-semibold text-gray-700">{battle.opponentName}</h3>
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
      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Player Performance ({battle.playerStats?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Player ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  FP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Ratio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Ratio Rank
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {battle.playerStats?.map((player) => (
                <tr key={player.playerId}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">{player.rank}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">{player.playerId}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                    {player.score}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm">{player.fp}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold">
                    {player.ratio.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                    {player.ratioRank}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {player.actionCode}
                    </span>
                    {player.actionReason && (
                      <p className="mt-1 text-xs text-gray-500">{player.actionReason}</p>
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
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">
              Non-Players ({battle.nonplayerStats.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Player ID
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                    FP
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                    Reserve
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {battle.nonplayerStats.map((nonplayer, index) => (
                  <tr key={index} className={nonplayer.reserve ? 'bg-orange-50' : ''}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">{nonplayer.playerId}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                      {nonplayer.fp}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                      {nonplayer.reserve ? '✓' : ''}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        {nonplayer.actionCode}
                      </span>
                      {nonplayer.actionReason && (
                        <p className="mt-1 text-xs text-gray-500">{nonplayer.actionReason}</p>
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
