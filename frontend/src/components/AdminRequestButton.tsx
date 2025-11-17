import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface AdminRequestButtonProps {
  clanId: string;
}

export function AdminRequestButton({ clanId }: AdminRequestButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin-requests', { clanId });
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      // Invalidate queries that might show request status
      void queryClient.invalidateQueries({ queryKey: ['adminRequests'] });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to submit admin request');
      setSuccess(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleRequestAccess = () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    requestMutation.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRequestAccess}
        disabled={isSubmitting || success}
        className={`rounded-md px-4 py-2 font-medium transition-colors ${
          success
            ? 'cursor-not-allowed bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
        }`}
      >
        {isSubmitting ? 'Submitting...' : success ? 'Request Submitted ✓' : 'Request Admin Access'}
      </button>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
          Your admin access request has been submitted. A clan owner will review it shortly.
        </div>
      )}
    </div>
  );
}
