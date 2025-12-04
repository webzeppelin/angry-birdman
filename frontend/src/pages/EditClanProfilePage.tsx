/**
 * EditClanProfilePage - Edit Clan Profile (Story 2.10)
 *
 * Allows clan owners to edit clan information:
 * - Clan name (editable)
 * - Country (editable)
 * - Rovio ID (read-only)
 *
 * Access: Clan owners only
 * API: PATCH /api/clans/:clanId
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

const clanProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Clan name must be at least 2 characters')
    .max(100, 'Clan name is too long'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country name is too long'),
});

type ClanProfileUpdate = z.infer<typeof clanProfileUpdateSchema>;

interface ClanDetails {
  clanId: number;
  rovioId: number;
  name: string;
  country: string;
  registrationDate: string;
  active: boolean;
}

export function EditClanProfilePage() {
  const { clanId } = useParams<{ clanId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof ClanProfileUpdate, string>>
  >({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch clan details
  const {
    data: clan,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['clan', clanId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/clans/${clanId}`);
      const data = response.data as ClanDetails;
      // Initialize form with current values
      setName(data.name);
      setCountry(data.country);
      return data;
    },
    enabled: !!clanId,
  });

  // Update clan mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: ClanProfileUpdate) => {
      const response = await apiClient.patch(`/api/clans/${clanId}`, updates);
      return response.data as ClanDetails;
    },
    onSuccess: () => {
      // Invalidate and refetch clan data
      void queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
      // Navigate back to profile page
      void navigate(`/clans/${clanId}/profile`);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error));
    },
  });

  // Check authorization - only owners can edit
  const isOwner = user && clan && user.clanId === clan.clanId && user.owner;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setApiError(null);

    // Validate form
    const result = clanProfileUpdateSchema.safeParse({ name, country });

    if (!result.success) {
      const errors: Partial<Record<keyof ClanProfileUpdate, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ClanProfileUpdate] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Submit update
    updateMutation.mutate(result.data);
  };

  // Handle cancel
  const handleCancel = () => {
    void navigate(`/clans/${clanId}/profile`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="animate-pulse rounded-lg bg-white p-8 shadow-card">
              <div className="mb-6 h-10 w-1/2 rounded bg-neutral-200"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded bg-neutral-100"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !clan) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
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

  // Check authorization
  if (!isOwner) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
              <div className="mb-4 text-6xl">🚫</div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Access Denied</h2>
              <p className="mb-6 text-neutral-600">
                Only clan owners can edit clan profile information.
              </p>
              <Link
                to={`/clans/${clanId}/profile`}
                className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-600"
              >
                ← Back to Clan Profile
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
        <div className="mx-auto max-w-2xl">
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
                <Link to={`/clans/${clan.clanId}`} className="hover:text-primary">
                  {clan.name}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to={`/clans/${clan.clanId}/profile`} className="hover:text-primary">
                  Profile
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-neutral-800">Edit</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl text-neutral-800">Edit Clan Profile</h1>
            <p className="text-neutral-600">Update your clan&apos;s information</p>
          </div>

          {/* Edit Form */}
          <div className="rounded-lg bg-white p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Error Message */}
              {apiError && (
                <div className="bg-error/10 border-error/20 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-error text-xl">⚠️</div>
                    <div className="flex-1">
                      <p className="text-error font-medium">Error Updating Clan</p>
                      <p className="text-error/80 text-sm">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Clan Name */}
              <div>
                <label htmlFor="name" className="mb-2 block font-medium text-neutral-700">
                  Clan Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`input-primary w-full ${validationErrors.name ? 'border-error' : ''}`}
                  required
                  disabled={updateMutation.isPending}
                />
                {validationErrors.name && (
                  <p className="text-error mt-1 text-sm">{validationErrors.name}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="mb-2 block font-medium text-neutral-700">
                  Country <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`input-primary w-full ${validationErrors.country ? 'border-error' : ''}`}
                  required
                  disabled={updateMutation.isPending}
                />
                {validationErrors.country && (
                  <p className="text-error mt-1 text-sm">{validationErrors.country}</p>
                )}
              </div>

              {/* Rovio ID (Read-only) */}
              <div>
                <label htmlFor="rovioId" className="mb-2 block font-medium text-neutral-700">
                  Rovio ID
                </label>
                <input
                  type="text"
                  id="rovioId"
                  value={clan.rovioId}
                  disabled
                  className="input-primary w-full cursor-not-allowed bg-neutral-100 text-neutral-600"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Rovio ID cannot be changed after clan registration
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 border-t border-neutral-200 pt-6">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateMutation.isPending ? (
                    <>
                      <svg
                        className="mr-2 inline h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="bg-info/10 border-info/20 mt-6 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="text-info text-xl">ℹ️</div>
              <div className="flex-1">
                <p className="text-info font-medium">About Clan Profile Updates</p>
                <p className="text-info/80 text-sm">
                  Changes to your clan profile will be visible immediately to all users. The Rovio
                  ID is permanent and cannot be changed after registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
