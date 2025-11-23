/**
 * ReportsPage Component
 * Landing page for all analytical reports
 * Stories: 7.1-7.4 (Epic 7: Performance Trend Reports)
 */

import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';
import { useParams, Link } from 'react-router-dom';

import type React from 'react';

interface ReportCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const reports: ReportCard[] = [
  {
    title: 'Flock Power Trends',
    description: "Track your clan's power level growth over time",
    icon: ArrowTrendingUpIcon,
    path: 'flock-power',
    color: 'bg-blue-500',
  },
  {
    title: 'Ratio Performance',
    description: 'Analyze skill trends independent of FP growth',
    icon: ChartBarIcon,
    path: 'ratio',
    color: 'bg-green-500',
  },
  {
    title: 'Participation Trends',
    description: 'Monitor member engagement and participation patterns',
    icon: UsersIcon,
    path: 'participation',
    color: 'bg-purple-500',
  },
  {
    title: 'Win/Loss Margins',
    description: 'See how competitive your battles are',
    icon: Square3Stack3DIcon,
    path: 'margin',
    color: 'bg-orange-500',
  },
  {
    title: 'Player Performance',
    description: 'Track individual player development over time',
    icon: UsersIcon,
    path: 'player',
    color: 'bg-indigo-500',
  },
  {
    title: 'Matchup Analysis',
    description: 'Analyze opponents and competitive environment',
    icon: ChartBarIcon,
    path: 'matchups',
    color: 'bg-red-500',
  },
];

export function ReportsPage() {
  const { clanId } = useParams<{ clanId: string }>();

  if (!clanId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-red-600">Error: Clan ID is required</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display mb-2 text-3xl font-bold text-gray-900">Performance Reports</h1>
        <p className="text-lg text-gray-600">
          Analyze your clan&apos;s performance trends with detailed reports and visualizations
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.path}
              to={`/clans/${clanId}/reports/${report.path}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start space-x-4">
                <div className={`rounded-lg p-3 ${report.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">{report.title}</h2>
                  <p className="text-gray-600">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-blue-900">About These Reports</h3>
        <p className="mb-4 text-blue-800">
          Each report provides interactive visualizations and trend analysis to help you understand
          your clan&apos;s performance over time. You can filter by date range and toggle between
          battle-by-battle and monthly aggregate views.
        </p>
        <ul className="list-inside list-disc space-y-1 text-blue-800">
          <li>All reports are publicly accessible (no login required)</li>
          <li>Data is updated in real-time as battles are recorded</li>
          <li>Charts are responsive and work on mobile devices</li>
          <li>Hover over data points for detailed information</li>
        </ul>
      </div>
    </div>
  );
}
