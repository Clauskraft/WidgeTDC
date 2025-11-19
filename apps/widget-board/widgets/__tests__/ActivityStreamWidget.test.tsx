import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityStreamWidget from '../ActivityStreamWidget';

vi.mock('../../utils/securityApi', () => ({
  fetchSecurityActivity: vi.fn().mockResolvedValue({
    events: [
      { id: 'evt-1', title: 'Credential dump', severity: 'critical', timestamp: new Date().toISOString(), source: 'Dark Web' },
      { id: 'evt-2', title: 'Phishing domain', severity: 'medium', timestamp: new Date().toISOString(), source: 'OSINT' },
    ],
  }),
  acknowledgeActivityEvent: vi.fn().mockResolvedValue({}),
  getActivityStreamUrl: vi.fn().mockReturnValue('wss://example.com/activity'),
}));

describe('ActivityStreamWidget', () => {
  it('smoke test: renders live stream header and events', () => {
    render(<ActivityStreamWidget widgetId="activity-test" />);

    expect(screen.getByText(/Activity Stream · Real-time Security Feed/i)).toBeInTheDocument();
    expect(screen.getByTestId('activity-events')).toBeInTheDocument();
    expect(screen.getAllByTestId('activity-event').length).toBeGreaterThan(0);
  });

  it('integration test: filters by severity', async () => {
    render(<ActivityStreamWidget widgetId="activity-test" />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Severity/i), 'critical');

    const criticalEvents = await screen.findAllByTestId('activity-event');
    expect(criticalEvents).toHaveLength(1);
    expect(criticalEvents[0]).toHaveTextContent(/credential dump/i);
  });
});

