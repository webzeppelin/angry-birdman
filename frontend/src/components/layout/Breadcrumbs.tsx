/**
 * Breadcrumb Component
 *
 * Provides hierarchical navigation showing the user's current location.
 */

import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumbs() {
  const location = useLocation();

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
        // If it's a number (clan ID, battle ID, etc.), keep as is but mark for potential replacement
        label = `ID ${segment}`;
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
  }, [location.pathname]);

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
