import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import SearchInterfaceWidget from '../SearchInterfaceWidget';

describe('SearchInterfaceWidget', () => {
  it('smoke test: renders query builder and results', () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(screen.getByText(/Search Interface · Unified Threat Query/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search query/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Saved templates/i })).toBeInTheDocument();
    expect(screen.getByTestId('search-results')).toBeInTheDocument();
  });

  it('integration test: applies template and records history', async () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Use template: High fidelity alerts/i }));
    await screen.findByDisplayValue(/credential leak finance exec/i);
    await user.click(screen.getByRole('button', { name: /Run query/i }));

    expect(screen.getByDisplayValue(/credential leak finance exec/i)).toBeInTheDocument();
    expect(await screen.findAllByTestId('search-result')).not.toHaveLength(0);
    expect(screen.getAllByTestId('search-history-row').length).toBeGreaterThan(0);
  });
});

