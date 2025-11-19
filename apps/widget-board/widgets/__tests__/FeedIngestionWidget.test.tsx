import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedIngestionWidget from '../FeedIngestionWidget';
import { PermissionProvider } from '../../contexts/PermissionContext';

vi.mock('../../utils/permissionsApi', () => ({
  getWidgetPermissions: vi.fn().mockResolvedValue([]),
  checkWidgetAccess: vi.fn().mockResolvedValue(true),
}));

const renderWithPermissions = () =>
  render(
    <PermissionProvider widgetId="feed-test">
      <FeedIngestionWidget widgetId="feed-test" />
    </PermissionProvider>
  );

describe('FeedIngestionWidget', () => {
  it('smoke test: renders core feed insights', async () => {
    renderWithPermissions();

    expect(await screen.findByTestId('feed-ingestion-widget')).toBeInTheDocument();
    expect(screen.getByText(/Feed Ingestion · Threat Intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('feed-card').length).toBeGreaterThan(0);
  });

  it('integration test: filters feeds by severity', async () => {
    renderWithPermissions();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText(/Threat level filter/i), 'critical');

    const feedCards = await screen.findAllByTestId('feed-card');
    expect(feedCards).toHaveLength(1);
    expect(within(feedCards[0]).getByTestId('feed-card-name').textContent).toMatch(/Dark Web Credential Markets/i);
    expect(screen.queryByText(/Vendor Vulnerability Radar/i)).not.toBeInTheDocument();
  });
});

