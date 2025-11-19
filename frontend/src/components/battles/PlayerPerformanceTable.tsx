import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BattleEntry } from '@angrybirdman/common';
import type { RosterMember, RosterResponse } from '../../types/battle';

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
      const response = await fetch(
        `/api/clans/${clanId}/roster?active=true`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch roster');
      return response.json();
    },
  });

  // Initialize player rows from roster
  useEffect(() => {
    if (rosterData && players.length === 0) {
      const initialPlayers: PlayerRow[] = rosterData.members.map((member: RosterMember, index: number) => ({
        rank: index + 1,
        playerId: member.playerId,
        playerName: member.playerName,
        score: 0,
        fp: member.fp,
        played: false,
      }));
      setPlayers(initialPlayers);
    }
  }, [rosterData, players.length]);

  // Load existing data if available
  useEffect(() => {
    if (data.playerStats && data.playerStats.length > 0 && players.length === 0 && rosterData) {
      // Match playerStats with roster to get player names
      const loadedPlayers: PlayerRow[] = data.playerStats.map((stat) => {
        const rosterMember = rosterData.members.find((m: RosterMember) => m.playerId === stat.playerId);
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

  const updatePlayer = (index: number, field: keyof PlayerRow, value: string | number | boolean) => {
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

    // Assign ranks by score (descending)
    const sorted = [...playedPlayers].sort((a, b) => b.score - a.score);
    sorted.forEach((player, index) => {
      player.rank = index + 1;
    });

    onUpdate({
      playerStats: sorted.map((p) => ({
        playerId: p.playerId,
        score: p.score,
        fp: p.fp,
        rank: p.rank,
        actionCode: 'HOLD', // Placeholder - will be set in step 5
      })),
    });
    onNext();
  };

  const isChecksumValid = checksum.totalScore === (data.score || 0);

  return (
    <div className="space-y-6">
      {/* Checksum Display */}
      <div className={`p-4 rounded-md ${isChecksumValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">Total Score</p>
            <p className={`text-2xl font-bold ${isChecksumValid ? 'text-green-700' : 'text-yellow-700'}`}>
              {checksum.totalScore} / {data.score || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Total FP (Played)</p>
            <p className="text-2xl font-bold text-blue-700">{checksum.totalFp}</p>
          </div>
          <div>
            {isChecksumValid ? (
              <span className="text-green-600 text-2xl">✅</span>
            ) : (
              <span className="text-yellow-600 text-2xl">⚠️</span>
            )}
          </div>
        </div>
      </div>

      {/* Player Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Played</th>
              <th className="px-4 py-2 border">Player</th>
              <th className="px-4 py-2 border">FP</th>
              <th className="px-4 py-2 border">Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.playerId} className={player.played ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 border text-center">
                  <input
                    type="checkbox"
                    checked={player.played}
                    onChange={(e) => updatePlayer(index, 'played', e.target.checked)}
                    className="w-5 h-5"
                  />
                </td>
                <td className="px-4 py-2 border">{player.playerName}</td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    value={player.fp}
                    onChange={(e) => updatePlayer(index, 'fp', parseInt(e.target.value, 10) || 0)}
                    min="1"
                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                    disabled={!player.played}
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    value={player.score}
                    onChange={(e) => updatePlayer(index, 'score', parseInt(e.target.value, 10) || 0)}
                    min="0"
                    className="w-32 px-2 py-1 border border-gray-300 rounded"
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
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
        </div>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
