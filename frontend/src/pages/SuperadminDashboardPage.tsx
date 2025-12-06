/**
 * Superadmin Dashboard Page
 * Story 2.16: Manage Users (Superadmin)
 *
 * System overview dashboard for superadmins with key metrics
 * and navigation to user management and audit log pages.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalUsers: number;
  totalClans: number;
  activeClans: number;
  recentRegistrations: number;
}

interface RecentUser {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  clanName: string | null;
}

async function getDashboardStats(): Promise<DashboardStats> {
  // Get counts from user and clan endpoints
  const [usersRes, clansRes] = await Promise.all([
    apiClient.get<{ users: unknown[]; pagination: { total: number } }>('/api/admin/users', {
      params: { limit: 1 },
    }),
    apiClient.get<{ clans: { active: boolean }[] }>('/api/clans'),
  ]);

  const totalUsers = usersRes.data.pagination.total;
  const totalClans = clansRes.data.clans.length;
  const activeClans = clansRes.data.clans.filter((clan: { active: boolean }) => clan.active).length;

  // Get recent registrations (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsersRes = await apiClient.get<{
    users: RecentUser[];
  }>('/api/admin/users', {
    params: { limit: 100 },
  });

  const recentRegistrations = recentUsersRes.data.users.filter((user: RecentUser) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= sevenDaysAgo;
  }).length;

  return {
    totalUsers,
    totalClans,
    activeClans,
    recentRegistrations,
  };
}

async function getRecentUsers(): Promise<RecentUser[]> {
  const response = await apiClient.get<{ users: RecentUser[] }>('/api/admin/users', {
    params: { limit: 10 },
  });
  return response.data.users;
}

export default function SuperadminDashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const {
    data: recentUsers,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['recent-users'],
    queryFn: getRecentUsers,
  });

  if (statsLoading || usersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (statsError || usersError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Failed to load dashboard data. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600">Manage users, clans, and view system activity</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon="👥"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Total Clans"
          value={stats?.totalClans ?? 0}
          icon="🛡️"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Active Clans"
          value={stats?.activeClans ?? 0}
          icon="✅"
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="New Users (7 days)"
          value={stats?.recentRegistrations ?? 0}
          icon="📈"
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="User Management"
          description="Search, view, and manage all user accounts in the system"
          icon="👤"
          linkTo="/admin/users"
          linkText="Manage Users"
        />
        <ActionCard
          title="Battle Schedule"
          description="Manage the centralized Master Battle schedule and auto-generation"
          icon="📅"
          linkTo="/admin/battle-schedule"
          linkText="Manage Schedule"
        />
        <ActionCard
          title="Audit Log"
          description="View all administrative actions and system activity"
          icon="📋"
          linkTo="/admin/audit-logs"
          linkText="View Audit Log"
        />
      </div>

      {/* Recent Users */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
        </div>
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
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {user.clanName || <span className="text-gray-400 italic">No clan</span>}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-6 py-4 text-right">
          <Link to="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View all users →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div
          className={`text-4xl ${color} flex h-16 w-16 items-center justify-center rounded-full`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  linkTo: string;
  linkText: string;
}

function ActionCard({ title, description, icon, linkTo, linkText }: ActionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mb-4 text-gray-600">{description}</p>
          <Link
            to={linkTo}
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
