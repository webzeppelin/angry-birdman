import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ActionCodeAssignment from '../../../src/components/battles/ActionCodeAssignment';
import { renderWithQuery } from '../../utils/test-utils';

describe('ActionCodeAssignment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows current FP alongside recent participation for active non-players', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const responseBody = url.includes('/participation-history?')
          ? {
              players: [
                {
                  playerId: 42,
                  hasPlayedBattle: false,
                  totalPreviousBattles: 0,
                  recentParticipation: [],
                },
              ],
            }
          : {
              players: [
                {
                  playerId: 42,
                  playerName: 'High FP Player',
                  fp: 1250,
                  active: true,
                  reserved: false,
                  joinedDate: '2025-01-01',
                },
              ],
              pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
            };

        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    renderWithQuery(
      <ActionCodeAssignment
        clanId={1}
        data={{
          battleId: '20261107',
          nonplayerStats: [{ playerId: 42, fp: 1250, reserve: false, actionCode: 'HOLD' }],
        }}
        onUpdate={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(await screen.findByText('FP: 1,250')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('columnheader', { name: /current fp \/ recent participation/i })
    ).toBeInTheDocument();
  });
});
