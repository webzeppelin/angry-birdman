import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface AdminRequest {
  requestId: number;
  clanId: string;
  clanName: string;
  userId: string;
  username: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
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

export function AdminRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'all'>('pending');
  const [reviewingRequest, setReviewingRequest] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading, error } = useQuery<AdminRequestsResponse>({
    queryKey: ['adminRequests', selectedStatus],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: '50',
      };
      if (selectedStatus === 'pending') {
        params.status = 'PENDING';
      }
      const response = await apiClient.get('/api/admin-requests', { params });
      return response.data as AdminRequestsResponse;
    },
    enabled: !!user?.owner,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: number;
      action: 'approve' | 'reject';
    }) => {
      const response = await apiClient.post(`/api/admin-requests/${requestId}/review`, { action });
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
      setReviewingRequest(null);
      setReviewAction(null);
    },
  });

  const handleReviewClick = (requestId: number, action: 'approve' | 'reject') => {
    setReviewingRequest(requestId);
    setReviewAction(action);
  };

  const handleConfirmReview = () => {
    if (reviewingRequest && reviewAction) {
      reviewMutation.mutate({ requestId: reviewingRequest, action: reviewAction });
    }
  };

  const handleCancelReview = () => {
    setReviewingRequest(null);
    setReviewAction(null);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-yellow-800">Authentication Required</h2>
          <p className="mb-4 text-yellow-700">You must be logged in to view admin requests.</p>
          <Link
            to="/login"
            className="inline-block rounded-md bg-yellow-600 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (!user.owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-700">Only clan owners can review admin requests.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Error</h2>
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  const requests = data?.requests || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Admin Requests</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Admin Requests</h1>
        <p className="text-gray-600">Review and manage admin access requests for your clans</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              selectedStatus === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Pending
            {selectedStatus === 'pending' && requests.length > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedStatus('all')}
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            All Requests
          </button>
        </nav>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No {selectedStatus === 'pending' ? 'pending ' : ''}requests
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'pending'
              ? 'There are no pending admin requests at this time.'
              : 'No admin requests have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.requestId}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{request.username}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="mb-1 text-gray-600">{request.email}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      Clan:{' '}
                      <Link
                        to={`/clans/${request.clanId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {request.clanName}
                      </Link>
                    </span>
                    <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
                  </div>
                  {request.reviewedAt && (
                    <div className="mt-2 text-sm text-gray-500">
                      Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}
                      {request.reviewedBy && ` by ${request.reviewedBy}`}
                    </div>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleReviewClick(request.requestId, 'approve')}
                      disabled={reviewMutation.isPending}
                      className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewClick(request.requestId, 'reject')}
                      disabled={reviewMutation.isPending}
                      className="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {reviewingRequest && reviewAction && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="mb-6 text-gray-600">
              {reviewAction === 'approve'
                ? 'Are you sure you want to approve this admin request? The user will gain admin access to the clan.'
                : 'Are you sure you want to reject this admin request? The user will be notified of the rejection.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelReview}
                disabled={reviewMutation.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={reviewMutation.isPending}
                className={`rounded-md px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewMutation.isPending
                  ? 'Processing...'
                  : reviewAction === 'approve'
                    ? 'Approve'
                    : 'Reject'}
              </button>
            </div>
            {reviewMutation.isError && (
              <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {reviewMutation.error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
