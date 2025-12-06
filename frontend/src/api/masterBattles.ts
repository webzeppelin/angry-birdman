/**
 * API functions for Master Battle endpoints
 *
 * Handles communication with the centralized battle schedule API.
 */

import { apiClient } from '../lib/api-client';

import type {
  MasterBattle,
  BattleScheduleInfo,
  CreateMasterBattleInput,
  UpdateNextBattleDateInput,
} from '@angrybirdman/common';

/**
 * Paginated response for master battles list
 */
export interface MasterBattleListResponse {
  battles: MasterBattle[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Get all master battles with pagination
 */
export async function getAllMasterBattles(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<MasterBattleListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const url = `/api/master-battles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await apiClient.get<MasterBattleListResponse>(url);
  return response.data;
}

/**
 * Get available battles for selection (started but not future)
 */
export async function getAvailableBattles(): Promise<MasterBattle[]> {
  const response = await apiClient.get<MasterBattle[]>('/api/master-battles/available');
  return response.data;
}

/**
 * Get battle schedule information (current, next, available count)
 */
export async function getBattleScheduleInfo(): Promise<BattleScheduleInfo> {
  const response = await apiClient.get<BattleScheduleInfo>('/api/master-battles/schedule-info');
  return response.data;
}

/**
 * Get a specific master battle by ID
 */
export async function getMasterBattleById(battleId: string): Promise<MasterBattle> {
  const response = await apiClient.get<MasterBattle>(`/api/master-battles/${battleId}`);
  return response.data;
}

// ============================================================================
// Superadmin Operations
// ============================================================================

/**
 * Get the next battle date from system settings (Superadmin only)
 */
export async function getNextBattleDate(): Promise<{ nextBattleStartDate: string }> {
  const response = await apiClient.get<{ nextBattleStartDate: string }>(
    '/api/master-battles/next-battle-date'
  );
  return response.data;
}

/**
 * Update the next battle date (Superadmin only)
 */
export async function updateNextBattleDate(
  data: UpdateNextBattleDateInput
): Promise<{ message: string }> {
  const response = await apiClient.put<{ message: string }>(
    '/api/master-battles/next-battle-date',
    data
  );
  return response.data;
}

/**
 * Manually create a master battle (Superadmin only)
 */
export async function createMasterBattle(
  data: CreateMasterBattleInput
): Promise<{ battle: MasterBattle }> {
  const response = await apiClient.post<{ battle: MasterBattle }>('/api/master-battles', data);
  return response.data;
}
