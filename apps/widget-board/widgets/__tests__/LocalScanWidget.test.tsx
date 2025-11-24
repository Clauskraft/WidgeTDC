import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LocalScanWidget from '../LocalScanWidget';

describe('LocalScanWidget', () => {
  it('renders form with path and keyword inputs', () => {
    render(<LocalScanWidget widgetId="test" />);
    expect(screen.getByPlaceholderText(/Path/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Keywords/i)).toBeInTheDocument();
  });

  it('renders start scan button', () => {
    render(<LocalScanWidget widgetId="test" />);
    expect(screen.getByText(/Start Scan/i)).toBeInTheDocument();
  });

  it('renders auto-scan checkbox', () => {
    render(<LocalScanWidget widgetId="test" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('toggles auto-scan checkbox state', async () => {
    render(<LocalScanWidget widgetId="test" />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.checked).toBe(true);
  });

  it('allows button click without errors', async () => {
    render(<LocalScanWidget widgetId="test" />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Start Scan/i));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Component should render without crashing - actual MCP communication will happen
  });
});
