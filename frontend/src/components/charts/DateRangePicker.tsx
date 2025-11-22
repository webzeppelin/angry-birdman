/**
 * DateRangePicker Component
 * Reusable component for selecting date ranges with preset options
 */

import { generateBattleId } from '@angrybirdman/common';
import { useState, useEffect } from 'react';

import type React from 'react';

interface DateRangePickerProps {
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
  className?: string;
}

interface PresetOption {
  label: string;
  daysBack: number | null; // null means "all time"
}

const presets: PresetOption[] = [
  { label: 'Last 30 Days', daysBack: 30 },
  { label: 'Last 90 Days', daysBack: 90 },
  { label: 'Last 6 Months', daysBack: 180 },
  { label: 'Last Year', daysBack: 365 },
  { label: 'All Time', daysBack: null },
];

export function DateRangePicker({ onDateRangeChange, className = '' }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number>(1); // Default: Last 90 Days

  // Apply preset on mount
  useEffect(() => {
    applyPreset(1); // Last 90 Days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (index: number) => {
    setSelectedPreset(index);
    const preset = presets[index];

    if (!preset) return;

    if (preset.daysBack === null) {
      // All time - clear filters
      setStartDate('');
      setEndDate('');
      onDateRangeChange(undefined, undefined);
    } else {
      // Calculate date range
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - preset.daysBack);

      const startBattleId = generateBattleId(start);
      const endBattleId = generateBattleId(today);

      setStartDate(startBattleId);
      setEndDate(endBattleId);
      onDateRangeChange(startBattleId, endBattleId);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    setSelectedPreset(-1); // Deselect preset
    onDateRangeChange(value || undefined, endDate || undefined);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    setSelectedPreset(-1); // Deselect preset
    onDateRangeChange(startDate || undefined, value || undefined);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPreset(-1);
    onDateRangeChange(undefined, undefined);
  };

  const hasActiveFilters = startDate !== '' || endDate !== '';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset Buttons */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Quick Filters</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyPreset(index)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                selectedPreset === index
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate ? convertBattleIdToDateInput(startDate) : ''}
            onChange={handleStartDateChange}
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate ? convertBattleIdToDateInput(endDate) : ''}
            onChange={handleEndDateChange}
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Convert battle ID (YYYYMMDD) to date input format (YYYY-MM-DD)
 */
function convertBattleIdToDateInput(battleId: string): string {
  if (battleId.length !== 8) return '';
  const year = battleId.substring(0, 4);
  const month = battleId.substring(4, 6);
  const day = battleId.substring(6, 8);
  return `${year}-${month}-${day}`;
}
