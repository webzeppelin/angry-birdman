import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';

import BattleEntryWizard from '../../components/battles/BattleEntryWizard';
import { useAuth } from '../../contexts/AuthContext';

import type { BattleResponse } from '../../types/battle';
import type { BattleEntry } from '@angrybirdman/common';

export default function NewBattlePage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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
        const errorData: { message?: string } = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? 'Failed to create battle');
      }

      return response.json() as Promise<BattleResponse>;
    },
    onSuccess: () => {
      // Invalidate battles list query to trigger refetch
      void queryClient.invalidateQueries({ queryKey: ['battles', clanIdNum] });
    },
  });

  // Check authorization
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!clanIdNum || user.clanId !== clanIdNum) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            ⚠️ You do not have permission to create battles for this clan.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (battleData: BattleEntry) => {
    const result = (await createBattleMutation.mutateAsync(battleData)) as { battleId: string };
    return result;
  };

  return (
    <div>
      <div className="mb-6 border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-3xl font-bold text-gray-900">Record New Battle</h1>
        <p className="mt-1 text-gray-600">
          Enter battle data step-by-step. Your progress will be saved automatically.
        </p>
      </div>

      <BattleEntryWizard clanId={clanIdNum} onSubmit={handleSubmit} mode="create" />
    </div>
  );
}
