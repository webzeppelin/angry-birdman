/**
 * Roster Churn Report Page
 * Story: 7.8 (View Roster Churn Report)
 *
 * Displays roster stability metrics, churn trends, action code frequency,
 * and longest-tenured members to help clan admins understand member retention.
 */

import { XCircleIcon, ClockIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { DateRangePicker } from '@/components/charts/DateRangePicker';
import { apiClient } from '@/lib/api-client';

interface ChurnByMonth {
  month: string;
  joined: number;
  left: number;
  kicked: number;
}

interface ActionCodeFrequency {
  actionCode: string;
  count: number;
  percentage: number;
}

interface LongestTenured {
  playerId: number;
  playerName: string;
  joinedDate: string;
  tenureDays: number;
}

interface ChurnSummary {
  activeMembers: number;
  inactiveMembers: number;
  totalJoined: number;
  totalLeft: number;
  totalKicked: number;
  retentionRate: number;
  avgTenureDays: number;
}

interface RosterChurnData {
  churnByMonth: ChurnByMonth[];
  actionCodeFrequency: ActionCodeFrequency[];
  summary: ChurnSummary;
  longestTenured: LongestTenured[];
}

const ACTION_CODE_COLORS: Record<string, string> = {
  HOLD: '#3b82f6', // blue
  PASS: '#10b981', // green
  WARN: '#f59e0b', // amber
  KICK: '#ef4444', // red
  RESERVE: '#8b5cf6', // purple
};

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function RosterChurnReportPage() {
  const { clanId } = useParams<{ clanId: string }>();

  // Date range state
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // Date range change handler
  const handleDateRangeChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Fetch roster churn data
  const { data, isLoading, error } = useQuery({
    queryKey: ['roster-churn', clanId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.replace(/-/g, ''));
      if (endDate) params.append('endDate', endDate.replace(/-/g, ''));
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<RosterChurnData>(
        `/api/clans/${clanId}/reports/roster-churn${query}`
      );
      return response.data;
    },
    enabled: !!clanId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 h-10 w-64 animate-pulse rounded bg-neutral-200"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <div className="shadow-card border-error rounded-lg border bg-white p-12 text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Error Loading Data</h2>
            <p className="text-neutral-600">Failed to load roster churn data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const { churnByMonth, actionCodeFrequency, summary, longestTenured } = data;

  // Prepare data for charts
  const churnChartData = churnByMonth.map((m) => ({
    month: m.month,
    Joined: m.joined,
    Left: m.left,
    Kicked: m.kicked,
  }));

  const actionCodePieData = actionCodeFrequency.map((ac) => ({
    name: ac.actionCode,
    value: ac.count,
    percentage: ac.percentage,
  }));

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4 text-sm text-neutral-600">
            <Link to={`/clans/${clanId}`} className="hover:text-primary">
              Clan
            </Link>
            <span className="mx-2">/</span>
            <Link to={`/clans/${clanId}/reports`} className="hover:text-primary">
              Reports
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-neutral-800">Roster Churn</span>
          </nav>
          <h1 className="font-display mb-2 text-4xl text-neutral-800">Roster Churn Analysis</h1>
          <p className="text-neutral-600">
            Track roster stability, member retention, and turnover patterns
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="shadow-card mb-8 rounded-lg bg-white p-6">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Members */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <UsersIcon className="text-success h-5 w-5" />
              Active Members
            </div>
            <div className="text-success mb-1 text-3xl font-bold">{summary.activeMembers}</div>
            <div className="text-sm text-neutral-500">{summary.inactiveMembers} inactive</div>
          </div>

          {/* Retention Rate */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ChartBarIcon className="text-info h-5 w-5" />
              Retention Rate
            </div>
            <div className="text-info mb-1 text-3xl font-bold">
              {summary.retentionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-500">{summary.totalJoined} total joined</div>
          </div>

          {/* Average Tenure */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ClockIcon className="text-warning h-5 w-5" />
              Avg. Tenure
            </div>
            <div className="text-warning mb-1 text-3xl font-bold">{summary.avgTenureDays}</div>
            <div className="text-sm text-neutral-500">days</div>
          </div>

          {/* Churn Rate */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
              <XCircleIcon className="text-error h-5 w-5" />
              Total Departures
            </div>
            <div className="text-error mb-1 text-3xl font-bold">
              {summary.totalLeft + summary.totalKicked}
            </div>
            <div className="text-sm text-neutral-500">
              {summary.totalLeft} left, {summary.totalKicked} kicked
            </div>
          </div>
        </div>

        {/* Churn by Month Chart */}
        <div className="shadow-card mb-8 rounded-lg bg-white p-6">
          <h2 className="mb-6 text-xl font-semibold text-neutral-800">Monthly Roster Changes</h2>
          {churnByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={churnChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Joined" fill="#10b981" />
                <Bar dataKey="Left" fill="#f59e0b" />
                <Bar dataKey="Kicked" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-neutral-500">
              No roster changes in the selected time period
            </div>
          )}
        </div>

        {/* Two-column layout for Action Codes and Longest Tenured */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Action Code Frequency */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold text-neutral-800">
              Action Code Distribution
            </h2>
            {actionCodeFrequency.length > 0 ? (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={actionCodePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: { name: string; percentage: number }) =>
                          `${entry.name} (${entry.percentage}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {actionCodePieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ACTION_CODE_COLORS[entry.name] ||
                              CHART_COLORS[index % CHART_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    {actionCodeFrequency.map((ac) => (
                      <div key={ac.actionCode} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{
                              backgroundColor:
                                ACTION_CODE_COLORS[ac.actionCode] ||
                                CHART_COLORS[actionCodeFrequency.indexOf(ac) % CHART_COLORS.length],
                            }}
                          />
                          <span className="font-medium text-neutral-700">{ac.actionCode}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-neutral-800">{ac.count}</div>
                          <div className="text-xs text-neutral-500">{ac.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500">
                No action code data available
              </div>
            )}
          </div>

          {/* Longest Tenured Members */}
          <div className="shadow-card rounded-lg bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold text-neutral-800">Longest Tenured Members</h2>
            {longestTenured.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-sm text-neutral-600">
                      <th className="pb-3 font-medium">Rank</th>
                      <th className="pb-3 font-medium">Player</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 text-right font-medium">Tenure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {longestTenured.map((member, index) => (
                      <tr key={member.playerId} className="border-b border-neutral-100">
                        <td className="py-3 text-neutral-600">{index + 1}</td>
                        <td className="py-3">
                          <Link
                            to={`/clans/${clanId}/roster/${member.playerId}/history`}
                            className="text-primary hover:text-primary-600 font-medium"
                          >
                            {member.playerName}
                          </Link>
                        </td>
                        <td className="py-3 text-sm text-neutral-600">
                          {new Date(member.joinedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right font-semibold text-neutral-800">
                          {member.tenureDays} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500">No active members found</div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to={`/clans/${clanId}/reports`}
            className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium"
          >
            ← Back to Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
