import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BattleEntry } from '@angrybirdman/common';
import type { BattleListResponse } from '../../types/battle';

interface BattleMetadataFormProps {
  clanId: number;
  data: Partial<BattleEntry>;
  onUpdate: (data: Partial<BattleEntry>) => void;
  onNext: () => void;
  onCancel: () => void;
}

export default function BattleMetadataForm({
  clanId,
  data,
  onUpdate,
  onNext,
  onCancel,
}: BattleMetadataFormProps) {
  // Convert dates to string format for form inputs
  const initialStartDate = data.startDate instanceof Date 
    ? data.startDate.toISOString().split('T')[0] 
    : data.startDate || '';
  const initialEndDate = data.endDate instanceof Date 
    ? data.endDate.toISOString().split('T')[0] 
    : data.endDate || '';

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [opponentRovioId, setOpponentRovioId] = useState(
    data.opponentRovioId?.toString() || ''
  );
  const [opponentName, setOpponentName] = useState(data.opponentName || '');
  const [opponentCountry, setOpponentCountry] = useState(data.opponentCountry || '');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Auto-calculate end date (1 day after start)
  useEffect(() => {
    if (startDate && !endDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const endDateStr = end.toISOString().split('T')[0];
      if (endDateStr) {
        setEndDate(endDateStr);
      }
    }
  }, [startDate, endDate]);

  // Check for duplicate battles
  const { data: existingBattles } = useQuery<BattleListResponse>({
    queryKey: ['battles', clanId, { startDate }],
    queryFn: async () => {
      const response = await fetch(
        `/api/clans/${clanId}/battles?startDate=${startDate}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch battles');
      return response.json();
    },
    enabled: !!startDate,
  });

  useEffect(() => {
    if (existingBattles && existingBattles.battles.length > 0) {
      setDuplicateWarning(
        `Warning: A battle already exists for ${startDate}. Creating another will result in duplicate data.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [existingBattles, startDate]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !opponentName) {
      alert('Please fill in all required fields');
      return;
    }

    onUpdate({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      opponentRovioId: opponentRovioId ? parseInt(opponentRovioId, 10) : undefined,
      opponentName,
      opponentCountry: opponentCountry || undefined,
    });
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      {duplicateWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="font-semibold">⚠️ {duplicateWarning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opponent Rovio ID */}
        <div>
          <label htmlFor="opponentRovioId" className="block text-sm font-medium text-gray-700 mb-2">
            Opponent Rovio ID
          </label>
          <input
            type="text"
            id="opponentRovioId"
            value={opponentRovioId}
            onChange={(e) => setOpponentRovioId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., CLAN123"
          />
        </div>

        {/* Opponent Name */}
        <div>
          <label htmlFor="opponentName" className="block text-sm font-medium text-gray-700 mb-2">
            Opponent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="opponentName"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Opponent clan name"
            required
          />
        </div>
      </div>

      {/* Opponent Country */}
      <div>
        <label htmlFor="opponentCountry" className="block text-sm font-medium text-gray-700 mb-2">
          Opponent Country
        </label>
        <input
          type="text"
          id="opponentCountry"
          value={opponentCountry}
          onChange={(e) => setOpponentCountry(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., US, UK, CA"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
