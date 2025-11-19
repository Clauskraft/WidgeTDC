import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedIngestionWidget from '../FeedIngestionWidget';

const mockFeedsPayload = vi.hoisted(() => ({
  feeds: [
    { id: 'feed-darkweb', name: 'Dark Web Credential Markets', threatLevel: 'critical', documentsPerHour: 10, tags: ['threat'], lastFetched: '', status: 'healthy', endpoint: '', cadence: '', duplicatesPerHour: 0, backlogMinutes: 0, regions: [] },
    { id: 'feed-low', name: 'Vendor Vulnerability Radar', threatLevel: 'medium', documentsPerHour: 5, tags: ['vendor'], lastFetched: '', status: 'healthy', endpoint: '', cadence: '', duplicatesPerHour: 0, backlogMinutes: 0, regions: [] },
  ],
  pipelineStages: [],
  normalizedDocuments: [
    { id: 'doc-1', feedId: 'feed-darkweb', title: 'Dark Web Credential Markets', severity: 'critical', summary: '', tags: [], dedupeHits: 0, ingestedAt: '' },
  ],
  metrics: { documentsIndexed: 10, ingestionLatency: 0, dedupeRate: 0.9, backlogMinutes: 0 },
  archive: { sizeBytes: 0, retentionDays: 0, objectCount: 0 },
  environment: { openSearchConnected: false, minioConnected: false },
}));

vi.mock('../../contexts/PermissionContext', () => ({
  usePermissions: () => ({ loading: false, hasAccess: vi.fn() }),
}));

vi.mock('../../utils/securityApi', () => ({
  fetchSecurityFeeds: vi.fn().mockResolvedValue(mockFeedsPayload),
  DEFAULT_FEED_PAYLOAD: mockFeedsPayload,
}));

describe('FeedIngestionWidget', () => {
  it('smoke test: renders core feed insights', () => {
    render(<FeedIngestionWidget widgetId="feed-test" />);

    expect(screen.getByTestId('feed-ingestion-widget')).toBeInTheDocument();
    expect(screen.getByText(/Feed Ingestion · Threat Intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('feed-card').length).toBeGreaterThan(0);
  });

  it('integration test: filters feeds by severity', async () => {
    render(<FeedIngestionWidget widgetId="feed-test" />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Threat level filter/i), 'critical');

    const feedCards = await screen.findAllByTestId('feed-card');
    expect(feedCards).toHaveLength(1);
    expect(within(feedCards[0]).getByTestId('feed-card-name').textContent).toMatch(/Dark Web Credential Markets/i);
    expect(screen.queryByText(/Vendor Vulnerability Radar/i)).not.toBeInTheDocument();
  });
});

