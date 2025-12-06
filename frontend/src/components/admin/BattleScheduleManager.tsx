/**
 * BattleScheduleManager Component
 *
 * Superadmin interface for managing the Master Battle schedule.
 *
 * Features:
 * - View next battle start date (in EST)
 * - Edit next battle start date
 * - View master battle list
 * - Manually create master battles (for corrections)
 */

import { formatInEst, formatForUserTimezone } from '@angrybirdman/common';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  getAllMasterBattles,
  getNextBattleDate,
  updateNextBattleDate,
  createMasterBattle,
  type MasterBattleListResponse,
} from '../../api/masterBattles';

import type {
  MasterBattle,
  UpdateNextBattleDateInput,
  CreateMasterBattleInput,
} from '@angrybirdman/common';

export default function BattleScheduleManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingNextDate, setEditingNextDate] = useState(false);
  const [nextDateInput, setNextDateInput] = useState('');
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [newBattleDate, setNewBattleDate] = useState('');
  const [newBattleNotes, setNewBattleNotes] = useState('');

  // Fetch next battle date
  const {
    data: nextDateData,
    isLoading: nextDateLoading,
    error: nextDateError,
  } = useQuery({
    queryKey: ['next-battle-date'],
    queryFn: getNextBattleDate,
  });

  // Fetch master battles list
  const {
    data: battlesData,
    isLoading: battlesLoading,
    error: battlesError,
  } = useQuery<MasterBattleListResponse>({
    queryKey: ['master-battles', page],
    queryFn: () => getAllMasterBattles({ page, limit: 20, sortOrder: 'desc' }),
  });

  // Update next battle date mutation
  const updateDateMutation = useMutation({
    mutationFn: (data: UpdateNextBattleDateInput) => updateNextBattleDate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['next-battle-date'] });
      void queryClient.invalidateQueries({ queryKey: ['battle-schedule-info'] });
      setEditingNextDate(false);
      setNextDateInput('');
      alert('Next battle date updated successfully!');
    },
    onError: (error: Error) => {
      alert(`Failed to update next battle date: ${error.message}`);
    },
  });

  // Create battle mutation
  const createBattleMutation = useMutation({
    mutationFn: (data: CreateMasterBattleInput) => createMasterBattle(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-battles'] });
      void queryClient.invalidateQueries({ queryKey: ['available-battles'] });
      void queryClient.invalidateQueries({ queryKey: ['battle-schedule-info'] });
      setCreatingBattle(false);
      setNewBattleDate('');
      setNewBattleNotes('');
      alert('Battle created successfully!');
    },
    onError: (error: Error) => {
      alert(`Failed to create battle: ${error.message}`);
    },
  });

  const handleUpdateNextDate = () => {
    if (!nextDateInput) {
      alert('Please enter a date');
      return;
    }

    updateDateMutation.mutate({
      nextBattleStartDate: new Date(nextDateInput).toISOString(),
    });
  };

  const handleCreateBattle = () => {
    if (!newBattleDate) {
      alert('Please enter a start date');
      return;
    }

    createBattleMutation.mutate({
      startDate: new Date(newBattleDate),
      notes: newBattleNotes || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Battle Schedule Manager</h1>
        <p className="mt-2 text-gray-600">
          Manage the centralized Master Battle schedule. All times shown in Official Angry Birds
          Time (EST).
        </p>
      </div>

      {/* Next Battle Date Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary h-6 w-6" />
            <h2 className="text-xl font-semibold text-gray-900">Next Battle Auto-Generation</h2>
          </div>
          {!editingNextDate && (
            <button
              onClick={() => {
                setEditingNextDate(true);
                if (nextDateData?.nextBattleStartDate) {
                  // Convert to local datetime-local format
                  const date = new Date(nextDateData.nextBattleStartDate);
                  const localDateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                  setNextDateInput(localDateStr);
                }
              }}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {nextDateLoading && <p className="text-gray-500">Loading...</p>}

        {nextDateError && (
          <p className="text-sm text-red-600">
            Error loading next battle date:{' '}
            {nextDateError instanceof Error ? nextDateError.message : 'Unknown error'}
          </p>
        )}

        {nextDateData && !editingNextDate && (
          <div>
            <p className="text-sm text-gray-600">
              The scheduler will automatically create the next battle at:
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatInEst(nextDateData.nextBattleStartDate)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              (Your timezone: {formatForUserTimezone(nextDateData.nextBattleStartDate)})
            </p>
          </div>
        )}

        {editingNextDate && (
          <div className="space-y-4">
            <div>
              <label htmlFor="nextDate" className="block text-sm font-medium text-gray-700">
                Next Battle Start Date (EST) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="nextDate"
                value={nextDateInput}
                onChange={(e) => {
                  setNextDateInput(e.target.value);
                }}
                className="focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the date and time when the next battle should start (in Official Angry Birds
                Time - EST)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpdateNextDate}
                disabled={updateDateMutation.isPending}
                className="bg-primary hover:bg-primary-dark rounded-md px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateDateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingNextDate(false);
                  setNextDateInput('');
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Battle Creation Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusIcon className="text-success h-6 w-6" />
            <h2 className="text-xl font-semibold text-gray-900">Manual Battle Creation</h2>
          </div>
          {!creatingBattle && (
            <button
              onClick={() => {
                setCreatingBattle(true);
              }}
              className="text-success hover:text-success-dark text-sm font-medium"
            >
              Create Battle
            </button>
          )}
        </div>

        {!creatingBattle && (
          <p className="text-sm text-gray-600">
            Manually create a battle entry for schedule corrections or historical data.
          </p>
        )}

        {creatingBattle && (
          <div className="space-y-4">
            <div>
              <label htmlFor="newBattleDate" className="block text-sm font-medium text-gray-700">
                Battle Start Date (EST) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="newBattleDate"
                value={newBattleDate}
                onChange={(e) => {
                  setNewBattleDate(e.target.value);
                }}
                className="focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="newBattleNotes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="newBattleNotes"
                value={newBattleNotes}
                onChange={(e) => {
                  setNewBattleNotes(e.target.value);
                }}
                rows={3}
                className="focus:ring-primary mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="e.g., Historical data correction, schedule change due to..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateBattle}
                disabled={createBattleMutation.isPending}
                className="bg-success hover:bg-success-dark rounded-md px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createBattleMutation.isPending ? 'Creating...' : 'Create Battle'}
              </button>
              <button
                onClick={() => {
                  setCreatingBattle(false);
                  setNewBattleDate('');
                  setNewBattleNotes('');
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Master Battles List */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Master Battle Schedule</h2>

        {battlesLoading && <p className="text-gray-500">Loading battles...</p>}

        {battlesError && (
          <p className="text-sm text-red-600">
            Error loading battles:{' '}
            {battlesError instanceof Error ? battlesError.message : 'Unknown error'}
          </p>
        )}

        {battlesData && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Battle ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Start (EST)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      End (EST)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {battlesData.battles.map((battle: MasterBattle) => (
                    <tr key={battle.battleId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-gray-900">
                        {battle.battleId}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatInEst(battle.startTimestamp, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatInEst(battle.endTimestamp, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {battle.createdBy || (
                          <span className="text-gray-400 italic">Automatic</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {battle.notes || <span className="text-gray-400 italic">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {battlesData.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="text-gray-700">
                  Page {page} of {battlesData.totalPages}
                </span>
                <button
                  onClick={() => {
                    setPage((p) => Math.min(battlesData.totalPages, p + 1));
                  }}
                  disabled={page >= battlesData.totalPages}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
