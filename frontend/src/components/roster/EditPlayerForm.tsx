/**
 * EditPlayerForm - Edit Player Information (Story 3.4)
 *
 * Modal form for editing existing player information.
 * Allows updating player name and joined date.
 *
 * Features:
 * - Pre-populated with current player data
 * - Name and join date editing
 * - Submit/Cancel buttons
 * - Validation and error display
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, useEffect } from 'react';

import { apiClient } from '@/lib/api-client';

interface EditPlayerFormProps {
  clanId: number;
  player: {
    playerId: number;
    playerName: string;
    joinedDate: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UpdatePlayerRequest {
  playerName?: string;
  joinedDate?: string;
}

export function EditPlayerForm({
  clanId,
  player,
  isOpen,
  onClose,
  onSuccess,
}: EditPlayerFormProps) {
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate form when player changes
  useEffect(() => {
    if (player) {
      setPlayerName(player.playerName);
      // Extract date part from ISO timestamp
      const datePart = player.joinedDate.split('T')[0];
      setJoinedDate(datePart as string);
    }
  }, [player]);

  // Reset error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: UpdatePlayerRequest) => {
      const response = await apiClient.put(`/api/clans/${clanId}/roster/${player?.playerId}`, data);
      return response.data as unknown;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roster', String(clanId)] });
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String(err.response.data.message)
          : 'Failed to update player';
      setError(message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    if (!player) return;

    // Only send changed fields
    const updates: UpdatePlayerRequest = {};
    if (playerName.trim() !== player.playerName) {
      updates.playerName = playerName.trim();
    }
    const originalDate = player.joinedDate.split('T')[0];
    if (joinedDate !== originalDate) {
      updates.joinedDate = joinedDate;
    }

    if (Object.keys(updates).length === 0) {
      setError('No changes to save');
      return;
    }

    updatePlayerMutation.mutate(updates);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !player) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="mb-4 text-2xl font-bold text-neutral-900">Edit Player</h2>

        <form onSubmit={handleSubmit}>
          {/* Player Name */}
          <div className="mb-4">
            <label htmlFor="playerName" className="mb-2 block text-sm font-medium text-neutral-700">
              Player Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter player name"
              maxLength={100}
              required
            />
          </div>

          {/* Joined Date */}
          <div className="mb-6">
            <label htmlFor="joinedDate" className="mb-2 block text-sm font-medium text-neutral-700">
              Joined Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              id="joinedDate"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          {/* Error Message */}
          {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
              disabled={updatePlayerMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={updatePlayerMutation.isPending}
            >
              {updatePlayerMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-neutral-500">Tip: Press Escape to cancel</p>
      </div>
    </div>
  );
}
