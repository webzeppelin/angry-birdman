import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface AdminRequestButtonProps {
  clanId: string;
}

interface AdminRequest {
  requestId: number;
  clanId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AdminRequestsResponse {
  requests: AdminRequest[];
  total: number;
}

export function AdminRequestButton({ clanId }: AdminRequestButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user already has a pending request for this clan
  const { data: userRequestsData } = useQuery<AdminRequestsResponse>({
    queryKey: ['userAdminRequests', user?.sub],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin-requests', {
        params: { limit: '100' },
      });
      return response.data as AdminRequestsResponse;
    },
    enabled: !!user,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/admin-requests', {
        clanId: parseInt(clanId, 10),
      });
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      // Invalidate queries that might show request status
      void queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
      void queryClient.invalidateQueries({ queryKey: ['userAdminRequests'] });

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

  // Don't show button if user is owner of this clan
  if (user.clanId === parseInt(clanId, 10) && user.owner) {
    return null;
  }

  // Don't show button if user is admin (but not owner) of this clan
  if (user.clanId === parseInt(clanId, 10) && !user.owner) {
    return null;
  }

  // Check if user has a pending request for this clan
  const pendingRequest = userRequestsData?.requests.find(
    (req) => req.clanId === parseInt(clanId, 10) && req.status === 'PENDING'
  );

  if (pendingRequest) {
    return (
      <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <p className="font-medium">Pending Request</p>
        <p className="mt-1">You have already requested admin access to this clan.</p>
      </div>
    );
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
