import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { apiClient } from '@/lib/api-client';

import { AddPlayerForm } from '../roster/AddPlayerForm';

import type { RosterMember, RosterResponse } from '../../types/battle';
import type { BattleEntry } from '@angrybirdman/common';

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
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mark player as left mutation
  const markAsLeftMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await apiClient.post(`/api/clans/${clanId}/roster/${playerId}/left`, {
        leftDate: new Date().toISOString().split('T')[0],
      });
      return response.data as unknown;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId, 'active'] });
    },
  });

  // Fetch active roster
  const { data: rosterData } = useQuery<RosterResponse>({
    queryKey: ['roster', clanId, 'active'],
    queryFn: async () => {
      const response = await fetch(`/api/clans/${clanId}/roster?active=true`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch roster');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response.json();
    },
  });

  // Auto-populate non-players from roster
  useEffect(() => {
    if (rosterData && data.playerStats) {
      // Merge existing non-player data with roster to preserve entered data
      const existingNonplayerData = new Map(nonplayers.map((np) => [np.playerId, np]));

      const playedPlayerIds = new Set(data.playerStats.map((p) => p.playerId));
      const nonPlayingMembers = rosterData.players.filter(
        (m: RosterMember) => !playedPlayerIds.has(m.playerId)
      );

      const updatedNonplayers: NonplayerRow[] = nonPlayingMembers.map((m: RosterMember) => {
        const existing = existingNonplayerData.get(m.playerId);
        return (
          existing || {
            playerId: m.playerId,
            name: m.playerName,
            fp: m.fp || 0,
            reserve: false,
          }
        );
      });

      setNonplayers(updatedNonplayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterData, data.playerStats]);

  // Load existing data if available
  useEffect(() => {
    if (
      data.nonplayerStats &&
      data.nonplayerStats.length > 0 &&
      nonplayers.length === 0 &&
      rosterData
    ) {
      const loadedNonplayers: NonplayerRow[] = data.nonplayerStats.map((np) => {
        const rosterMember = rosterData.players.find(
          (m: RosterMember) => m.playerId === np.playerId
        );
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

  const handleMarkAsLeft = async (playerId: number, playerName: string) => {
    const confirmed = window.confirm(
      `Mark ${playerName} as left?\n\nThis will remove them from the active roster and they will no longer appear in this form.`
    );

    if (confirmed) {
      try {
        await markAsLeftMutation.mutateAsync(playerId);
        // Remove from local state immediately
        setNonplayers((prev) => prev.filter((np) => np.playerId !== playerId));
      } catch (_error) {
        alert('Failed to mark player as left. Please try again.');
      }
    }
  };

  const updateNonplayer = (
    index: number,
    field: keyof NonplayerRow,
    value: string | number | boolean
  ) => {
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
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
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
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">FP</th>
                <th className="border px-4 py-2">Reserve</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nonplayers.map((np, index) => (
                <tr key={index} className={np.reserve ? 'bg-orange-50' : 'bg-white'}>
                  <td className="border px-4 py-2">
                    <span className="font-medium">{np.name}</span>
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={np.fp === 0 ? '' : np.fp}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = value === '' ? 0 : parseInt(value, 10);
                        if (!isNaN(parsed) && parsed >= 0) {
                          updateNonplayer(index, 'fp', parsed);
                        }
                      }}
                      placeholder="FP"
                      className="w-24 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={np.reserve}
                      onChange={(e) => updateNonplayer(index, 'reserve', e.target.checked)}
                      className="h-5 w-5"
                    />
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        void handleMarkAsLeft(np.playerId, np.name);
                      }}
                      className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                    >
                      Mark as Left
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 bg-gray-50 py-8 text-center">
          <p className="text-gray-600">All active roster members participated in this battle</p>
          <p className="mt-2 text-sm text-gray-500">
            Non-players are automatically identified from roster members who did not play
          </p>
        </div>
      )}

      {/* Add New Player Button */}
      <div className="my-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsAddPlayerOpen(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          + Add New Player to Roster
        </button>
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
          className="hover:bg-primary-dark bg-primary rounded-md px-6 py-2 text-white transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Add Player Modal */}
      <AddPlayerForm
        clanId={clanId}
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
      />
    </div>
  );
}
