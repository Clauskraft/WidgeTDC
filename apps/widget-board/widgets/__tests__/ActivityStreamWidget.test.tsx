import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PermissionProvider } from '../../contexts/PermissionContext';
import ActivityStreamWidget from '../ActivityStreamWidget';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PermissionProvider>{component}</PermissionProvider>);
};

describe('ActivityStreamWidget', () => {
  it('renders live stream header', () => {
    renderWithProvider(<ActivityStreamWidget widgetId="activity-test" />);

    expect(screen.getByText(/Activity Stream · Real-time Security Feed/i)).toBeInTheDocument();
  });

  it('renders activity events container', () => {
    renderWithProvider(<ActivityStreamWidget widgetId="activity-test" />);

    expect(screen.getByTestId('activity-events')).toBeInTheDocument();
  });

  it('has severity filter', () => {
    renderWithProvider(<ActivityStreamWidget widgetId="activity-test" />);

    expect(screen.getByLabelText(/Severity/i)).toBeInTheDocument();
  });
});
