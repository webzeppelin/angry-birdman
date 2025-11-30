/**
 * ParticipationReportPage Component
 * Displays participation trend analysis over time
 * Story: 7.3 (View Participation Report)
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { DateRangePicker } from '@/components/charts/DateRangePicker';
import { apiClient } from '@/lib/api-client';

interface TrendResponse {
  participation: Array<{
    date: string;
    battleId: string;
    nonplayingFpRatio: number;
    reserveFpRatio: number;
    participationRate: number;
  }>;
  summary: {
    participationTrend: {
      average: number;
      min: number;
      max: number;
    };
  };
}

export function ParticipationReportPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [aggregation, setAggregation] = useState<'battle' | 'monthly'>('battle');

  const { data, isLoading, error } = useQuery<TrendResponse>({
    queryKey: ['trends', clanId, startDate, endDate, aggregation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('aggregation', aggregation);

      const response = await apiClient.get<TrendResponse>(
        `/api/clans/${clanId}/reports/trends?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!clanId,
  });

  const handleDateRangeChange = (start?: string, end?: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!clanId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-red-600">Error: Clan ID is required</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display mb-2 text-3xl font-bold text-gray-900">Participation Trends</h1>
        <p className="text-gray-600">Monitor member engagement and participation patterns</p>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <DateRangePicker onDateRangeChange={handleDateRangeChange} className="mb-4" />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">View Mode</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setAggregation('battle')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                aggregation === 'battle'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Battle-by-Battle
            </button>
            <button
              type="button"
              onClick={() => setAggregation('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                aggregation === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly Average
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-lg text-gray-600">Loading trend data...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error loading trend data. Please try again.</p>
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.participation.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Avg Participation</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.participationTrend.average.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Best Participation</h3>
                <p className="text-2xl font-bold text-green-600">
                  {data.summary.participationTrend.max.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Worst Participation</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {data.summary.participationTrend.min.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Participation Over Time</h2>
            {data.participation.length === 0 ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-gray-600">No battle data available for the selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.participation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line
                    type="monotone"
                    dataKey="participationRate"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Participation Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="nonplayingFpRatio"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Nonplaying FP %"
                  />
                  <Line
                    type="monotone"
                    dataKey="reserveFpRatio"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Reserve FP %"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">About This Report</h3>
            <p className="text-sm text-blue-800">
              This report tracks member engagement in battles. <strong>Participation Rate</strong>{' '}
              (purple line) shows the percentage of active members who played.{' '}
              <strong>Nonplaying FP %</strong> (orange line) shows unused power from inactive
              members. <strong>Reserve FP %</strong> (red line) tracks strategic FP management.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
