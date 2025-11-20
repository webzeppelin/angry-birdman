import { useState } from 'react';

import type { BattleEntry } from '@angrybirdman/common';

interface PerformanceDataFormProps {
  data: Partial<BattleEntry>;
  onUpdate: (data: Partial<BattleEntry>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function PerformanceDataForm({
  data,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: PerformanceDataFormProps) {
  const [score, setScore] = useState(data.score?.toString() || '');
  const [baselineFp, setBaselineFp] = useState(data.baselineFp?.toString() || '');
  const [opponentScore, setOpponentScore] = useState(data.opponentScore?.toString() || '');
  const [opponentFp, setOpponentFp] = useState(data.opponentFp?.toString() || '');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!score || !baselineFp || !opponentScore || !opponentFp) {
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

    // Note: result is calculated on the backend, not stored in form data

    onUpdate({
      score: scoreNum,
      baselineFp: baselineFpNum,
      opponentScore: opponentScoreNum,
      opponentFp: opponentFpNum,
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
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">Battle Result</h3>
        <p className="text-2xl font-bold text-blue-700">{resultText}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Our Score */}
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
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
            required
          />
        </div>

        {/* Opponent Score */}
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
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Baseline FP */}
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
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Total FP of all clan members at battle start</p>
        </div>

        {/* Opponent FP */}
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
            className="focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
            required
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <div className="space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark rounded-md px-6 py-2 text-white transition-colors"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
