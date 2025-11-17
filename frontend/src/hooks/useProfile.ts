/**
 * User Profile Hooks
 *
 * React Query hooks for managing user profile data (Epic 2, Stories 2.5-2.7)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, getApiErrorMessage } from '@/lib/api-client';

/**
 * User profile data from GET /api/users/me
 */
export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  clanId: number | null;
  owner: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  // From Keycloak (optional)
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Profile update payload for PUT /api/users/me
 */
export interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

/**
 * Password change payload for POST /api/users/me/password
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

/**
 * Hook to fetch current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/api/users/me');
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await apiClient.put<UserProfile>('/api/users/me', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Update profile cache
      queryClient.setQueryData(['profile'], data);
      // Invalidate auth user to refresh AuthContext
      void queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await apiClient.post<void>('/api/users/me/password', payload);
      return response.data;
    },
  });
}

/**
 * Type guard to check if error is an API error with a message
 */
export function isApiError(error: unknown): error is { response: { data: { message: string } } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null &&
    'data' in (error as { response: { data: unknown } }).response &&
    typeof (error as { response: { data: unknown } }).response.data === 'object' &&
    (error as { response: { data: unknown } }).response.data !== null &&
    'message' in (error as { response: { data: { message: unknown } } }).response.data
  );
}

/**
 * Extract error message from API error
 */
export function getProfileErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}
