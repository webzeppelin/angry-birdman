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
