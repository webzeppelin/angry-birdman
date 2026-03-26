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
  const [score, setScore] = useState(data.score?.toString() || '');
  const [opponentScore, setOpponentScore] = useState(data.opponentScore?.toString() || '');
  const [baselineFp, setBaselineFp] = useState(data.baselineFp?.toString() || '');
  const [opponentName, setOpponentName] = useState(data.opponentName || '');
  const [opponentFp, setOpponentFp] = useState(data.opponentFp?.toString() || '');
  const [opponentCountry, setOpponentCountry] = useState(data.opponentCountry || '');
  const [opponentRovioId, setOpponentRovioId] = useState(data.opponentRovioId?.toString() || '');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!battleId || !score || !opponentScore || !baselineFp || !opponentName || !opponentFp) {
      alert('Please fill in all required fields');
      return;
    }

    const scoreNum = parseInt(score, 10);
    const baselineFpNum = parseInt(baselineFp, 10);
    const opponentScoreNum = parseInt(opponentScore, 10);
    const opponentFpNum = parseInt(opponentFp, 10);

    if (scoreNum < 0 || baselineFpNum <= 0 || opponentScoreNum < 0 || opponentFpNum <= 0) {
      alert('Scores must be non-negative and FP values must be positive');
      return;
    }

    onUpdate({
      battleId,
      score: scoreNum,
      baselineFp: baselineFpNum,
      opponentScore: opponentScoreNum,
      opponentFp: opponentFpNum,
      opponentName,
      opponentCountry: opponentCountry || undefined,
      opponentRovioId: opponentRovioId ? parseInt(opponentRovioId, 10) : undefined,
    });
    onNext();
  };

  const resultText = (() => {
    if (!score || !opponentScore) return 'Enter scores to see result';
    const scoreNum = parseInt(score, 10);
    const opponentScoreNum = parseInt(opponentScore, 10);
    if (scoreNum > opponentScoreNum) return '✅ Win';
    if (scoreNum < opponentScoreNum) return '❌ Loss';
    return '🤝 Tie';
  })();

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {/* Battle Selector */}
      <BattleSelector value={battleId} onChange={setBattleId} clanId={clanId} />

      {/* Scores */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="score" className="mb-2 block text-sm font-medium text-gray-700">
            Our Score <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            min="0"
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="opponentScore" className="mb-2 block text-sm font-medium text-gray-700">
            Opponent Score <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="opponentScore"
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            min="0"
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Battle Result */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-1 font-semibold text-blue-900">Battle Result</h3>
        <p className="text-2xl font-bold text-blue-700">{resultText}</p>
      </div>

      {/* Our Clan and Opponent Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Our Clan */}
        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800">Our Clan</h3>

          <div>
            <label htmlFor="baselineFp" className="mb-2 block text-sm font-medium text-gray-700">
              Baseline FP <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="baselineFp"
              value={baselineFp}
              onChange={(e) => setBaselineFp(e.target.value)}
              min="1"
              className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Total FP of all clan members at battle start
            </p>
          </div>
        </div>

        {/* Opponent */}
        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800">Opponent</h3>

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

          <div>
            <label
              htmlFor="opponentRovioId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
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

          <div>
            <label htmlFor="opponentFp" className="mb-2 block text-sm font-medium text-gray-700">
              Opponent FP <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="opponentFp"
              value={opponentFp}
              onChange={(e) => setOpponentFp(e.target.value)}
              min="1"
              className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="opponentCountry"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
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
        </div>
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
