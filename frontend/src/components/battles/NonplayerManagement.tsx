import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BattleEntry } from '@angrybirdman/common';
import type { RosterMember, RosterResponse } from '../../types/battle';

interface NonplayerManagementProps {
  clanId: number;
  data: Partial<BattleEntry>;
  onUpdate: (data: Partial<BattleEntry>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface NonplayerRow {
  playerId: number;
  name: string; // For display only - not in schema
  fp: number;
  reserve: boolean;
}

export default function NonplayerManagement({
  clanId,
  data,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: NonplayerManagementProps) {
  const [nonplayers, setNonplayers] = useState<NonplayerRow[]>([]);

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

  // Auto-populate non-players from roster
  useEffect(() => {
    if (rosterData && data.playerStats && nonplayers.length === 0) {
      const playedPlayerIds = new Set(data.playerStats.map((p) => p.playerId));
      const nonPlayingMembers = rosterData.members.filter(
        (m: RosterMember) => !playedPlayerIds.has(m.playerId)
      );

      if (nonPlayingMembers.length > 0) {
        const autoNonplayers: NonplayerRow[] = nonPlayingMembers.map((m: RosterMember) => ({
          playerId: m.playerId,
          name: m.playerName,
          fp: m.fp,
          reserve: false,
        }));
        setNonplayers(autoNonplayers);
      }
    }
  }, [rosterData, data.playerStats, nonplayers.length]);

  // Load existing data if available
  useEffect(() => {
    if (data.nonplayerStats && data.nonplayerStats.length > 0 && nonplayers.length === 0 && rosterData) {
      const loadedNonplayers: NonplayerRow[] = data.nonplayerStats.map((np) => {
        const rosterMember = rosterData.members.find((m: RosterMember) => m.playerId === np.playerId);
        return {
          playerId: np.playerId,
          name: rosterMember?.playerName || `Player ${np.playerId}`,
          fp: np.fp,
          reserve: np.reserve,
        };
      });
      setNonplayers(loadedNonplayers);
    }
  }, [data.nonplayerStats, nonplayers.length, rosterData]);

  const addNonplayer = () => {
    // Use negative ID as temporary placeholder for manually added non-players
    const tempId = -(nonplayers.length + 1);
    setNonplayers([...nonplayers, { playerId: tempId, name: '', fp: 0, reserve: false }]);
  };

  const removeNonplayer = (index: number) => {
    const updated = nonplayers.filter((_, i) => i !== index);
    setNonplayers(updated);
  };

  const updateNonplayer = (index: number, field: keyof NonplayerRow, value: string | number | boolean) => {
    const updated = [...nonplayers];
    updated[index] = { ...updated[index], [field]: value } as NonplayerRow;
    setNonplayers(updated);
  };

  const handleNext = () => {
    // Validate all non-players have name and FP
    const invalidNonplayers = nonplayers.filter((np) => !np.name || np.fp <= 0);
    if (invalidNonplayers.length > 0) {
      alert('All non-players must have a name and positive FP value');
      return;
    }

    onUpdate({
      nonplayerStats: nonplayers.map((np) => ({
        playerId: np.playerId,
        fp: np.fp,
        reserve: np.reserve,
        actionCode: 'HOLD', // Placeholder - will be set in step 5
      })),
    });
    onNext();
  };

  const totalNonplayerFp = nonplayers.reduce((sum, np) => sum + np.fp, 0);
  const reserveFp = nonplayers.filter((np) => np.reserve).reduce((sum, np) => sum + np.fp, 0);
  const regularNonplayerFp = totalNonplayerFp - reserveFp;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Non-Players</p>
            <p className="text-2xl font-bold text-blue-700">{nonplayers.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Regular FP</p>
            <p className="text-2xl font-bold text-blue-700">{regularNonplayerFp}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Reserve FP</p>
            <p className="text-2xl font-bold text-orange-700">{reserveFp}</p>
          </div>
        </div>
      </div>

      {/* Non-player Table */}
      {nonplayers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">FP</th>
                <th className="px-4 py-2 border">Reserve</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nonplayers.map((np, index) => (
                <tr key={index} className={np.reserve ? 'bg-orange-50' : 'bg-white'}>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={np.name}
                      onChange={(e) => updateNonplayer(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Player name"
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      value={np.fp}
                      onChange={(e) => updateNonplayer(index, 'fp', parseInt(e.target.value, 10) || 0)}
                      min="1"
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="checkbox"
                      checked={np.reserve}
                      onChange={(e) => updateNonplayer(index, 'reserve', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      onClick={() => removeNonplayer(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-600">No non-players added yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Non-players are automatically populated from roster members who did not play
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={addNonplayer}
        className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors"
      >
        + Add Non-Player
      </button>

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
