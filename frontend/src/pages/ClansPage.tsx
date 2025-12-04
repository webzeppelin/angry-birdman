/**
 * Clans Page
 *
 * Browse all clans with search and filtering.
 */

import { ClanSelector } from '@/components/clans/ClanSelector';

export function ClansPage() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="font-display mb-4 text-4xl text-neutral-800">Browse Clans</h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            Explore clan statistics and battle performance. Find your clan or check out the
            competition!
          </p>
        </div>

        <div className="mx-auto max-w-7xl">
          <ClanSelector maxDisplay={24} />
        </div>
      </div>
    </div>
  );
}
