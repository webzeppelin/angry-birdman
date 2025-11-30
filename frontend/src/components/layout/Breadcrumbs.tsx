/**
 * Breadcrumb Component
 *
 * Provides hierarchical navigation showing the user's current location.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const [clanNames, setClanNames] = useState<Map<number, string>>(new Map());

  // Extract clan IDs from path
  const clanIdsInPath = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const ids: number[] = [];

    // Check if we're on a clan page: /clans/:clanId
    if (pathSegments[0] === 'clans' && pathSegments.length > 1 && pathSegments[1]) {
      const clanId = parseInt(pathSegments[1], 10);
      if (!isNaN(clanId)) {
        ids.push(clanId);
      }
    }

    return ids;
  }, [location.pathname]);

  // Fetch clan names for IDs in path
  useEffect(() => {
    const fetchClanNames = async () => {
      for (const clanId of clanIdsInPath) {
        // Skip if already fetched
        if (clanNames.has(clanId)) continue;

        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/clans/${clanId}`
          );
          if (response.ok) {
            const data = (await response.json()) as { clanId: number; name: string };
            setClanNames((prev) => new Map(prev).set(clanId, data.name));
          }
        } catch (err) {
          console.error(`Error fetching clan ${clanId}:`, err);
        }
      }
    };

    void fetchClanNames();
  }, [clanIdsInPath, clanNames]);

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];
    const searchParams = new URLSearchParams(location.search);

    // Check if we're on player history page with context
    const isPlayerHistory = pathSegments.includes('roster') && pathSegments.includes('history');
    const from = searchParams.get('from');
    const monthId = searchParams.get('monthId');
    const yearId = searchParams.get('yearId');

    // Helper to format month display (YYYYMM -> "January 2025")
    const formatMonthDisplay = (monthId: string): string => {
      if (!monthId || monthId.length !== 6) return '';
      const year = parseInt(monthId.substring(0, 4), 10);
      const month = parseInt(monthId.substring(4, 6), 10);
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    // Build breadcrumb path
    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      if (!segment) continue; // Skip empty segments

      currentPath += `/${segment}`;

      // Create label (capitalize and handle special cases)
      let label: string;

      // Handle specific routes
      if (segment === 'clans' && i === 0) {
        label = 'Clans';
      } else if (segment === 'about') {
        label = 'About';
      } else if (segment === 'dashboard') {
        label = 'Dashboard';
      } else if (segment === 'battles') {
        label = 'Battles';
      } else if (segment === 'roster') {
        label = 'Roster';

        // Special handling for player history from stats pages
        if (isPlayerHistory && (from === 'monthly' || from === 'yearly')) {
          // Insert stats breadcrumbs before roster
          const clanIdSegment = pathSegments[1]; // Should be the clan ID

          // Add Statistics crumb
          items.push({
            label: 'Statistics',
            path: `/clans/${clanIdSegment}/stats`,
          });

          // Add month or year specific crumb
          if (from === 'monthly' && monthId) {
            items.push({
              label: formatMonthDisplay(monthId),
              path: `/clans/${clanIdSegment}/stats/months/${monthId}`,
            });
          } else if (from === 'yearly' && yearId) {
            items.push({
              label: yearId,
              path: `/clans/${clanIdSegment}/stats/years/${yearId}`,
            });
          }

          // Skip adding 'Roster' to breadcrumbs since we're coming from stats
          continue;
        }
      } else if (segment === 'stats') {
        label = 'Statistics';
      } else if (segment === 'history') {
        label = 'Player History';
      } else if (segment === 'months') {
        label = 'Monthly Stats';
      } else if (segment === 'years') {
        label = 'Yearly Stats';
      } else if (!isNaN(Number(segment))) {
        // If it's a number, check if it's a clan ID with a cached name
        const numericId = parseInt(segment, 10);
        const clanName = clanNames.get(numericId);

        if (clanName) {
          label = clanName;
        } else if (pathSegments[i - 1] === 'clans') {
          // It's a clan ID but name not loaded yet
          label = 'Loading...';
        } else if (pathSegments[i - 1] === 'roster') {
          // Player ID on roster - skip adding to breadcrumbs
          continue;
        } else if (pathSegments[i - 1] === 'months' && segment.length === 6) {
          // Month ID - already handled above if coming from player history
          if (!(isPlayerHistory && from === 'monthly')) {
            label = formatMonthDisplay(segment);
          } else {
            continue; // Skip as it's already added
          }
        } else if (pathSegments[i - 1] === 'years' && segment.length === 4) {
          // Year ID - already handled above if coming from player history
          if (!(isPlayerHistory && from === 'yearly')) {
            label = segment;
          } else {
            continue; // Skip as it's already added
          }
        } else {
          // Other numeric ID (battle, user, etc.)
          label = `ID ${segment}`;
        }
      } else {
        // Capitalize first letter
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      items.push({
        label,
        path: currentPath,
      });
    }

    return items;
  }, [location.pathname, location.search, clanNames]);

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  // Don't show breadcrumbs on auth callback pages
  if (location.pathname.includes('/callback')) {
    return null;
  }

  return (
    <nav className="border-b border-neutral-200 bg-white px-4 py-3" aria-label="Breadcrumb">
      <div className="container mx-auto">
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-neutral-400" aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span className="font-medium text-neutral-800" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="hover:text-primary text-neutral-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
