/**
 * ClanSelector Component
 *
 * Searchable clan selector with filtering by name and country.
 * Used on landing page and for clan browsing.
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { apiClient } from '@/lib/api-client';

interface Clan {
  clanId: number;
  rovioId: number;
  name: string;
  country: string;
  registrationDate: string;
  active: boolean;
  battleCount: number;
}

interface ClanSelectorProps {
  /** Show only active clans by default */
  defaultShowActive?: boolean;
  /** Maximum number of clans to display */
  maxDisplay?: number;
  /** Compact view for embedding in other components */
  compact?: boolean;
}

export function ClanSelector({
  defaultShowActive = true,
  maxDisplay = 12,
  compact = false,
}: ClanSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showActive, setShowActive] = useState(defaultShowActive);

  // Fetch clans
  const { data, isLoading, error } = useQuery({
    queryKey: ['clans', { search: searchTerm, country: selectedCountry, active: showActive }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '100', // Fetch more for client-side filtering
        active: showActive ? 'true' : 'all',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCountry) params.append('country', selectedCountry);

      const response = await apiClient.get(`/api/clans?${params.toString()}`);
      return response.data as {
        clans: Clan[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Extract unique countries from results
  const countries = useMemo(() => {
    if (!data?.clans) return [];
    const uniqueCountries = new Set(data.clans.map((c) => c.country));
    return Array.from(uniqueCountries).sort();
  }, [data?.clans]);

  // Filter and limit results
  const displayedClans = useMemo(() => {
    if (!data?.clans) return [];
    return data.clans.slice(0, maxDisplay);
  }, [data?.clans, maxDisplay]);

  if (error) {
    return (
      <div className="border-error bg-error/10 rounded-lg border p-4 text-center">
        <p className="text-error font-medium">Failed to load clans</p>
        <p className="mt-1 text-sm text-neutral-600">Please try again later</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div>
          <label htmlFor="clan-search" className="sr-only">
            Search clans
          </label>
          <input
            id="clan-search"
            type="text"
            placeholder="Search clan name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="country-filter" className="sr-only">
              Filter by country
            </label>
            <select
              id="country-filter"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActive}
              onChange={(e) => setShowActive(e.target.checked)}
              className="text-primary focus:ring-primary h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Active only</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shadow-card animate-pulse rounded-lg bg-white p-4">
              <div className="mb-2 h-6 w-3/4 rounded bg-neutral-200"></div>
              <div className="mb-3 h-4 w-1/2 rounded bg-neutral-200"></div>
              <div className="h-4 w-full rounded bg-neutral-200"></div>
            </div>
          ))}
        </div>
      ) : displayedClans.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-neutral-600">No clans found matching your criteria</p>
          <p className="mt-1 text-sm text-neutral-500">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div
            className={`grid gap-4 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}
          >
            {displayedClans.map((clan) => (
              <Link
                key={clan.clanId}
                to={`/clans/${clan.clanId}`}
                className="shadow-card hover:shadow-card-hover group rounded-lg bg-white p-4 transition-all hover:scale-105"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="group-hover:text-primary text-lg font-semibold text-neutral-800">
                    {clan.name}
                  </h3>
                  {!clan.active && (
                    <span className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-600">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm text-neutral-600">
                  {clan.country} • ID: {clan.rovioId}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    {clan.battleCount} {clan.battleCount === 1 ? 'battle' : 'battles'}
                  </span>
                  <span className="text-primary font-medium">View →</span>
                </div>
              </Link>
            ))}
          </div>

          {data && data.clans.length > maxDisplay && (
            <div className="text-center">
              <Link
                to="/clans"
                className="text-primary hover:text-primary-600 inline-flex items-center gap-2 font-medium transition-colors"
              >
                View all {data.pagination.total} clans
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
