import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInterfaceWidget from '../SearchInterfaceWidget';

const templatesResponse = vi.hoisted(() => ({
  templates: [
    {
      id: 'template-1',
      name: 'High fidelity alerts',
      description: 'Test template',
      query: 'credential leak finance exec',
      severity: 'critical',
      timeframe: '24h',
      sources: ['darkweb'],
    },
  ],
}));

const historyResponse = vi.hoisted(() => ({
  history: [
    {
      id: 'hist-1',
      query: 'credential leak finance exec',
      severity: 'critical',
      timeframe: '24h',
      sources: ['darkweb'],
      results: 2,
      latencyMs: 140,
      ranAt: new Date().toISOString(),
    },
  ],
}));

const runSecuritySearchMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    results: [
      {
        id: 'res-1',
        title: 'Credential leak finance exec',
        severity: 'critical',
        summary: 'Test result',
        source: 'Dark Web',
        timestamp: new Date().toISOString(),
        tags: ['credential'],
        score: 0.9,
      },
    ],
    metrics: { latencyMs: 120, totalDocs: 1000, coverage: 0.9 },
    auditEntry: {
      id: 'hist-audit-1',
      query: 'credential leak finance exec',
      severity: 'critical',
      timeframe: '24h',
      sources: ['darkweb'],
      results: 1,
      latencyMs: 120,
      ranAt: new Date().toISOString(),
    },
  })
);

const fetchTemplatesMock = vi.hoisted(() => vi.fn().mockResolvedValue(templatesResponse));

vi.mock('../../utils/securityApi', () => ({
  fetchSecurityTemplates: fetchTemplatesMock,
  fetchSecuritySearchHistory: vi.fn().mockResolvedValue(historyResponse),
  runSecuritySearch: runSecuritySearchMock,
}));

describe('SearchInterfaceWidget', () => {
  it('smoke test: renders query builder and results', async () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(await screen.findByText(/Search Interface · Unified Threat Query/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search query/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Saved templates/i })).toBeInTheDocument();
    expect(screen.getByTestId('search-results')).toBeInTheDocument();
  });

  it('integration test: applies template and records history', async () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);
    const user = userEvent.setup();

    await waitFor(() => expect(fetchTemplatesMock).toHaveBeenCalled());
    const templateCard = await screen.findByText(/High fidelity alerts/i);
    await user.click(within(templateCard.closest('article')!).getByRole('button', { name: /Use template/i }));
    await user.click(screen.getByRole('button', { name: /Run query/i }));

    await waitFor(() =>
      expect(runSecuritySearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'credential leak finance exec', severity: 'critical', timeframe: '24h' })
      )
    );
    expect(await screen.findAllByTestId('search-result')).not.toHaveLength(0);
    expect(screen.getAllByTestId('search-history-row').length).toBeGreaterThan(0);
  });
});

