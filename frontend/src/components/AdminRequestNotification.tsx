import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface AdminRequest {
  requestId: number;
  clanId: string;
  userId: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface AdminRequestsResponse {
  requests: AdminRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminRequestNotification() {
  const { user } = useAuth();

  // Only fetch for clan owners
  const { data } = useQuery<AdminRequestsResponse>({
    queryKey: ['adminRequests', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get('admin-requests', {
        params: {
          status: 'pending',
          limit: '100', // Get all pending requests
        },
      });
      return response.data as AdminRequestsResponse;
    },
    enabled: !!user?.owner,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const pendingCount = data?.requests.length || 0;

  if (!user?.owner || pendingCount === 0) {
    return null;
  }

  return (
    <Link
      to="/admin-requests"
      className="relative inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-blue-700 transition-colors hover:bg-blue-100"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span className="font-medium">Admin Requests</span>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {pendingCount}
      </span>
    </Link>
  );
}
