import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedIngestionWidget from '../FeedIngestionWidget';

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

