/**
 * MarginReportPage Component
 * Displays win/loss margin trend analysis over time
 * Story: 7.4 (View Win/Loss Margin Report)
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { DateRangePicker } from '@/components/charts/DateRangePicker';
import { apiClient } from '@/lib/api-client';

interface TrendResponse {
  margin: Array<{
    date: string;
    battleId: string;
    marginRatio: number;
    isWin: boolean;
    isLoss: boolean;
    isTie: boolean;
  }>;
  summary: {
    winLossSummary: {
      wins: number;
      losses: number;
      ties: number;
      winRate: number;
      avgWinMargin: number;
      avgLossMargin: number;
    };
  };
}

export function MarginReportPage() {
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

  // Color bars based on result
  const getBarColor = (entry: TrendResponse['margin'][0]) => {
    if (entry.isWin) return '#10b981'; // green
    if (entry.isLoss) return '#ef4444'; // red
    return '#6b7280'; // gray for ties
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display mb-2 text-3xl font-bold text-gray-900">
          Win/Loss Margin Trends
        </h1>
        <p className="text-gray-600">See how competitive your battles are</p>
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
          {data.margin.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Wins</h3>
                <p className="text-2xl font-bold text-green-600">
                  {data.summary.winLossSummary.wins}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Losses</h3>
                <p className="text-2xl font-bold text-red-600">
                  {data.summary.winLossSummary.losses}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Ties</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {data.summary.winLossSummary.ties}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Win Rate</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.winLossSummary.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-md">
                <h3 className="mb-1 text-sm font-medium text-gray-600">Avg Win Margin</h3>
                <p className="text-2xl font-bold text-green-600">
                  +{data.summary.winLossSummary.avgWinMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Margins Over Time</h2>
            {data.margin.length === 0 ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-gray-600">No battle data available for the selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.margin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Bar
                    dataKey="marginRatio"
                    fill="#10b981"
                    name="Margin Ratio"
                    shape={(props: object) => {
                      const typedProps = props as {
                        payload: TrendResponse['margin'][0];
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                      };
                      return (
                        <rect
                          x={typedProps.x}
                          y={typedProps.y}
                          width={typedProps.width}
                          height={typedProps.height}
                          fill={getBarColor(typedProps.payload)}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">About This Report</h3>
            <p className="text-sm text-blue-800">
              This chart shows how decisive your wins and losses are. Positive bars (green) indicate
              wins, negative bars (red) show losses, and gray bars represent ties. Larger margins
              indicate more dominant performances, while smaller margins suggest competitive
              battles. The margin ratio is calculated as ((your score - opponent score) / your
              score) × 100.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
