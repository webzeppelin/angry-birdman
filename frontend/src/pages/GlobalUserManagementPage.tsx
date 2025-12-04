/**
 * Global User Management Page
 * Story 2.16: Manage Users (Superadmin)
 *
 * Search, view, and manage all user accounts in the system.
 * Supports filtering by username, email, clan, and enabled status.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient, getApiErrorMessage } from '@/lib/api-client';

interface User {
  userId: string;
  username: string;
  email: string;
  enabled: boolean;
  owner: boolean;
  clanId: number | null;
  clanName: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UserFilters {
  search: string;
  clanId: string;
  enabled: string;
  page: number;
  limit: number;
}

async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.search) params.search = filters.search;
  if (filters.clanId) params.clanId = filters.clanId;
  if (filters.enabled) params.enabled = filters.enabled;

  const response = await apiClient.get<UsersResponse>('/api/admin/users', { params });
  return response.data;
}

async function resetPassword(userId: string, temporary: boolean): Promise<string> {
  const password = generateTemporaryPassword();
  await apiClient.post(`/api/admin/users/${userId}/password-reset`, {
    password,
    temporary,
  });
  return password;
}

async function toggleUserEnabled(userId: string, enabled: boolean): Promise<void> {
  if (enabled) {
    await apiClient.post(`/api/admin/users/${userId}/disable`);
  } else {
    await apiClient.post(`/api/admin/users/${userId}/enable`);
  }
}

async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`);
}

function generateTemporaryPassword(): string {
  // Generate a secure random password
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function GlobalUserManagementPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    clanId: '',
    enabled: '',
    page: 1,
    limit: 50,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsers(filters),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, temporary }: { userId: string; temporary: boolean }) =>
      resetPassword(userId, temporary),
    onSuccess: (password) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setGeneratedPassword(password);
      setShowPasswordDialog(true);
      closeConfirmation();
    },
    onError: (error) => {
      alert(`Failed to reset password: ${getApiErrorMessage(error)}`);
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      toggleUserEnabled(userId, enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeConfirmation();
    },
    onError: (error) => {
      alert(`Failed to update user status: ${getApiErrorMessage(error)}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User deleted successfully');
      closeConfirmation();
    },
    onError: (error) => {
      alert(`Failed to delete user: ${getApiErrorMessage(error)}`);
    },
  });

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleEnabledFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, enabled: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const openConfirmation = (user: User, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setSelectedUser(null);
    setActionType('');
    setShowConfirmation(false);
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    switch (actionType) {
      case 'resetPassword':
        resetPasswordMutation.mutate({ userId: selectedUser.userId, temporary: true });
        break;
      case 'toggleEnabled':
        toggleEnabledMutation.mutate({
          userId: selectedUser.userId,
          enabled: selectedUser.enabled,
        });
        break;
      case 'delete':
        deleteUserMutation.mutate(selectedUser.userId);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Failed to load users. Please try again later.</div>
      </div>
    );
  }

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Search and manage all user accounts</p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div>
            <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Username or email..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Enabled Filter */}
          <div>
            <label htmlFor="enabled" className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="enabled"
              value={filters.enabled}
              onChange={(e) => handleEnabledFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All users</option>
              <option value="true">Enabled only</option>
              <option value="false">Disabled only</option>
            </select>
          </div>

          {/* Results count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {users.length} of {pagination?.total ?? 0} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Clan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        {user.owner && (
                          <span className="ml-2 inline-flex items-center rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            Owner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {user.clanName || <span className="text-gray-400 italic">No clan</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.enabled ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openConfirmation(user, 'resetPassword')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Reset password"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => openConfirmation(user, 'toggleEnabled')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={user.enabled ? 'Disable user' : 'Enable user'}
                        >
                          {user.enabled ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => openConfirmation(user, 'delete')}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && selectedUser && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Confirm Action</h3>
            <p className="mb-6 text-gray-600">
              {actionType === 'resetPassword' &&
                `Reset password for ${selectedUser.username}? A temporary password will be generated.`}
              {actionType === 'toggleEnabled' &&
                `${selectedUser.enabled ? 'Disable' : 'Enable'} user ${selectedUser.username}?`}
              {actionType === 'delete' &&
                `Permanently delete user ${selectedUser.username}? This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirmation}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionType === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Dialog */}
      {showPasswordDialog && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Password Reset Successful</h3>
            <p className="mb-4 text-gray-600">
              The password has been reset. Please provide this temporary password to the user
              through a secure channel:
            </p>
            <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <code className="font-mono text-lg font-semibold text-blue-600">
                  {generatedPassword}
                </code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(generatedPassword);
                    alert('Password copied to clipboard');
                  }}
                  className="ml-4 rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="mb-6 text-sm text-amber-600">
              ⚠️ Make sure to save this password - it cannot be retrieved again.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setGeneratedPassword('');
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
