import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SearchInterfaceWidget from '../SearchInterfaceWidget';

// Mock the security API
vi.mock('../utils/securityApi', () => ({
  fetchSecurityTemplates: vi.fn().mockResolvedValue({
    templates: [
      {
        id: 'tpl-high-severity',
        name: 'High fidelity alerts',
        query: 'credential leak finance exec',
        severity: 'critical',
        timeframe: '24h',
        sources: ['Dark Web', 'Feed Ingestion'],
      },
    ],
  }),
  fetchSecuritySearchHistory: vi.fn().mockResolvedValue({ history: [] }),
  runSecuritySearch: vi.fn().mockResolvedValue({
    results: [
      {
        id: 'sr-1',
        title: 'Test result',
        summary: 'Test summary',
        source: 'Feed Ingestion',
        severity: 'critical',
        timestamp: new Date().toISOString(),
        tags: ['test'],
        score: 0.95,
      },
    ],
    metrics: { latencyMs: 100, totalDocs: 1000, coverage: 0.9 },
    auditEntry: {
      id: 'hist-1',
      query: 'credential leak finance exec',
      severity: 'critical',
      timeframe: '24h',
      sources: ['Dark Web', 'Feed Ingestion'],
      results: 1,
      latencyMs: 100,
      ranAt: new Date().toISOString(),
    },
  }),
}));

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

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getAllByTestId('search-result')).not.toHaveLength(0);
    });

    // History should be populated after search completes
    await waitFor(() => {
      expect(screen.getAllByTestId('search-history-row').length).toBeGreaterThan(0);
    });
  });
});

