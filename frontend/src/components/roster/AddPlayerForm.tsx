/**
 * AddPlayerForm - Add New Player to Roster (Story 3.3)
 *
 * Modal form for adding a new player to the clan roster.
 * Optimized for quick entry with Enter key submit support.
 *
 * Features:
 * - Player name input (required)
 * - Join date input (defaults to today)
 * - Enter key to submit
 * - Escape key to cancel
 * - Validation and error display
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, type FormEvent, useEffect, useRef } from 'react';

import { apiClient } from '@/lib/api-client';

interface AddPlayerFormProps {
  clanId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AddPlayerRequest {
  playerName: string;
  joinedDate: string;
}

export function AddPlayerForm({ clanId, isOpen, onClose, onSuccess }: AddPlayerFormProps) {
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState('');
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Use startTransition to defer state updates and avoid cascading render warning
      React.startTransition(() => {
        setPlayerName('');
        setJoinedDate(new Date().toISOString().split('T')[0] as string);
        setError(null);
      });
    }
  }, [isOpen]);

  const addPlayerMutation = useMutation({
    mutationFn: async (data: AddPlayerRequest) => {
      const response = await apiClient.post(`/api/clans/${clanId}/roster`, data);
      return response.data as unknown;
    },
    onSuccess: () => {
      // Invalidate all roster queries for this clan (handles both number and string clanId)
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId] });
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
          : 'Failed to add player';
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

    addPlayerMutation.mutate({
      playerName: playerName.trim(),
      joinedDate: joinedDate as string,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

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
        <h2 className="mb-4 text-2xl font-bold text-neutral-900">Add New Player</h2>

        <form onSubmit={handleSubmit}>
          {/* Player Name */}
          <div className="mb-4">
            <label htmlFor="playerName" className="mb-2 block text-sm font-medium text-neutral-700">
              Player Name <span className="text-red-600">*</span>
            </label>
            <input
              ref={nameInputRef}
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
              disabled={addPlayerMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={addPlayerMutation.isPending}
            >
              {addPlayerMutation.isPending ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-neutral-500">
          Tip: Press Enter to submit, Escape to cancel
        </p>
      </div>
    </div>
  );
}
