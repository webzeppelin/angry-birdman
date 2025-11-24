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

  const resultClass =
    battle.result === 1
      ? 'bg-green-100 text-green-800'
      : battle.result === -1
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800';

  const participationRate = battle.playerStats?.length
    ? (
        (battle.playerStats.length / (battle.playerStats.length + battle.nonplayingCount)) *
        100
      ).toFixed(1)
    : '0';

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Battle {battleId}</h1>
            <p className="mt-1 text-gray-600">
              {formatDateISO(new Date(battle.startDate))} -{' '}
              {formatDateISO(new Date(battle.endDate))}
            </p>
          </div>
          <span
            className={`inline-block rounded-lg px-4 py-2 text-lg font-semibold ${resultClass}`}
          >
            {result}
          </span>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Clan Ratio</h3>
          <p className="text-primary text-3xl font-bold">{battle.ratio.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Score ÷ Baseline FP × 1,000</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Average Ratio</h3>
          <p className="text-secondary text-3xl font-bold">{battle.averageRatio.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Score ÷ Actual FP × 1,000</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Margin</h3>
          <p
            className={`text-3xl font-bold ${battle.marginRatio >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {battle.marginRatio >= 0 ? '+' : ''}
            {battle.marginRatio.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {Math.abs(battle.score - battle.opponentScore).toLocaleString()} pts
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Participation</h3>
          <p className="text-3xl font-bold text-gray-900">{participationRate}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {battle.playerStats?.length || 0} /{' '}
            {(battle.playerStats?.length || 0) + battle.nonplayingCount} members
          </p>
        </div>
      </div>

      {/* Performance Comparison: Clan vs Opponent */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Clan Performance */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Clan Performance
            <span className="ml-2 text-sm font-normal text-gray-500">(Story 5.3)</span>
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Score:</dt>
              <dd className="font-semibold text-gray-900">{battle.score.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="flex items-center text-gray-600">
                Baseline FP:
                <span
                  className="ml-1 cursor-help text-xs"
                  title="The clan's baseline FP at the time of battle"
                >
                  ⓘ
                </span>
              </dt>
              <dd className="font-semibold text-gray-900">{battle.baselineFp.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="flex items-center text-gray-600">
                Actual FP:
                <span
                  className="ml-1 cursor-help text-xs"
                  title="Sum of FP from all participating and non-participating (non-reserve) members"
                >
                  ⓘ
                </span>
              </dt>
              <dd className="font-semibold text-gray-900">{battle.fp.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Clan Ratio:</dt>
              <dd className="text-primary font-bold">{battle.ratio.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Average Ratio:</dt>
              <dd className="text-secondary font-bold">{battle.averageRatio.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="flex items-center text-gray-600">
                Projected Score:
                <span
                  className="ml-1 cursor-help text-xs"
                  title="Estimated score if all members had participated"
                >
                  ⓘ
                </span>
              </dt>
              <dd className="font-semibold text-gray-900">
                {battle.projectedScore.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Margin Ratio:</dt>
              <dd
                className={`font-bold ${battle.marginRatio >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {battle.marginRatio >= 0 ? '+' : ''}
                {battle.marginRatio.toFixed(2)}%
              </dd>
            </div>
          </dl>
        </div>

        {/* Opponent Performance */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Opponent Performance
            <span className="ml-2 text-sm font-normal text-gray-500">(Story 5.4)</span>
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Opponent:</dt>
              <dd className="font-semibold text-gray-900">{battle.opponentName}</dd>
            </div>
            {battle.opponentCountry && (
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-600">Country:</dt>
                <dd className="font-semibold text-gray-900">{battle.opponentCountry}</dd>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Rovio ID:</dt>
              <dd className="font-mono text-sm font-medium text-gray-700">
                {battle.opponentRovioId}
              </dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Score:</dt>
              <dd className="font-semibold text-gray-900">
                {battle.opponentScore.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">FP:</dt>
              <dd className="font-semibold text-gray-900">{battle.opponentFp.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-600">Opponent Ratio:</dt>
              <dd className="font-bold text-gray-900">
                {((battle.opponentScore / battle.opponentFp) * 1000).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center text-gray-600">
                FP Margin:
                <span
                  className="ml-1 cursor-help text-xs"
                  title="Difference between our baseline FP and opponent's FP"
                >
                  ⓘ
                </span>
              </dt>
              <dd
                className={`font-bold ${battle.fpMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {battle.fpMargin >= 0 ? '+' : ''}
                {battle.fpMargin.toFixed(2)}%
              </dd>
            </div>
          </dl>
          {battle.fpMargin > 0 && (
            <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">
              ✓ We had a <strong>{battle.fpMargin.toFixed(1)}%</strong> power advantage
            </p>
          )}
          {battle.fpMargin < 0 && (
            <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
              ⚠ Opponent had a <strong>{Math.abs(battle.fpMargin).toFixed(1)}%</strong> power
              advantage
            </p>
          )}
        </div>
      </div>

      {/* Player Performance Rankings */}
      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Player Performance Rankings
            <span className="ml-2 text-sm font-normal text-gray-500">(Stories 5.5-5.6)</span>
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {battle.playerStats?.length || 0} players participated
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Ratio Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Player
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Score Rank
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
                  Tier
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {battle.playerStats
                ?.sort((a, b) => a.ratioRank - b.ratioRank)
                .map((player) => {
                  // Performance tier based on ratio compared to average
                  const avgRatio = battle.averageRatio;
                  let tier = 'Average';
                  let tierClass = 'bg-gray-100 text-gray-800';
                  if (player.ratio >= avgRatio * 1.2) {
                    tier = 'Excellent';
                    tierClass = 'bg-green-100 text-green-800';
                  } else if (player.ratio >= avgRatio * 1.05) {
                    tier = 'Good';
                    tierClass = 'bg-blue-100 text-blue-800';
                  } else if (player.ratio < avgRatio * 0.8) {
                    tier = 'Poor';
                    tierClass = 'bg-red-100 text-red-800';
                  } else if (player.ratio < avgRatio * 0.95) {
                    tier = 'Below Avg';
                    tierClass = 'bg-orange-100 text-orange-800';
                  }

                  return (
                    <tr key={player.playerId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <span className="text-primary text-lg font-bold">#{player.ratioRank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{player.playerName}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600">
                        #{player.rank}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                        {player.score.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-600">
                        {player.fp.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-base font-bold">
                        {player.ratio.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${tierClass}`}
                        >
                          {tier}
                        </span>
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
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Player Analysis */}
      {battle.nonplayerStats && battle.nonplayerStats.length > 0 && (
        <>
          {/* Non-Player Summary Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-2 text-sm font-medium text-gray-600">Non-Players</h3>
              <p className="text-3xl font-bold text-gray-900">{battle.nonplayingCount}</p>
              <p className="mt-1 text-xs text-gray-500">
                {battle.nonplayingFpRatio.toFixed(1)}% of total FP
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-2 text-sm font-medium text-gray-600">Reserve Players</h3>
              <p className="text-3xl font-bold text-orange-600">{battle.reserveCount}</p>
              <p className="mt-1 text-xs text-gray-500">
                {battle.reserveFpRatio.toFixed(1)}% of total FP
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-2 text-sm font-medium text-gray-600">Projected Score</h3>
              <p className="text-3xl font-bold text-purple-600">
                {battle.projectedScore.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                If all had played: +
                {(((battle.projectedScore - battle.score) / battle.score) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-2 text-sm font-medium text-gray-600">Participation Rate</h3>
              <p className="text-3xl font-bold text-gray-900">{participationRate}%</p>
              <p className="mt-1 text-xs text-gray-500">
                {battle.playerStats?.length || 0} of{' '}
                {(battle.playerStats?.length || 0) + battle.nonplayingCount} played
              </p>
            </div>
          </div>

          {/* Non-Player Details */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                Non-Players & Reserves
                <span className="ml-2 text-sm font-normal text-gray-500">(Stories 5.7-5.9)</span>
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {battle.nonplayerStats.length} roster members did not participate
              </p>
            </div>

            {/* Separate tables for non-reserves and reserves */}
            <div className="p-6">
              {/* Regular Non-Players */}
              {battle.nonplayerStats.filter((np) => !np.reserve).length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Active Non-Players ({battle.nonplayerStats.filter((np) => !np.reserve).length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">
                            Player
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                            FP
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                            % of Total FP
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {battle.nonplayerStats
                          .filter((np) => !np.reserve)
                          .map((nonplayer, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                {nonplayer.playerName}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                                {nonplayer.fp.toLocaleString()}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-600">
                                {((nonplayer.fp / battle.fp) * 100).toFixed(2)}%
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                  {nonplayer.actionCode}
                                </span>
                                {nonplayer.actionReason && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {nonplayer.actionReason}
                                  </p>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reserve Players */}
              {battle.nonplayerStats.filter((np) => np.reserve).length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Reserve Players ({battle.nonplayerStats.filter((np) => np.reserve).length})
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      - Strategic FP management
                    </span>
                  </h3>
                  <div className="mb-4 rounded-lg bg-orange-50 p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Reserve Strategy:</strong> These low-FP inactive players help suppress
                      the clan&apos;s total FP for more favorable matchmaking while maintaining clan
                      size.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-orange-700">
                            Player
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-orange-700">
                            FP
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-orange-700">
                            % of Total FP
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase text-orange-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100 bg-white">
                        {battle.nonplayerStats
                          .filter((np) => np.reserve)
                          .map((nonplayer, index) => (
                            <tr key={index} className="bg-orange-50/30 hover:bg-orange-50">
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                {nonplayer.playerName}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                                {nonplayer.fp.toLocaleString()}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-600">
                                {(
                                  (nonplayer.fp / (battle.fp + battle.reserveCount * 50)) *
                                  100
                                ).toFixed(2)}
                                %
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                                  {nonplayer.actionCode}
                                </span>
                                {nonplayer.actionReason && (
                                  <p className="mt-1 text-xs text-orange-600">
                                    {nonplayer.actionReason}
                                  </p>
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
          </div>
        </>
      )}
    </div>
  );
}
