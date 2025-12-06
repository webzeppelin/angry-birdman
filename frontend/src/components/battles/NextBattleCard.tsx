/**
 * NextBattleCard Component
 *
 * Displays information about the next scheduled battle including:
 * - Battle ID
 * - Start/End dates (in user's timezone)
 * - Countdown timer
 *
 * Used in dashboard and clan pages to show upcoming battle info.
 */

import { CalendarIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { getBattleScheduleInfo } from '../../api/masterBattles';
import { formatForUserTimezone, getTimeRemaining } from '../../utils/timezone';

import type { BattleScheduleInfo } from '@angrybirdman/common';

export default function NextBattleCard() {
  const [, setTick] = useState(0);

  // Fetch battle schedule info
  const { data, isLoading, error } = useQuery<BattleScheduleInfo>({
    queryKey: ['battle-schedule-info'],
    queryFn: getBattleScheduleInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // Update every minute

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="shadow-card animate-pulse rounded-lg bg-white p-6">
        <div className="mb-2 h-5 w-32 rounded bg-neutral-200"></div>
        <div className="mb-1 h-8 w-24 rounded bg-neutral-200"></div>
        <div className="h-4 w-20 rounded bg-neutral-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shadow-card rounded-lg bg-white p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
          <CalendarIcon className="text-error h-5 w-5" />
          Next Battle
        </div>
        <div className="text-error text-sm">Failed to load schedule</div>
      </div>
    );
  }

  const nextBattle = data?.nextBattle;

  if (!nextBattle) {
    return (
      <div className="shadow-card rounded-lg bg-white p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
          <CalendarIcon className="text-warning h-5 w-5" />
          Next Battle
        </div>
        <div className="mb-1 text-3xl font-bold text-neutral-400">TBD</div>
        <div className="text-sm text-neutral-500">No battles scheduled yet</div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(nextBattle.startTimestamp);
  const hasStarted = timeRemaining.total <= 0;

  const startDate = formatForUserTimezone(nextBattle.startTimestamp, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="shadow-card rounded-lg bg-white p-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
        <CalendarIcon className={hasStarted ? 'text-success h-5 w-5' : 'text-info h-5 w-5'} />
        {hasStarted ? 'Current Battle' : 'Next Battle'}
      </div>

      {/* Battle ID */}
      <div className={`mb-1 text-3xl font-bold ${hasStarted ? 'text-success' : 'text-info'}`}>
        {nextBattle.battleId}
      </div>

      {/* Start Date */}
      <div className="mb-2 text-sm text-neutral-600">{startDate}</div>

      {/* Countdown or Status */}
      {hasStarted ? (
        <div className="bg-success/10 text-success inline-block rounded px-2 py-1 text-xs font-medium">
          ⚔️ Battle In Progress
        </div>
      ) : (
        <div className="text-sm text-neutral-500">
          {timeRemaining.days > 0 && (
            <span>
              {timeRemaining.days} day{timeRemaining.days !== 1 ? 's' : ''},{' '}
            </span>
          )}
          {timeRemaining.hours} hr{timeRemaining.hours !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
