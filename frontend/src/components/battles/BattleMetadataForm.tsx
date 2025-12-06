import { useState } from 'react';

import BattleSelector from './BattleSelector';

import type { BattleEntry } from '@angrybirdman/common';

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
  const [battleId, setBattleId] = useState(data.battleId || '');
  const [opponentRovioId, setOpponentRovioId] = useState(data.opponentRovioId?.toString() || '');
  const [opponentName, setOpponentName] = useState(data.opponentName || '');
  const [opponentCountry, setOpponentCountry] = useState(data.opponentCountry || '');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!battleId || !opponentName) {
      alert('Please fill in all required fields');
      return;
    }

    onUpdate({
      battleId,
      opponentRovioId: opponentRovioId ? parseInt(opponentRovioId, 10) : undefined,
      opponentName,
      opponentCountry: opponentCountry || undefined,
    });
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {/* Battle Selector - replaces date inputs */}
      <BattleSelector value={battleId} onChange={setBattleId} clanId={clanId} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Opponent Rovio ID */}
        <div>
          <label htmlFor="opponentRovioId" className="mb-2 block text-sm font-medium text-gray-700">
            Opponent Rovio ID
          </label>
          <input
            type="text"
            id="opponentRovioId"
            value={opponentRovioId}
            onChange={(e) => setOpponentRovioId(e.target.value)}
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
            placeholder="e.g., CLAN123"
          />
        </div>

        {/* Opponent Name */}
        <div>
          <label htmlFor="opponentName" className="mb-2 block text-sm font-medium text-gray-700">
            Opponent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="opponentName"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
            placeholder="Opponent clan name"
            required
          />
        </div>
      </div>

      {/* Opponent Country */}
      <div>
        <label htmlFor="opponentCountry" className="mb-2 block text-sm font-medium text-gray-700">
          Opponent Country
        </label>
        <input
          type="text"
          id="opponentCountry"
          value={opponentCountry}
          onChange={(e) => setOpponentCountry(e.target.value)}
          className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
          placeholder="e.g., US, UK, CA"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="hover:bg-primary-dark bg-primary rounded-md px-6 py-2 text-white transition-colors"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
