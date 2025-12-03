/**
 * ClanSettingsPage - Clan Settings Management (Story 2.15)
 *
 * Provides clan management options including:
 * - Deactivate clan option for owners
 * - Other clan settings (future)
 *
 * Access: Clan owners and superadmins only
 * API: POST /api/clans/:clanId/deactivate
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

interface ClanDetails {
  clanId: number;
  name: string;
  active: boolean;
}

export function ClanSettingsPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch clan details
  const {
    data: clan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clan', clanId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}`);
      return response.data as ClanDetails;
    },
    enabled: !!clanId,
  });

  // Deactivate clan mutation
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/api/clans/${clanId}/deactivate`);
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
      void queryClient.invalidateQueries({ queryKey: ['clans'] });
      setShowDeactivateDialog(false);
      // Navigate to clans list
      navigate('/clans');
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error));
    },
  });

  // Check authorization - owner or superadmin
  const isOwner = user && clan && user.clanId === clan.clanId && user.owner;
  const isSuperadmin = user && user.roles.includes('superadmin');
  const canDeactivate = isOwner || isSuperadmin;

  // Handle deactivate confirmation
  const handleDeactivate = () => {
    setApiError(null);
    deactivateMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
              <div className="mb-4 text-6xl">🔒</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">
                Authentication Required
              </h2>
              <p className="mb-6 text-neutral-600">
                You must be signed in to access clan settings.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
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
          <div className="mx-auto max-w-3xl">
            <div className="animate-pulse rounded-lg bg-white p-8 shadow-card">
              <div className="mb-6 h-10 w-1/2 rounded bg-neutral-200"></div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-32 rounded bg-neutral-100"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clan) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
              <div className="mb-4 text-6xl">⚠️</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Clan Not Found</h2>
              <p className="mb-6 text-neutral-600">
                The clan you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link
                to="/clans"
                className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
              >
                ← Browse all clans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canDeactivate) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
              <div className="mb-4 text-6xl">🚫</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Access Denied</h2>
              <p className="mb-6 text-neutral-600">
                Only clan owners and superadmins can access clan settings.
              </p>
              <Link
                to={`/clans/${clanId}`}
                className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
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
        <div className="mx-auto max-w-3xl">
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
                  {clan.name}
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-neutral-800">Settings</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl text-neutral-800">Clan Settings</h1>
            <p className="text-neutral-600">Manage your clan configuration and options</p>
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

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Danger Zone */}
            <div className="border-error/20 rounded-lg border-2 bg-white p-8 shadow-card">
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-semibold text-neutral-800">Danger Zone</h2>
                <p className="text-sm text-neutral-600">
                  Irreversible and destructive actions. Please be careful.
                </p>
              </div>

              {/* Deactivate Clan */}
              <div className="border-error/20 bg-error/5 rounded-lg border p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-neutral-800">
                      Deactivate This Clan
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Once deactivated, this clan will no longer appear in active clan lists.
                      Historical data will be preserved but the clan will be marked as inactive.
                      Only superadmins can reactivate a clan.
                    </p>
                  </div>
                </div>

                {clan.active ? (
                  <button
                    onClick={() => setShowDeactivateDialog(true)}
                    disabled={deactivateMutation.isPending}
                    className="border-error bg-error hover:bg-error/90 rounded-lg border-2 px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Deactivate Clan
                  </button>
                ) : (
                  <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600">
                    This clan is already inactive
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              to={`/clans/${clanId}`}
              className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
            >
              ← Back to Clan Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-error mb-4 text-2xl font-semibold">⚠️ Deactivate Clan?</h3>
            <div className="mb-6 space-y-3 text-neutral-700">
              <p>
                Are you sure you want to deactivate <strong>{clan.name}</strong>?
              </p>
              <p className="text-sm">
                <strong>This action will:</strong>
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Remove the clan from active clan lists</li>
                <li>Mark all historical data as inactive</li>
                <li>Prevent new battle entries</li>
                <li>Remove administrative access for all admins</li>
              </ul>
              <p className="text-sm">
                <strong>Historical data will be preserved</strong> and can be viewed, but the clan
                can only be reactivated by a superadmin.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                className="border-error bg-error hover:bg-error/90 flex-1 rounded-lg border-2 px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deactivateMutation.isPending ? 'Deactivating...' : 'Yes, Deactivate Clan'}
              </button>
              <button
                onClick={() => setShowDeactivateDialog(false)}
                disabled={deactivateMutation.isPending}
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
