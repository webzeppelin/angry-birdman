/**
 * Dashboard Page
 * Story: 7.9 (Dashboard Summary View)
 *
 * Admin dashboard with key metrics, recent battles, and quick links.
 * Requires authentication and clan association.
 */

import {
  ChartBarIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface DashboardBattle {
  battleId: string;
  date: string;
  opponent: string;
  result: string;
  score: number;
  opponentScore: number;
  ratio: number;
  participationRate: number;
}

interface DashboardStats {
  monthId: string;
  battles: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  avgRatio: number;
  avgParticipation: number;
}

interface DashboardData {
  clan: {
    clanId: number;
    name: string;
    country: string;
    rovioId: number;
  };
  recentBattles: DashboardBattle[];
  nextBattleDate: string | null;
  currentMonth: DashboardStats;
  currentYear: DashboardStats;
  alerts: {
    pendingAdminRequests: number;
    incompleteBattleDrafts: number;
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const clanId = user?.clanId;

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', clanId],
    queryFn: async () => {
      const response = await apiClient.get<DashboardData>(`/api/clans/${clanId}/dashboard`);
      return response.data;
    },
    enabled: !!clanId,
  });

  // Redirect if user doesn't have clan association
  if (!user || !user.clanId) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-white p-12 text-center shadow-card">
            <div className="mb-4 text-6xl">🏠</div>
            <h2 className="mb-4 text-2xl font-semibold text-neutral-800">No Clan Association</h2>
            <p className="mb-6 text-neutral-600">
              You need to be associated with a clan to access the dashboard.
            </p>
            <button onClick={() => navigate('/clans')} className="btn-primary">
              Browse Clans
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 h-10 w-64 animate-pulse rounded bg-neutral-200"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-white"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="border-error rounded-lg border bg-white p-12 text-center shadow-card">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-4 text-2xl font-semibold text-neutral-800">
              Error Loading Dashboard
            </h2>
            <p className="text-neutral-600">Failed to load dashboard data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const { clan, recentBattles, nextBattleDate, currentMonth, currentYear, alerts } = data;

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-4xl text-neutral-800">{clan.name} Dashboard</h1>
          <p className="text-neutral-600">
            {clan.country} • Rovio ID: {clan.rovioId}
          </p>
        </div>

        {/* Key Metrics - Month and Year */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Month Win Rate */}
          <div className="rounded-lg bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <TrophyIcon className="h-5 w-5 text-success" />
              Month Win Rate
            </div>
            <div className="mb-1 text-3xl font-bold text-success">
              {currentMonth.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-500">
              {currentMonth.wins}W-{currentMonth.losses}L-{currentMonth.ties}T (
              {currentMonth.battles} battles)
            </div>
          </div>

          {/* Current Month Avg Ratio */}
          <div className="rounded-lg bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ChartBarIcon className="text-info h-5 w-5" />
              Month Avg Ratio
            </div>
            <div className="text-info mb-1 text-3xl font-bold">
              {currentMonth.avgRatio.toFixed(2)}
            </div>
            <div className="text-sm text-neutral-500">
              {currentMonth.avgParticipation.toFixed(1)}% participation
            </div>
          </div>

          {/* Year Win Rate */}
          <div className="rounded-lg bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <TrophyIcon className="h-5 w-5 text-warning" />
              Year Win Rate
            </div>
            <div className="mb-1 text-3xl font-bold text-warning">
              {currentYear.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-500">
              {currentYear.wins}W-{currentYear.losses}L-{currentYear.ties}T ({currentYear.battles}{' '}
              battles)
            </div>
          </div>

          {/* Year Avg Ratio */}
          <div className="rounded-lg bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              Year Avg Ratio
            </div>
            <div className="mb-1 text-3xl font-bold text-primary">
              {currentYear.avgRatio.toFixed(2)}
            </div>
            <div className="text-sm text-neutral-500">
              {currentYear.avgParticipation.toFixed(1)}% participation
            </div>
          </div>

          {/* Next Battle */}
          <div className="rounded-lg bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <CalendarIcon className="h-5 w-5 text-success" />
              Next Battle
            </div>
            <div className="mb-1 text-3xl font-bold text-success">
              {nextBattleDate
                ? new Date(nextBattleDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD'}
            </div>
            <div className="text-sm text-neutral-500">
              {nextBattleDate
                ? Math.ceil(
                    (new Date(nextBattleDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  ) + ' days'
                : 'No battles yet'}
            </div>
          </div>

          {/* Alerts (if any) */}
          {(alerts.pendingAdminRequests > 0 || alerts.incompleteBattleDrafts > 0) && (
            <div className="rounded-lg bg-white p-6 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
                <ClipboardDocumentListIcon className="text-error h-5 w-5" />
                Pending Items
              </div>
              <div className="space-y-1 text-sm">
                {alerts.pendingAdminRequests > 0 && (
                  <div className="text-error">
                    {alerts.pendingAdminRequests} admin request
                    {alerts.pendingAdminRequests !== 1 ? 's' : ''}
                  </div>
                )}
                {alerts.incompleteBattleDrafts > 0 && (
                  <div className="text-warning">
                    {alerts.incompleteBattleDrafts} incomplete draft
                    {alerts.incompleteBattleDrafts !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to={`/clans/${clanId}/battles/new`}
            className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-card transition-all hover:scale-105 hover:shadow-card-hover"
          >
            <div className="rounded-lg bg-primary/10 p-3">
              <PlusCircleIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-neutral-800">Record Battle</div>
              <div className="text-sm text-neutral-600">Enter new CvC results</div>
            </div>
          </Link>

          <Link
            to={`/clans/${clanId}/roster`}
            className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-card transition-all hover:scale-105 hover:shadow-card-hover"
          >
            <div className="bg-info/10 rounded-lg p-3">
              <UsersIcon className="text-info h-8 w-8" />
            </div>
            <div>
              <div className="font-semibold text-neutral-800">Manage Roster</div>
              <div className="text-sm text-neutral-600">Add/edit clan members</div>
            </div>
          </Link>

          <Link
            to={`/clans/${clanId}/reports`}
            className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-card transition-all hover:scale-105 hover:shadow-card-hover"
          >
            <div className="rounded-lg bg-success/10 p-3">
              <ChartBarIcon className="h-8 w-8 text-success" />
            </div>
            <div>
              <div className="font-semibold text-neutral-800">View Reports</div>
              <div className="text-sm text-neutral-600">Analytics & trends</div>
            </div>
          </Link>

          <Link
            to={`/clans/${clanId}/stats/months/${currentMonth.monthId}`}
            className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-card transition-all hover:scale-105 hover:shadow-card-hover"
          >
            <div className="rounded-lg bg-warning/10 p-3">
              <CalendarIcon className="h-8 w-8 text-warning" />
            </div>
            <div>
              <div className="font-semibold text-neutral-800">Monthly Stats</div>
              <div className="text-sm text-neutral-600">Current month summary</div>
            </div>
          </Link>
        </div>

        {/* Recent Battles */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-card">
          <h2 className="mb-6 text-xl font-semibold text-neutral-800">Recent Battles</h2>
          {recentBattles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-sm text-neutral-600">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Opponent</th>
                    <th className="pb-3 font-medium">Result</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Ratio</th>
                    <th className="pb-3 font-medium">Participation</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentBattles.map((battle) => (
                    <tr
                      key={battle.battleId}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 text-sm text-neutral-600">
                        {new Date(battle.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-medium text-neutral-800">{battle.opponent}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            battle.result === 'Won'
                              ? 'bg-success/10 text-success'
                              : battle.result === 'Lost'
                                ? 'bg-error/10 text-error'
                                : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {battle.result}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <span className="font-semibold">{battle.score.toLocaleString()}</span>
                        <span className="text-neutral-500">
                          {' '}
                          - {battle.opponentScore.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-neutral-800">
                        {battle.ratio.toFixed(2)}
                      </td>
                      <td className="py-3 text-sm text-neutral-600">
                        {battle.participationRate.toFixed(1)}%
                      </td>
                      <td className="py-3">
                        <Link
                          to={`/clans/${clanId}/battles/${battle.battleId}`}
                          className="text-sm font-medium text-primary hover:text-primary-600"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-500">
              No battles recorded yet. Get started by recording your first battle!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
