# API Integration Examples

This guide provides practical code examples for integrating with the Angry
Birdman API across different programming languages and frameworks.

## Table of Contents

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [React Integration](#react-integration)
- [Common Use Cases](#common-use-cases)
- [Error Handling Patterns](#error-handling-patterns)

## JavaScript/TypeScript

### Basic Setup

```typescript
// api-client.ts
const API_BASE_URL = 'http://localhost:3001';

interface ApiError {
  error: string;
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important: Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

### Authentication

```typescript
// auth.service.ts
import { apiClient } from './api-client';

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  sub: string;
  preferred_username: string;
  email: string;
  clanId: number | null;
  clanName: string | null;
  owner: boolean;
  roles: string[];
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<void> {
    await apiClient.post('/auth/login-with-password', credentials);
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/user');
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ authenticated: boolean }>(
        '/auth/status'
      );
      return response.authenticated;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
```

### User Registration

```typescript
// user.service.ts
import { apiClient } from './api-client';

interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

interface ClanRegistration {
  rovioId: number;
  name: string;
  country: string;
}

export class UserService {
  async register(data: UserRegistration): Promise<{ userId: string }> {
    return apiClient.post('/api/users/register', data);
  }

  async registerClan(data: ClanRegistration): Promise<{ clanId: number }> {
    return apiClient.post('/api/users/register-clan', data);
  }

  async updateProfile(data: Partial<UserRegistration>): Promise<void> {
    return apiClient.put('/api/users/profile', data);
  }
}

export const userService = new UserService();
```

### Clan Operations

```typescript
// clan.service.ts
import { apiClient } from './api-client';

interface Clan {
  clanId: number;
  rovioId: number;
  name: string;
  country: string;
  active: boolean;
  registrationDate: string;
}

interface ClanQuery {
  search?: string;
  country?: string;
  active?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'country' | 'registrationDate';
  sortOrder?: 'asc' | 'desc';
}

interface ClanListResponse {
  clans: Clan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ClanService {
  async listClans(query: ClanQuery = {}): Promise<ClanListResponse> {
    const params = new URLSearchParams(
      query as Record<string, string>
    ).toString();
    return apiClient.get(`/api/clans?${params}`);
  }

  async getClan(clanId: number): Promise<Clan> {
    return apiClient.get(`/api/clans/${clanId}`);
  }

  async updateClan(
    clanId: number,
    data: Partial<Pick<Clan, 'name' | 'country' | 'active'>>
  ): Promise<Clan> {
    return apiClient.put(`/api/clans/${clanId}`, data);
  }
}

export const clanService = new ClanService();
```

### Roster Management

```typescript
// roster.service.ts
import { apiClient } from './api-client';

interface RosterMember {
  playerId: number;
  clanId: number;
  playerName: string;
  active: boolean;
  joinedDate: string;
  leftDate: string | null;
  kickedDate: string | null;
}

interface AddPlayerRequest {
  playerName: string;
  joinedDate?: string;
}

interface PlayerHistory {
  player: RosterMember;
  summary: {
    totalBattles: number;
    totalParticipated: number;
    averageScore: number;
    averageRatio: number;
    participationRate: number;
  };
  recentBattles: Array<{
    battleId: string;
    startDate: string;
    participated: boolean;
    score: number | null;
    ratio: number | null;
  }>;
}

export class RosterService {
  async getRoster(clanId: number, active?: boolean): Promise<RosterMember[]> {
    const params = active !== undefined ? `?active=${active}` : '';
    const response = await apiClient.get<{
      players: RosterMember[];
    }>(`/api/clans/${clanId}/roster${params}`);
    return response.players;
  }

  async addPlayer(
    clanId: number,
    data: AddPlayerRequest
  ): Promise<RosterMember> {
    return apiClient.post(`/api/clans/${clanId}/roster`, data);
  }

  async updatePlayer(
    clanId: number,
    playerId: number,
    data: { playerName?: string }
  ): Promise<RosterMember> {
    return apiClient.put(`/api/clans/${clanId}/roster/${playerId}`, data);
  }

  async markPlayerLeft(
    clanId: number,
    playerId: number,
    leftDate?: string
  ): Promise<void> {
    return apiClient.post(`/api/clans/${clanId}/roster/${playerId}/left`, {
      leftDate,
    });
  }

  async markPlayerKicked(
    clanId: number,
    playerId: number,
    reason?: string
  ): Promise<void> {
    return apiClient.post(`/api/clans/${clanId}/roster/${playerId}/kicked`, {
      reason,
    });
  }

  async reactivatePlayer(
    clanId: number,
    playerId: number,
    joinedDate?: string
  ): Promise<void> {
    return apiClient.post(
      `/api/clans/${clanId}/roster/${playerId}/reactivate`,
      { joinedDate }
    );
  }

  async getPlayerHistory(
    clanId: number,
    playerId: number
  ): Promise<PlayerHistory> {
    return apiClient.get(`/api/clans/${clanId}/roster/${playerId}/history`);
  }
}

export const rosterService = new RosterService();
```

### Battle Operations

```typescript
// battle.service.ts
import { apiClient } from './api-client';

interface BattleEntry {
  startDate: string;
  endDate: string;
  opponentRovioId: number;
  opponentName: string;
  opponentCountry: string;
  score: number;
  baselineFp: number;
  opponentScore: number;
  opponentFp: number;
  playerStats: Array<{
    playerId: number;
    rank: number;
    score: number;
    fp: number;
  }>;
  nonPlayerStats: Array<{
    playerId: number;
    fp: number;
    reserve: boolean;
  }>;
  actionCodes?: Array<{
    playerId: number;
    actionCode: string;
    actionReason?: string;
  }>;
}

interface Battle {
  battleId: string;
  clanId: number;
  startDate: string;
  endDate: string;
  score: number;
  opponentScore: number;
  result: number;
  ratio: number;
  averageRatio: number;
}

export class BattleService {
  async getBattles(
    clanId: number,
    query: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ battles: Battle[]; total: number }> {
    const params = new URLSearchParams(query as any).toString();
    return apiClient.get(`/api/clans/${clanId}/battles?${params}`);
  }

  async getBattle(clanId: number, battleId: string): Promise<Battle> {
    return apiClient.get(`/api/clans/${clanId}/battles/${battleId}`);
  }

  async createBattle(clanId: number, data: BattleEntry): Promise<Battle> {
    return apiClient.post(`/api/clans/${clanId}/battles`, data);
  }

  async updateBattle(
    clanId: number,
    battleId: string,
    data: Partial<BattleEntry>
  ): Promise<Battle> {
    return apiClient.put(`/api/clans/${clanId}/battles/${battleId}`, data);
  }

  async deleteBattle(clanId: number, battleId: string): Promise<void> {
    return apiClient.delete(`/api/clans/${clanId}/battles/${battleId}`);
  }
}

export const battleService = new BattleService();
```

## Python

### Basic Setup

```python
# api_client.py
import requests
from typing import Dict, Any, Optional
from requests.cookies import RequestsCookieJar

class ApiClient:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"

        response = self.session.request(
            method=method,
            url=url,
            json=data,
            params=params
        )

        if not response.ok:
            error_data = response.json()
            raise Exception(f"{error_data.get('error')}: {error_data.get('message')}")

        return response.json()

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        return self._request("GET", endpoint, params=params)

    def post(self, endpoint: str, data: Dict) -> Dict:
        return self._request("POST", endpoint, data=data)

    def put(self, endpoint: str, data: Dict) -> Dict:
        return self._request("PUT", endpoint, data=data)

    def delete(self, endpoint: str) -> Dict:
        return self._request("DELETE", endpoint)

# Usage
client = ApiClient()
```

### Authentication

```python
# auth_service.py
from api_client import ApiClient
from typing import Dict, Optional

class AuthService:
    def __init__(self, client: ApiClient):
        self.client = client

    def login(self, username: str, password: str) -> None:
        """Login and store session cookies"""
        self.client.post("/auth/login-with-password", {
            "username": username,
            "password": password
        })

    def logout(self) -> None:
        """Logout and clear session"""
        self.client.post("/auth/logout", {})

    def get_current_user(self) -> Dict:
        """Get currently authenticated user"""
        return self.client.get("/auth/user")

    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        try:
            response = self.client.get("/auth/status")
            return response.get("authenticated", False)
        except:
            return False

# Usage
client = ApiClient()
auth = AuthService(client)

auth.login("testuser", "password")
user = auth.get_current_user()
print(f"Logged in as: {user['preferred_username']}")
```

### Clan Operations

```python
# clan_service.py
from api_client import ApiClient
from typing import Dict, List, Optional

class ClanService:
    def __init__(self, client: ApiClient):
        self.client = client

    def list_clans(
        self,
        search: Optional[str] = None,
        country: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict:
        """Get list of clans with optional filtering"""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if country:
            params["country"] = country

        return self.client.get("/api/clans", params=params)

    def get_clan(self, clan_id: int) -> Dict:
        """Get clan details"""
        return self.client.get(f"/api/clans/{clan_id}")

    def update_clan(self, clan_id: int, data: Dict) -> Dict:
        """Update clan information"""
        return self.client.put(f"/api/clans/{clan_id}", data)

# Usage
client = ApiClient()
clan_service = ClanService(client)

# List all clans
clans = clan_service.list_clans()
for clan in clans['clans']:
    print(f"{clan['name']} - {clan['country']}")

# Get specific clan
clan = clan_service.get_clan(1)
print(f"Clan: {clan['name']}, Battles: {clan['stats']['totalBattles']}")
```

## React Integration

### API Context and Hooks

```typescript
// contexts/ApiContext.tsx
import React, { createContext, useContext } from 'react';
import { apiClient } from '../services/api-client';
import { authService } from '../services/auth.service';
import { clanService } from '../services/clan.service';
import { rosterService } from '../services/roster.service';
import { battleService } from '../services/battle.service';

interface ApiContextValue {
  auth: typeof authService;
  clans: typeof clanService;
  roster: typeof rosterService;
  battles: typeof battleService;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const value: ApiContextValue = {
    auth: authService,
    clans: clanService,
    roster: rosterService,
    battles: battleService,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
}
```

### Authentication Hook

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

interface User {
  sub: string;
  preferred_username: string;
  email: string;
  clanId: number | null;
  roles: string[];
}

export function useAuth() {
  const { auth } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const isAuth = await auth.isAuthenticated();
      if (isAuth) {
        const userData = await auth.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    await auth.login({ username, password });
    await checkAuth();
  }

  async function logout() {
    await auth.logout();
    setUser(null);
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole: (role: string) => user?.roles.includes(role) ?? false,
    login,
    logout,
  };
}
```

### Data Fetching Hook

```typescript
// hooks/useClans.ts
import { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

export function useClans() {
  const { clans } = useApi();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadClans();
  }, []);

  async function loadClans() {
    try {
      setLoading(true);
      const response = await clans.listClans();
      setData(response.clans);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, refetch: loadClans };
}
```

### Component Example

```typescript
// components/ClanList.tsx
import React from 'react';
import { useClans } from '../hooks/useClans';

export function ClanList() {
  const { data: clans, loading, error } = useClans();

  if (loading) return <div>Loading clans...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Clans</h2>
      <ul>
        {clans.map((clan) => (
          <li key={clan.clanId}>
            {clan.name} - {clan.country}
            ({clan.battleCount} battles)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Common Use Cases

### Complete User Registration Flow

```typescript
async function registerNewUser(
  username: string,
  email: string,
  password: string
) {
  try {
    // 1. Register user
    const { userId } = await userService.register({
      username,
      email,
      password,
    });

    console.log(`User created: ${userId}`);

    // 2. Auto-login
    await authService.login({ username, password });

    // 3. Get user profile
    const user = await authService.getCurrentUser();

    console.log(`Logged in as: ${user.preferred_username}`);

    return user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}
```

### Create Clan and Add Players

```typescript
async function setupNewClan(clanData: ClanRegistration, playerNames: string[]) {
  try {
    // 1. Register clan (user becomes owner)
    const { clanId } = await userService.registerClan(clanData);

    console.log(`Clan created: ${clanId}`);

    // 2. Add players to roster
    const players = await Promise.all(
      playerNames.map((playerName) =>
        rosterService.addPlayer(clanId, { playerName })
      )
    );

    console.log(`Added ${players.length} players`);

    return { clanId, players };
  } catch (error) {
    console.error('Clan setup failed:', error);
    throw error;
  }
}

// Usage
await setupNewClan(
  {
    rovioId: 123456,
    name: 'Awesome Clan',
    country: 'United States',
  },
  ['Player1', 'Player2', 'Player3']
);
```

### Record Battle with Full Details

```typescript
async function recordBattle(clanId: number) {
  // Get active roster
  const roster = await rosterService.getRoster(clanId, true);

  // Prepare battle data
  const battleData: BattleEntry = {
    startDate: '2024-12-15',
    endDate: '2024-12-16',
    opponentRovioId: 789012,
    opponentName: 'Rival Clan',
    opponentCountry: 'Canada',
    score: 4500000,
    baselineFp: 85000,
    opponentScore: 4200000,
    opponentFp: 82000,

    // Player stats (who participated)
    playerStats: roster.slice(0, 30).map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      score: Math.floor(Math.random() * 300000) + 100000,
      fp: Math.floor(Math.random() * 2000) + 2000,
    })),

    // Non-players (reserves and absent)
    nonPlayerStats: roster.slice(30).map((player) => ({
      playerId: player.playerId,
      fp: Math.floor(Math.random() * 2000) + 2000,
      reserve: Math.random() > 0.5,
    })),

    // Action codes
    actionCodes: roster.map((player) => ({
      playerId: player.playerId,
      actionCode: 'HOLD',
    })),
  };

  // Submit battle
  const battle = await battleService.createBattle(clanId, battleData);

  console.log(`Battle ${battle.battleId} recorded`);
  console.log(`Result: ${battle.result > 0 ? 'WIN' : 'LOSS'}`);
  console.log(`Ratio: ${battle.ratio.toFixed(2)}`);

  return battle;
}
```

### Generate Monthly Report

```typescript
async function generateMonthlyReport(clanId: number, monthId: string) {
  try {
    // Get monthly statistics
    const stats = await apiClient.get(
      `/api/clans/${clanId}/stats/months/${monthId}`
    );

    // Generate report
    const report = {
      month: monthId,
      battles: stats.clanStats.battleCount,
      wins: stats.clanStats.wins,
      losses: stats.clanStats.losses,
      ties: stats.clanStats.ties,
      winRate: (
        (stats.clanStats.wins / stats.clanStats.battleCount) *
        100
      ).toFixed(1),
      averageRatio: stats.clanStats.averageRatio.toFixed(2),
      topPlayers: stats.individualStats
        .sort((a, b) => b.averageRatio - a.averageRatio)
        .slice(0, 5),
    };

    console.log('Monthly Report for', monthId);
    console.log('='.repeat(50));
    console.log(`Battles: ${report.battles}`);
    console.log(`Record: ${report.wins}-${report.losses}-${report.ties}`);
    console.log(`Win Rate: ${report.winRate}%`);
    console.log(`Average Ratio: ${report.averageRatio}`);
    console.log('\nTop 5 Players:');
    report.topPlayers.forEach((player, i) => {
      console.log(
        `${i + 1}. ${player.playerName}: ${player.averageRatio.toFixed(2)}`
      );
    });

    return report;
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}
```

## Error Handling Patterns

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors or client errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('400')
      ) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage
const clans = await fetchWithRetry(() => clanService.listClans());
```

### Global Error Handler

```typescript
// error-handler.ts
export class ApiErrorHandler {
  static handle(error: Error): void {
    console.error('API Error:', error);

    if (error.message.includes('401')) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('403')) {
      // Show permission denied message
      alert('You do not have permission to perform this action');
    } else if (error.message.includes('429')) {
      // Rate limited
      alert('Too many requests. Please try again later.');
    } else if (error.message.includes('500')) {
      // Server error
      alert('Server error. Please try again later.');
    } else {
      // Generic error
      alert(`Error: ${error.message}`);
    }
  }
}

// Usage in async function
try {
  await battleService.createBattle(clanId, data);
} catch (error) {
  ApiErrorHandler.handle(error as Error);
}
```

### Type-Safe Error Responses

```typescript
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

class ApiException extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiException';
  }

  static fromResponse(status: number, data: ApiError): ApiException {
    return new ApiException(status, data.error, data.message);
  }

  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }
}

// Enhanced API client with typed errors
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw ApiException.fromResponse(response.status, errorData);
  }

  return response.json();
}
```

## Testing

### Mock API Client for Tests

```typescript
// __mocks__/api-client.ts
export class MockApiClient {
  private mockData: Record<string, any> = {};

  setMockData(endpoint: string, data: any) {
    this.mockData[endpoint] = data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.mockData[endpoint] || null;
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.mockData[endpoint] || {};
  }
}

// In tests
const mockClient = new MockApiClient();
mockClient.setMockData('/api/clans', {
  clans: [{ clanId: 1, name: 'Test Clan' }],
  pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
});
```

## Additional Resources

- [Authentication Guide](./AUTHENTICATION.md)
- [API Reference](./API-REFERENCE.md)
- [Error Handling Guide](./ERROR-HANDLING.md)
- [OpenAPI Specification](http://localhost:3001/docs/json)
