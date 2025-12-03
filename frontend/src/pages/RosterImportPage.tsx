/**
 * Roster Import Page
 * Handles CSV import for bulk roster population
 * Story 3.9: Bulk Import Roster
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { apiClient } from '../lib/api-client';

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ playerName: string; error: string }>;
}

interface PlayerImport {
  playerName: string;
  joinedDate?: string;
}

export default function RosterImportPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvData, setCsvData] = useState<string>('');
  const [previewData, setPreviewData] = useState<PlayerImport[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Fetch CSV template
  const { data: template } = useQuery<{ csv: string; filename: string }>({
    queryKey: ['rosterTemplate', clanId],
    queryFn: async (): Promise<{ csv: string; filename: string }> => {
      const response = await apiClient.get(`/api/clans/${clanId}/roster/template`);
      return response.data as { csv: string; filename: string };
    },
    enabled: !!clanId,
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (players: PlayerImport[]) => {
      const response = await apiClient.post(`/clans/${clanId}/roster/import`, { players });
      return response.data as ImportResult;
    },
    onSuccess: (data) => {
      setImportResult(data);
      // Invalidate roster query to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['roster', clanId] });
      void queryClient.invalidateQueries({ queryKey: ['roster', Number(clanId)] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    try {
      setParseError(null);
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        setParseError('CSV file is empty');
        return;
      }

      // Skip header line if it exists
      const dataLines = lines[0]?.toLowerCase().includes('player') ? lines.slice(1) : lines;

      const players: PlayerImport[] = [];
      const errors: string[] = [];

      dataLines.forEach((line, index) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));

        if (parts.length < 1 || !parts[0]) {
          errors.push(`Line ${index + 1}: Missing player name`);
          return;
        }

        const player: PlayerImport = {
          playerName: parts[0],
        };

        // Optional joined date
        if (parts.length > 1 && parts[1]) {
          // Validate date format
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (datePattern.test(parts[1])) {
            player.joinedDate = parts[1];
          } else {
            errors.push(
              `Line ${index + 1}: Invalid date format for "${parts[0]}" (use YYYY-MM-DD)`
            );
          }
        }

        players.push(player);
      });

      if (errors.length > 0) {
        setParseError(errors.join('\n'));
      }

      setPreviewData(players);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse CSV');
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setCsvData(text);
    if (text.trim()) {
      parseCSV(text);
    } else {
      setPreviewData([]);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) return;
    setImportResult(null);
    importMutation.mutate(previewData);
  };

  const handleDownloadTemplate = () => {
    if (!template) return;

    const blob = new Blob([template.csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCsvData('');
    setPreviewData([]);
    setImportResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Import Roster</h1>
            <p className="text-gray-600">Bulk import roster members from CSV file</p>
          </div>
          <Link
            to={`/clans/${clanId}/roster`}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to Roster
          </Link>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-blue-900">Import Instructions</h2>
        <ol className="list-inside list-decimal space-y-1 text-blue-800">
          <li>Download the CSV template to see the correct format</li>
          <li>Fill in player names and optional joined dates (YYYY-MM-DD format)</li>
          <li>Upload your CSV file or paste the data below</li>
          <li>Review the preview and click &quot;Import Roster&quot;</li>
        </ol>
        <button
          onClick={handleDownloadTemplate}
          disabled={!template}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          Download CSV Template
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Upload CSV File</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
        />
        <p className="mt-2 text-sm text-gray-500">Or paste CSV data below</p>
      </div>

      {/* Text Input */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">CSV Data</h2>
        <textarea
          value={csvData}
          onChange={handleTextChange}
          placeholder="Player Name,Joined Date&#10;John Doe,2025-01-01&#10;Jane Smith,2025-01-15"
          className="h-48 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {csvData && (
          <button
            onClick={handleReset}
            className="mt-2 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Parse Errors */}
      {parseError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-900">Parse Errors</h2>
          <pre className="whitespace-pre-wrap text-sm text-red-800">{parseError}</pre>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && !parseError && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Preview ({previewData.length} players)
            </h2>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-green-300"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Roster'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Player Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {previewData.slice(0, 50).map((player, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-4 py-3">{player.playerName}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {player.joinedDate || <span className="text-gray-400">Today</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <p className="mt-2 text-center text-sm text-gray-500">
                Showing first 50 of {previewData.length} players
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div
          className={`mb-6 rounded-lg border p-6 ${importResult.failed === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${importResult.failed === 0 ? 'text-green-900' : 'text-yellow-900'}`}
          >
            Import Results
          </h2>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Successfully Imported:</span>
              <span className="ml-2 font-semibold text-green-600">{importResult.imported}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Failed:</span>
              <span className="ml-2 font-semibold text-red-600">{importResult.failed}</span>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-yellow-900">Errors:</h3>
              <div className="space-y-1">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{error.playerName}:</span>{' '}
                    <span className="text-yellow-800">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResult.imported > 0 && (
            <div className="mt-4">
              <button
                onClick={() => navigate(`/clans/${clanId}/roster`)}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                View Updated Roster
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
