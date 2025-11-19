import { useParams, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import type { BattleEntry } from '@angrybirdman/common';
import BattleEntryWizard from '../../components/battles/BattleEntryWizard';

export default function NewBattlePage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user, isAuthenticated } = useAuth();

  const clanIdNum = clanId ? parseInt(clanId, 10) : null;

  // Mutation must be before early returns per React hooks rules
  const createBattleMutation = useMutation({
    mutationFn: async (battleData: BattleEntry) => {
      const response = await fetch(`/api/clans/${clanIdNum}/battles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(battleData),
      });

      if (!response.ok) {
        const errorData: { message?: string } = await response.json() as { message?: string };
        throw new Error(errorData.message ?? 'Failed to create battle');
      }

      return response.json();
    },
  });

  // Check authorization
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!clanIdNum || user.clanId !== clanIdNum) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-800 font-semibold">
            ⚠️ You do not have permission to create battles for this clan.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (battleData: BattleEntry) => {
    await createBattleMutation.mutateAsync(battleData);
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Record New Battle</h1>
        <p className="text-gray-600 mt-1">
          Enter battle data step-by-step. Your progress will be saved automatically.
        </p>
      </div>

      <BattleEntryWizard clanId={clanIdNum} onSubmit={handleSubmit} mode="create" />
    </div>
  );
}
