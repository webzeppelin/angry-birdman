/**
 * ClanAdminsPage - View Clan Administrators (Story 2.11)
 *
 * Displays list of all clan administrators including:
 * - Username, email
 * - Role (Admin/Owner)
 * - Owner users clearly marked
 * - Management actions for owners (promote, remove)
 *
 * Access: Clan members
 * Management actions: Clan owners only
 * API: GET /api/clans/:clanId/admins
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

interface AdminUser {
  userId: string;
  username: string;
  email: string;
  owner: boolean;
  roles: string[];
}

interface ClanDetails {
  clanId: number;
  name: string;
}

export function ClanAdminsPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'promote' | 'remove';
    adminUser: AdminUser;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch clan details (for name)
  const { data: clan } = useQuery({
    queryKey: ['clan', clanId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}`);
      return response.data as ClanDetails;
    },
    enabled: !!clanId,
  });

  // Fetch admin users list
  const {
    data: admins,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clan-admins', clanId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}/admins`);
      return (response.data as { admins: AdminUser[] }).admins;
    },
    enabled: !!clanId && !!user,
  });

  // Promote admin to owner mutation
  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/api/clans/${clanId}/admins/${userId}/promote`);
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clan-admins', clanId] });
      void queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
      setConfirmDialog(null);
      setApiError(null);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error));
    },
  });

  // Remove admin mutation
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/api/clans/${clanId}/admins/${userId}`);
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clan-admins', clanId] });
      void queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
      setConfirmDialog(null);
      setApiError(null);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error));
    },
  });

  // Check if current user is owner
  const isOwner = user && user.clanId === parseInt(clanId || '0', 10) && user.owner;

  // Handle promote action
  const handlePromote = (adminUser: AdminUser) => {
    setConfirmDialog({ type: 'promote', adminUser });
    setApiError(null);
  };

  // Handle remove action
  const handleRemove = (adminUser: AdminUser) => {
    setConfirmDialog({ type: 'remove', adminUser });
    setApiError(null);
  };

  // Confirm dialog action
  const handleConfirm = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'promote') {
      promoteMutation.mutate(confirmDialog.adminUser.userId);
    } else {
      removeMutation.mutate(confirmDialog.adminUser.userId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="border-error shadow-card rounded-lg border bg-white p-12 text-center">
              <div className="mb-4 text-6xl">🔒</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">
                Authentication Required
              </h2>
              <p className="mb-6 text-neutral-600">
                You must be signed in to view clan administrators.
              </p>
              <Link
                to="/login"
                className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
              >
                Sign In →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="shadow-card rounded-lg bg-white p-8">
              <div className="mb-6 h-10 w-1/2 animate-pulse rounded bg-neutral-200"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded bg-neutral-100"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !admins) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="border-error shadow-card rounded-lg border bg-white p-12 text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Error Loading Admins</h2>
              <p className="mb-6 text-neutral-600">
                {getApiErrorMessage(error) || 'Unable to load clan administrators.'}
              </p>
              <Link
                to={`/clans/${clanId}`}
                className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
              >
                ← Back to Clan Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-neutral-600" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/clans" className="hover:text-primary">
                  Clans
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to={`/clans/${clanId}`} className="hover:text-primary">
                  {clan?.name || 'Clan'}
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-neutral-800">Administrators</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display mb-2 text-4xl text-neutral-800">Clan Administrators</h1>
            <p className="text-neutral-600">
              {admins.length} {admins.length === 1 ? 'administrator' : 'administrators'}
            </p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="bg-error/10 border-error/20 mb-6 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="text-error text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-error font-medium">Error</p>
                  <p className="text-error/80 text-sm">{apiError}</p>
                </div>
                <button
                  onClick={() => setApiError(null)}
                  className="text-error/60 hover:text-error text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Admins List */}
          <div className="shadow-card rounded-lg bg-white">
            <div className="divide-y divide-neutral-200">
              {admins.map((admin) => (
                <div key={admin.userId} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-neutral-800">{admin.username}</h3>
                        {admin.owner && (
                          <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                            👑 Owner
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{admin.email}</p>
                    </div>

                    {/* Actions (Owner Only) */}
                    {isOwner && admin.userId !== user.sub && (
                      <div className="flex gap-2">
                        {!admin.owner && (
                          <>
                            <button
                              onClick={() => handlePromote(admin)}
                              className="btn-secondary text-sm"
                              disabled={promoteMutation.isPending || removeMutation.isPending}
                            >
                              Promote to Owner
                            </button>
                            <button
                              onClick={() => handleRemove(admin)}
                              className="btn-secondary text-error hover:bg-error/10 text-sm"
                              disabled={promoteMutation.isPending || removeMutation.isPending}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          {isOwner && (
            <div className="bg-info/10 border-info/20 mt-6 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="text-info text-xl">ℹ️</div>
                <div className="flex-1">
                  <p className="text-info font-medium">Admin Management</p>
                  <p className="text-info/80 text-sm">
                    As clan owner, you can promote other admins to owner or remove their admin
                    privileges. Promoting someone to owner will transfer ownership to them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              to={`/clans/${clanId}`}
              className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
            >
              ← Back to Clan Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="shadow-card w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-xl font-semibold text-neutral-800">
              {confirmDialog.type === 'promote' ? 'Promote to Owner?' : 'Remove Admin?'}
            </h3>
            <p className="mb-6 text-neutral-600">
              {confirmDialog.type === 'promote' ? (
                <>
                  Are you sure you want to promote{' '}
                  <strong>{confirmDialog.adminUser.username}</strong> to clan owner? This will
                  transfer ownership to them and you will become a regular admin.
                </>
              ) : (
                <>
                  Are you sure you want to remove{' '}
                  <strong>{confirmDialog.adminUser.username}</strong> from clan administrators? They
                  will lose access to clan management features.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={promoteMutation.isPending || removeMutation.isPending}
                className={`btn-primary flex-1 ${confirmDialog.type === 'remove' ? 'bg-error hover:bg-error/90' : ''}`}
              >
                {promoteMutation.isPending || removeMutation.isPending
                  ? 'Processing...'
                  : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={promoteMutation.isPending || removeMutation.isPending}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
