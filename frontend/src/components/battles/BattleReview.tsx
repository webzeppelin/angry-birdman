import type { BattleEntry } from '@angrybirdman/common';
import { formatDateISO } from '@angrybirdman/common';

interface BattleReviewProps {
  data: Partial<BattleEntry>;
  onJumpToStep: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function BattleReview({
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  onCancel,
  isSubmitting,
}: BattleReviewProps) {
  const result =
    data.score && data.opponentScore
      ? data.score > data.opponentScore
        ? 'Win ✅'
        : data.score < data.opponentScore
        ? 'Loss ❌'
        : 'Tie 🤝'
      : 'Unknown';

  const totalPlayerFp = data.playerStats?.reduce((sum, p) => sum + p.fp, 0) || 0;
  const totalNonplayerFp = data.nonplayerStats?.reduce((sum, np) => sum + np.fp, 0) || 0;
  const totalFp = totalPlayerFp + totalNonplayerFp;

  return (
    <div className="space-y-6">
      {/* Battle Metadata */}
      <div className="bg-white border border-gray-300 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Battle Information</h3>
          <button
            type="button"
            onClick={() => onJumpToStep(1)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">Start Date</dt>
            <dd className="font-medium">
              {data.startDate ? formatDateISO(new Date(data.startDate)) : 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">End Date</dt>
            <dd className="font-medium">
              {data.endDate ? formatDateISO(new Date(data.endDate)) : 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Opponent</dt>
            <dd className="font-medium">{data.opponentName || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Opponent Country</dt>
            <dd className="font-medium">{data.opponentCountry || 'Not set'}</dd>
          </div>
          {data.opponentRovioId && (
            <div>
              <dt className="text-sm text-gray-600">Opponent Rovio ID</dt>
              <dd className="font-medium">{data.opponentRovioId}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Performance Data */}
      <div className="bg-white border border-gray-300 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Performance</h3>
          <button
            type="button"
            onClick={() => onJumpToStep(2)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-gray-600">Result</p>
            <p className="text-2xl font-bold">{result}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total FP</p>
            <p className="text-2xl font-bold">{totalFp}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Our Score</p>
            <p className="text-xl font-semibold">{data.score || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Baseline FP</p>
            <p className="text-xl font-semibold">{data.baselineFp || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Opponent Score</p>
            <p className="text-xl font-semibold">{data.opponentScore || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Opponent FP</p>
            <p className="text-xl font-semibold">{data.opponentFp || 0}</p>
          </div>
        </div>
      </div>

      {/* Player Stats */}
      <div className="bg-white border border-gray-300 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            Players ({data.playerStats?.length || 0})
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep(3)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Score</p>
            <p className="text-lg font-semibold">
              {data.playerStats?.reduce((sum, p) => sum + p.score, 0) || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total FP</p>
            <p className="text-lg font-semibold">{totalPlayerFp}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Players</p>
            <p className="text-lg font-semibold">{data.playerStats?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Non-Player Stats */}
      {data.nonplayerStats && data.nonplayerStats.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              Non-Players ({data.nonplayerStats.length})
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(4)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total FP</p>
              <p className="text-lg font-semibold">{totalNonplayerFp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reserve FP</p>
              <p className="text-lg font-semibold">
                {data.nonplayerStats.filter((np) => np.reserve).reduce((sum, np) => sum + np.fp, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Non-Players</p>
              <p className="text-lg font-semibold">{data.nonplayerStats.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Codes Summary */}
      <div className="bg-white border border-gray-300 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Action Codes</h3>
          <button
            type="button"
            onClick={() => onJumpToStep(5)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          {['HOLD', 'WARN', 'KICK', 'RESERVE', 'PASS'].map((code) => {
            const playerCount =
              data.playerStats?.filter((p) => p.actionCode === code).length || 0;
            const nonplayerCount =
              data.nonplayerStats?.filter((np) => np.actionCode === code).length || 0;
            const total = playerCount + nonplayerCount;
            return (
              <div key={code} className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">{code}</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Warnings */}
      {(!data.startDate || !data.endDate || !data.opponentName || !data.score || !data.baselineFp) && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-800 font-semibold">⚠️ Missing required fields</p>
          <p className="text-red-700 text-sm">
            Please complete all required fields before submitting.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <div className="space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            ← Back
          </button>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !data.startDate || !data.opponentName || !data.score}
          className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Battle ✓'}
        </button>
      </div>
    </div>
  );
}
