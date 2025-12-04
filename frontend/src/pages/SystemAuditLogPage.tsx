/**
 * System Audit Log Page
 * Story 2.17: View Audit Log (Superadmin)
 *
 * Comprehensive audit log viewer with filtering by date range, user, action type, and clan.
 * Includes export functionality to CSV/JSON.
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';

interface AuditLog {
  logId: number;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AuditFilters {
  userId: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

async function getAuditLogs(filters: AuditFilters): Promise<AuditLogsResponse> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.userId) params.userId = filters.userId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await apiClient.get<AuditLogsResponse>('/api/audit-logs', { params });
  return response.data;
}

async function exportAuditLogs(
  format: 'json' | 'csv',
  filters: Omit<AuditFilters, 'page' | 'limit'>
): Promise<void> {
  const params: Record<string, string> = { format };

  if (filters.userId) params.userId = filters.userId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await apiClient.get('/api/audit-logs/export', {
    params,
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatActionType(action: string): string {
  // Convert ACTION_TYPE to readable format
  return action
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function formatResourceType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export default function SystemAuditLogPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    userId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  });

  const handleFilterChange = (key: keyof AuditFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      await exportAuditLogs(format, {
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } catch (error) {
      alert('Failed to export audit logs');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading audit logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Failed to load audit logs. Please try again later.</div>
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">System Audit Log</h1>
        <p className="text-gray-600">View all administrative actions and system activity</p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* User ID Filter */}
          <div>
            <label htmlFor="userId" className="mb-2 block text-sm font-medium text-gray-700">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user ID..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleClearFilters}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            Showing {logs.length} of {pagination?.total ?? 0} logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleExport('csv')}
              disabled={isExporting}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => void handleExport('json')}
              disabled={isExporting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Resource
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {log.username}
                      <div className="text-xs text-gray-500">{log.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {formatActionType(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {formatResourceType(log.resourceType)}
                      <div className="text-xs text-gray-500">{log.resourceId}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Audit Log Details</h3>
            <div className="mb-6 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                <p className="text-sm text-gray-900">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">User:</span>
                <p className="text-sm text-gray-900">
                  {selectedLog.username} ({selectedLog.userId})
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Action:</span>
                <p className="text-sm text-gray-900">{formatActionType(selectedLog.action)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Resource:</span>
                <p className="text-sm text-gray-900">
                  {formatResourceType(selectedLog.resourceType)} ({selectedLog.resourceId})
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Details:</span>
                <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-900">
                  {selectedLog.details || 'No additional details'}
                </pre>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
