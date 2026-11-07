import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { HomePage } from '@/pages/HomePage';

import { renderWithProviders } from './utils/test-utils';

describe('Frontend Testing Infrastructure', () => {
  it('can render a component with providers', () => {
    renderWithProviders(<HomePage />);

    // HomePage should render (even if content is minimal)
    expect(document.body).toBeDefined();
  });

  it('keeps the simplified homepage content and removes the hero image and redundant sections', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Angry Birdman' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Clans' })).toHaveAttribute('href', '/clans');
    expect(screen.queryByRole('img', { name: 'Angry Birdman' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Key Features' })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/explore clan statistics and battle performance/i)
    ).not.toBeInTheDocument();
  });

  it('has access to screen queries from React Testing Library', () => {
    renderWithProviders(
      <div>
        <h1>Test Heading</h1>
        <button>Test Button</button>
      </div>
    );

    expect(screen.getByRole('heading', { name: /test heading/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('can use jest-dom matchers', () => {
    renderWithProviders(
      <div>
        <input type="text" value="test value" readOnly />
        <button disabled>Disabled Button</button>
      </div>
    );

    expect(screen.getByRole('textbox')).toHaveValue('test value');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
