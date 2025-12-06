/**
 * BattleSelector Component
 *
 * Dropdown component for selecting a battle from the Master Battle schedule.
 * Used in battle entry forms to select which battle to record data for.
 *
 * Features:
 * - Loads available battles from API
 * - Displays Battle ID (YYYYMMDD) and dates in user's local timezone
 * - Defaults to most recent available battle
 * - Sorted with most recent first
 * - Shows warning if clan already has data for selected battle
 * - Only shows started battles (no future battles)
 */

import { formatForUserTimezone } from '@angrybirdman/common';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getAvailableBattles } from '../../api/masterBattles';

import type { BattleListResponse } from '../../types/battle';
import type { MasterBattle } from '@angrybirdman/common';

interface BattleSelectorProps {
  /** Current selected battle ID */
  value: string;
  /** Callback when battle selection changes */
  onChange: (battleId: string) => void;
  /** Clan ID to check for existing battles */
  clanId: number;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
}

export default function BattleSelector({
  value,
  onChange,
  clanId,
  error,
  disabled = false,
}: BattleSelectorProps) {
  // Fetch available battles from Master Battle schedule
  const {
    data: availableBattles,
    isLoading: battlesLoading,
    error: battlesError,
  } = useQuery<MasterBattle[]>({
    queryKey: ['available-battles'],
    queryFn: getAvailableBattles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing clan battles to check for duplicates
  const { data: existingBattles } = useQuery<BattleListResponse>({
    queryKey: ['battles', clanId],
    queryFn: async (): Promise<BattleListResponse> => {
      const response = await fetch(`/api/clans/${clanId}/battles?limit=100`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch battles');
      return response.json() as Promise<BattleListResponse>;
    },
    enabled: !!clanId,
  });

  // Set default to most recent available battle when data loads
  useEffect(() => {
    if (availableBattles && availableBattles.length > 0 && !value && availableBattles[0]) {
      // Battles are already sorted with most recent first from API
      onChange(availableBattles[0].battleId);
    }
  }, [availableBattles, value, onChange]);

  // Check if selected battle already has data
  const selectedBattleExists = existingBattles?.battles.some((b) => b.battleId === value) ?? false;

  if (battlesLoading) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Battle</label>
        <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500">
          Loading battles...
        </div>
      </div>
    );
  }

  if (battlesError) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Battle</label>
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
          Error loading battles:{' '}
          {battlesError instanceof Error ? battlesError.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!availableBattles || availableBattles.length === 0) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Battle</label>
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          No battles available. Contact your superadmin to set up the battle schedule.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor="battleId" className="block text-sm font-medium text-gray-700">
        Battle <span className="text-red-500">*</span>
      </label>

      <select
        id="battleId"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'focus:border-primary focus:ring-primary border-gray-300'
        } ${disabled ? 'cursor-not-allowed bg-gray-100' : 'bg-white'}`}
      >
        {availableBattles.map((battle) => {
          const startDate = formatForUserTimezone(battle.startTimestamp, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: undefined,
            minute: undefined,
            timeZoneName: undefined,
          });

          const endDate = formatForUserTimezone(battle.endTimestamp, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: undefined,
            minute: undefined,
            timeZoneName: undefined,
          });

          const isRecorded = existingBattles?.battles.some((b) => b.battleId === battle.battleId);

          return (
            <option key={battle.battleId} value={battle.battleId}>
              {battle.battleId} - {startDate} to {endDate}
              {isRecorded ? ' (Already Recorded)' : ''}
            </option>
          );
        })}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedBattleExists && !error && (
        <p className="text-sm text-yellow-600">
          ⚠️ Warning: You already have data recorded for this battle. Creating another entry will
          result in duplicate data.
        </p>
      )}

      <p className="text-sm text-gray-500">
        Select the battle you want to record data for. Dates shown in your local timezone.
      </p>
    </div>
  );
}
