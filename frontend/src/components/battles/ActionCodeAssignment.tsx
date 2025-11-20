import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import type { RosterMember, RosterResponse } from '../../types/battle';
import type { BattleEntry } from '@angrybirdman/common';

interface ActionCodeAssignmentProps {
  clanId: number;
  data: Partial<BattleEntry>;
  onUpdate: (data: Partial<BattleEntry>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface PlayerAction {
  playerId: number;
  playerName?: string; // For display only
  actionCode: string;
  actionReason?: string;
}

const ACTION_CODES = [
  { code: 'HOLD', label: 'Hold', description: 'Keep on roster' },
  { code: 'WARN', label: 'Warn', description: 'Warning for performance' },
  { code: 'KICK', label: 'Kick', description: 'Remove from clan' },
  { code: 'RESERVE', label: 'Reserve', description: 'Move to reserves' },
  { code: 'PASS', label: 'Pass', description: 'No action needed' },
];

export default function ActionCodeAssignment({
  clanId,
  data,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: ActionCodeAssignmentProps) {
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [nonplayerActions, setNonplayerActions] = useState<PlayerAction[]>([]);
  const [bulkActionCode, setBulkActionCode] = useState('HOLD');

  // Fetch active roster to get player names
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

  // Initialize from existing data
  useEffect(() => {
    if (data.playerStats && rosterData && playerActions.length === 0) {
      const actions: PlayerAction[] = data.playerStats.map((p) => {
        const rosterMember = rosterData.players.find(
          (m: RosterMember) => m.playerId === p.playerId
        );
        return {
          playerId: p.playerId,
          playerName: rosterMember?.playerName || `Player ${p.playerId}`,
          actionCode: p.actionCode || 'HOLD',
          actionReason: p.actionReason,
        };
      });
      setPlayerActions(actions);
    }
  }, [data.playerStats, rosterData, playerActions.length]);

  useEffect(() => {
    if (data.nonplayerStats && rosterData && nonplayerActions.length === 0) {
      const actions: PlayerAction[] = data.nonplayerStats.map((np) => {
        const rosterMember = rosterData.players.find(
          (m: RosterMember) => m.playerId === np.playerId
        );
        return {
          playerId: np.playerId,
          playerName: rosterMember?.playerName || `Player ${np.playerId}`,
          actionCode: np.actionCode || 'HOLD',
          actionReason: np.actionReason,
        };
      });
      setNonplayerActions(actions);
    }
  }, [data.nonplayerStats, rosterData, nonplayerActions.length]);

  const updateAction = (
    playerId: number,
    field: 'actionCode' | 'actionReason',
    value: string,
    isPlayer: boolean
  ) => {
    const list = isPlayer ? playerActions : nonplayerActions;
    const setList = isPlayer ? setPlayerActions : setNonplayerActions;

    const updated = list.map((a) => (a.playerId === playerId ? { ...a, [field]: value } : a));
    setList(updated);
  };

  const applyBulkAction = (isPlayer: boolean) => {
    const list = isPlayer ? playerActions : nonplayerActions;
    const setList = isPlayer ? setPlayerActions : setNonplayerActions;

    const updated = list.map((a) => ({ ...a, actionCode: bulkActionCode }));
    setList(updated);
  };

  const handleNext = () => {
    // Validate that all players have action codes
    const missingActions = playerActions.filter((a) => !a.actionCode);
    if (missingActions.length > 0) {
      alert('All players must have an action code assigned');
      return;
    }

    // Update battle data with action codes
    const updatedPlayerStats = data.playerStats?.map((p) => {
      const action = playerActions.find((a) => a.playerId === p.playerId);
      return {
        ...p,
        actionCode: action?.actionCode || 'HOLD',
        actionReason: action?.actionReason,
      };
    });

    const updatedNonplayerStats = data.nonplayerStats?.map((np) => {
      const action = nonplayerActions.find((a) => a.playerId === np.playerId);
      return {
        ...np,
        actionCode: action?.actionCode || 'HOLD',
        actionReason: action?.actionReason,
      };
    });

    onUpdate({
      playerStats: updatedPlayerStats,
      nonplayerStats: updatedNonplayerStats,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Players */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Players ({playerActions.length})</h3>
          <div className="flex items-center space-x-2">
            <select
              value={bulkActionCode}
              onChange={(e) => setBulkActionCode(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1"
            >
              {ACTION_CODES.map((ac) => (
                <option key={ac.code} value={ac.code}>
                  {ac.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applyBulkAction(true)}
              className="bg-secondary hover:bg-secondary-dark rounded px-4 py-1 text-white"
            >
              Apply to All Players
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Player</th>
                <th className="border px-4 py-2">Action Code</th>
                <th className="border px-4 py-2">Reason (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {playerActions.map((action) => (
                <tr key={action.playerId}>
                  <td className="border px-4 py-2">
                    <span className="font-medium">
                      {action.playerName || `Player ${action.playerId}`}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <select
                      value={action.actionCode}
                      onChange={(e) =>
                        updateAction(action.playerId, 'actionCode', e.target.value, true)
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    >
                      {ACTION_CODES.map((ac) => (
                        <option key={ac.code} value={ac.code} title={ac.description}>
                          {ac.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={action.actionReason || ''}
                      onChange={(e) =>
                        updateAction(action.playerId, 'actionReason', e.target.value, true)
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1"
                      placeholder="Optional reason"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Players */}
      {nonplayerActions.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Non-Players ({nonplayerActions.length})</h3>
            <button
              type="button"
              onClick={() => applyBulkAction(false)}
              className="bg-secondary hover:bg-secondary-dark rounded px-4 py-1 text-white"
            >
              Apply to All Non-Players
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Player</th>
                  <th className="border px-4 py-2">Action Code</th>
                  <th className="border px-4 py-2">Reason (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {nonplayerActions.map((action) => (
                  <tr key={action.playerId}>
                    <td className="border px-4 py-2">
                      <span className="font-medium">
                        {action.playerName || `Player ${action.playerId}`}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      <select
                        value={action.actionCode}
                        onChange={(e) =>
                          updateAction(action.playerId, 'actionCode', e.target.value, false)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1"
                      >
                        {ACTION_CODES.map((ac) => (
                          <option key={ac.code} value={ac.code} title={ac.description}>
                            {ac.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        value={action.actionReason || ''}
                        onChange={(e) =>
                          updateAction(action.playerId, 'actionReason', e.target.value, false)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        placeholder="Optional reason"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Code Legend */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold">Action Code Reference</h4>
        <ul className="space-y-1">
          {ACTION_CODES.map((ac) => (
            <li key={ac.code}>
              <strong>
                {ac.label} ({ac.code}):
              </strong>{' '}
              {ac.description}
            </li>
          ))}
        </ul>
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
