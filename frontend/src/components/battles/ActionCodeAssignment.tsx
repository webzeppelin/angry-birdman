import { useState, useEffect } from 'react';
import type { BattleEntry } from '@angrybirdman/common';

interface ActionCodeAssignmentProps {
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
  data,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: ActionCodeAssignmentProps) {
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [nonplayerActions, setNonplayerActions] = useState<PlayerAction[]>([]);
  const [bulkActionCode, setBulkActionCode] = useState('HOLD');

  // Initialize from existing data
  useEffect(() => {
    if (data.playerStats && playerActions.length === 0) {
      const actions: PlayerAction[] = data.playerStats.map((p) => ({
        playerId: p.playerId,
        actionCode: p.actionCode || 'HOLD',
        actionReason: p.actionReason,
      }));
      setPlayerActions(actions);
    }
  }, [data.playerStats, playerActions.length]);

  useEffect(() => {
    if (data.nonplayerStats && nonplayerActions.length === 0) {
      const actions: PlayerAction[] = data.nonplayerStats.map((np) => ({
        playerId: np.playerId,
        actionCode: np.actionCode || 'HOLD',
        actionReason: np.actionReason,
      }));
      setNonplayerActions(actions);
    }
  }, [data.nonplayerStats, nonplayerActions.length]);

  const updateAction = (
    playerId: number,
    field: 'actionCode' | 'actionReason',
    value: string,
    isPlayer: boolean
  ) => {
    const list = isPlayer ? playerActions : nonplayerActions;
    const setList = isPlayer ? setPlayerActions : setNonplayerActions;

    const updated = list.map((a) =>
      a.playerId === playerId ? { ...a, [field]: value } : a
    );
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Players ({playerActions.length})</h3>
          <div className="flex items-center space-x-2">
            <select
              value={bulkActionCode}
              onChange={(e) => setBulkActionCode(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded"
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
              className="px-4 py-1 bg-secondary text-white rounded hover:bg-secondary-dark"
            >
              Apply to All Players
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Player ID</th>
                <th className="px-4 py-2 border">Action Code</th>
                <th className="px-4 py-2 border">Reason (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {playerActions.map((action) => (
                <tr key={action.playerId}>
                  <td className="px-4 py-2 border">{action.playerId}</td>
                  <td className="px-4 py-2 border">
                    <select
                      value={action.actionCode}
                      onChange={(e) =>
                        updateAction(action.playerId, 'actionCode', e.target.value, true)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      {ACTION_CODES.map((ac) => (
                        <option key={ac.code} value={ac.code} title={ac.description}>
                          {ac.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={action.actionReason || ''}
                      onChange={(e) =>
                        updateAction(action.playerId, 'actionReason', e.target.value, true)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Non-Players ({nonplayerActions.length})</h3>
            <button
              type="button"
              onClick={() => applyBulkAction(false)}
              className="px-4 py-1 bg-secondary text-white rounded hover:bg-secondary-dark"
            >
              Apply to All Non-Players
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Player ID</th>
                  <th className="px-4 py-2 border">Action Code</th>
                  <th className="px-4 py-2 border">Reason (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {nonplayerActions.map((action) => (
                  <tr key={action.playerId}>
                    <td className="px-4 py-2 border">{action.playerId}</td>
                    <td className="px-4 py-2 border">
                      <select
                        value={action.actionCode}
                        onChange={(e) =>
                          updateAction(action.playerId, 'actionCode', e.target.value, false)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        {ACTION_CODES.map((ac) => (
                          <option key={ac.code} value={ac.code} title={ac.description}>
                            {ac.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        value={action.actionReason || ''}
                        onChange={(e) =>
                          updateAction(action.playerId, 'actionReason', e.target.value, false)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
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
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <h4 className="font-semibold mb-2">Action Code Reference</h4>
        <ul className="space-y-1">
          {ACTION_CODES.map((ac) => (
            <li key={ac.code}>
              <strong>{ac.label} ({ac.code}):</strong> {ac.description}
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
