/**
 * Battle-related TypeScript interfaces for the frontend
 *
 * These interfaces provide proper typing for API responses and component props
 * to avoid 'any' types and ensure type safety throughout the application.
 */

// Roster member interface for API responses
export interface RosterMember {
  playerId: number;
  playerName: string;
  fp?: number; // Optional - not returned by roster endpoint
  active: boolean;
  reserved: boolean;
  joinedDate: string;
}

// Battle response from API
export interface BattleResponse {
  battleId: string;
  clanId: number;
  startDate: string;
  endDate: string;
  opponentRovioId: number;
  opponentName: string;
  opponentCountry: string;
  score: number;
  baselineFp: number;
  opponentScore: number;
  opponentFp: number;
  result: number; // 1 = win, -1 = loss, 0 = tie
  ratio: number; // Official clan ratio: (score / baselineFp) * 10
  averageRatio: number;
  marginRatio: number;
  fpMargin: number;
  projectedScore: number;
  fp: number;
  nonplayingCount: number;
  nonplayingFpRatio: number;
  reserveCount: number;
  reserveFpRatio: number;
  playerStats?: PlayerStatsResponse[];
  nonplayerStats?: NonplayerStatsResponse[];
  createdAt: string;
  updatedAt: string;
}

// Player stats response from API
export interface PlayerStatsResponse {
  playerId: number;
  playerName: string;
  rank: number;
  score: number;
  fp: number;
  ratio: number;
  ratioRank: number;
  actionCode?: string;
  actionReason?: string;
}

// Non-player stats response from API
export interface NonplayerStatsResponse {
  playerId: number;
  playerName: string;
  fp: number;
  reserve: boolean;
  actionCode?: string;
  actionReason?: string;
}

// Battle list response with pagination
export interface BattleListResponse {
  battles: BattleResponse[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Roster API response
export interface RosterResponse {
  players: RosterMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
