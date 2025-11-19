import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import type { RosterMember, RosterResponse } from '../../types/battle';
import type { BattleEntry } from '@angrybirdman/common';

interface PlayerPerformanceTableProps {
  clanId: number;
  data: Partial<BattleEntry>;
  onUpdate: (data: Partial<BattleEntry>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface PlayerRow {
  rank: number;
  playerId: number;
  playerName: string;
  score: number;
  fp: number;
  played: boolean;
}

export default function PlayerPerformanceTable({
  clanId,
  data,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: PlayerPerformanceTableProps) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [checksum, setChecksum] = useState({ totalScore: 0, totalFp: 0 });

  // Fetch active roster
  const { data: rosterData } = useQuery<RosterResponse>({
    queryKey: ['roster', clanId, { active: true }],
    queryFn: async () => {
      const response = await fetch(`/api/clans/${clanId}/roster?active=true`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch roster');
      return response.json();
    },
  });

  // Initialize player rows from roster
  useEffect(() => {
    if (rosterData && players.length === 0) {
      const initialPlayers: PlayerRow[] = rosterData.players.map(
        (member: RosterMember, index: number) => ({
          rank: index + 1,
          playerId: member.playerId,
          playerName: member.playerName,
          score: 0,
          fp: member.fp || 0, // Default to 0 if not provided
          played: false,
        })
      );
      setPlayers(initialPlayers);
    }
  }, [rosterData, players.length]);

  // Load existing data if available
  useEffect(() => {
    if (data.playerStats && data.playerStats.length > 0 && players.length === 0 && rosterData) {
      // Match playerStats with roster to get player names
      const loadedPlayers: PlayerRow[] = data.playerStats.map((stat) => {
        const rosterMember = rosterData.players.find(
          (m: RosterMember) => m.playerId === stat.playerId
        );
        return {
          rank: stat.rank || 0,
          playerId: stat.playerId,
          playerName: rosterMember?.playerName || `Player ${stat.playerId}`,
          score: stat.score,
          fp: stat.fp,
          played: stat.score > 0,
        };
      });
      setPlayers(loadedPlayers);
    }
  }, [data.playerStats, players.length, rosterData]);

  // Calculate checksum
  useEffect(() => {
    const playedPlayers = players.filter((p) => p.played);
    const totalScore = playedPlayers.reduce((sum, p) => sum + p.score, 0);
    const totalFp = playedPlayers.reduce((sum, p) => sum + p.fp, 0);
    setChecksum({ totalScore, totalFp });
  }, [players]);

  const updatePlayer = (
    index: number,
    field: keyof PlayerRow,
    value: string | number | boolean
  ) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value } as PlayerRow;
    setPlayers(updated);
  };

  const handleNext = () => {
    const playedPlayers = players.filter((p) => p.played);

    if (playedPlayers.length === 0) {
      alert('At least one player must have played');
      return;
    }

    // Validate checksum
    const expectedScore = data.score || 0;
    if (checksum.totalScore !== expectedScore) {
      const diff = checksum.totalScore - expectedScore;
      const proceed = window.confirm(
        `⚠️ Score mismatch!\nExpected: ${expectedScore}\nActual: ${checksum.totalScore}\nDifference: ${diff}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    // Validate all players have rank, score, and FP
    const invalidPlayers = playedPlayers.filter((p) => p.rank <= 0 || p.score < 0 || p.fp <= 0);
    if (invalidPlayers.length > 0) {
      alert('All players must have a valid rank (1-100), score (≥0), and FP (>0)');
      return;
    }

    onUpdate({
      playerStats: playedPlayers.map((p) => ({
        playerId: p.playerId,
        rank: p.rank,
        score: p.score,
        fp: p.fp,
        actionCode: 'HOLD', // Placeholder - will be set in step 5
      })),
    });
    onNext();
  };

  const isChecksumValid = checksum.totalScore === (data.score || 0);

  return (
    <div className="space-y-6">
      {/* Checksum Display */}
      <div
        className={`rounded-md p-4 ${isChecksumValid ? 'border border-green-200 bg-green-50' : 'border border-yellow-200 bg-yellow-50'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Total Score</p>
            <p
              className={`text-2xl font-bold ${isChecksumValid ? 'text-green-700' : 'text-yellow-700'}`}
            >
              {checksum.totalScore} / {data.score || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Total FP (Played)</p>
            <p className="text-2xl font-bold text-blue-700">{checksum.totalFp}</p>
          </div>
          <div>
            {isChecksumValid ? (
              <span className="text-2xl text-green-600">✅</span>
            ) : (
              <span className="text-2xl text-yellow-600">⚠️</span>
            )}
          </div>
        </div>
      </div>

      {/* Player Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Played</th>
              <th className="border px-4 py-2">Rank</th>
              <th className="border px-4 py-2">Player</th>
              <th className="border px-4 py-2">Score</th>
              <th className="border px-4 py-2">FP</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.playerId} className={player.played ? 'bg-white' : 'bg-gray-50'}>
                <td className="border px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={player.played}
                    onChange={(e) => updatePlayer(index, 'played', e.target.checked)}
                    className="h-5 w-5"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={player.rank}
                    onChange={(e) => updatePlayer(index, 'rank', parseInt(e.target.value, 10) || 0)}
                    min="1"
                    max="100"
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    disabled={!player.played}
                  />
                </td>
                <td className="border px-4 py-2">{player.playerName}</td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={player.score}
                    onChange={(e) =>
                      updatePlayer(index, 'score', parseInt(e.target.value, 10) || 0)
                    }
                    min="0"
                    className="w-32 rounded border border-gray-300 px-2 py-1"
                    disabled={!player.played}
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={player.fp}
                    onChange={(e) => updatePlayer(index, 'fp', parseInt(e.target.value, 10) || 0)}
                    min="1"
                    className="w-24 rounded border border-gray-300 px-2 py-1"
                    disabled={!player.played}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <div className="space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
        <button
          type="button"
          onClick={handleNext}
          className="bg-primary hover:bg-primary-dark rounded-md px-6 py-2 text-white transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
