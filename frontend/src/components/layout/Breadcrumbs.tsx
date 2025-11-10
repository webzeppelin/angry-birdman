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
      } else if (segment === 'stats') {
        label = 'Statistics';
      } else if (!isNaN(Number(segment))) {
        // If it's a number, check if it's a clan ID with a cached name
        const numericId = parseInt(segment, 10);
        const clanName = clanNames.get(numericId);

        if (clanName) {
          label = clanName;
        } else if (pathSegments[i - 1] === 'clans') {
          // It's a clan ID but name not loaded yet
          label = 'Loading...';
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
  }, [location.pathname, clanNames]);

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
