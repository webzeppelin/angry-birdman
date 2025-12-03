/**
 * ProfilePage Component
 *
 * Epic 2 Stories 2.5-2.6: View My User Profile / Edit My User Profile
 *
 * Allows authenticated users to view and edit their profile information.
 * Displays username, email, clan association, and role.
 * Provides edit mode for updating username and email.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, getProfileErrorMessage } from '@/hooks/useProfile';

/**
 * Profile update validation schema
 */
const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
});

type ProfileFormData = z.infer<typeof profileUpdateSchema>;

/**
 * ProfilePage Component
 */
export default function ProfilePage() {
  const { clanInfo, refreshUser } = useAuth();
  const { data: profile, isLoading, error: queryError } = useProfile();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username,
        email: profile.email,
      });
    }
  }, [profile]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMessage]);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user types
    if (formErrors[name as keyof ProfileFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear success message when editing
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    try {
      profileUpdateSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof ProfileFormData;
          errors[field] = err.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    void updateProfile
      .mutateAsync(formData)
      .then(async () => {
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully');

        // Refresh auth context to get updated user data
        await refreshUser();
      })
      .catch((error) => {
        console.error('Profile update failed:', error);
      });
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username,
        email: profile.email,
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  /**
   * Format role for display
   */
  const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      superadmin: 'Superadmin',
      'clan-owner': 'Clan Owner',
      'clan-admin': 'Clan Admin',
      user: 'User',
    };
    return roleMap[role] || role;
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (queryError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
            Failed to load profile
          </h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            {getProfileErrorMessage(queryError)}
          </p>
          <div className="flex justify-center">
            <Link to="/" className="hover:text-primary-dark font-medium text-primary">
              Return to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage your account information</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {/* Read-only Information */}
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Account Information</h2>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* User ID (Read-only) */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 break-all font-mono text-sm text-gray-900">{profile.userId}</dd>
              </div>

              {/* Roles (Read-only) */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Roles</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {profile.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800"
                      >
                        {formatRole(role)}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>

              {/* Clan Association (Read-only) */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Clan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {clanInfo ? (
                    <Link
                      to={`/clans/${clanInfo.clanId}`}
                      className="hover:text-primary-dark text-primary"
                    >
                      {clanInfo.name}
                      {profile.owner && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                    </Link>
                  ) : (
                    <span className="text-gray-400">No clan association</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Editable Information */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium leading-6 text-gray-900">Profile Settings</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-primary-dark inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          formErrors.username ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
                        placeholder="Enter email"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                  )}
                </div>

                {/* Update Error */}
                {updateProfile.isError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {getProfileErrorMessage(updateProfile.error)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Mode Buttons */}
                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="hover:bg-primary-dark inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Change Password */}
          <Link
            to="/profile/change-password"
            className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 transition-all hover:border-primary hover:shadow-md"
          >
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Update your account password</p>
              </div>
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {/* Return to Dashboard */}
          <Link
            to="/dashboard"
            className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 transition-all hover:border-primary hover:shadow-md"
          >
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Dashboard</p>
                <p className="text-xs text-gray-500">Return to your dashboard</p>
              </div>
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
