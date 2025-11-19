// apps/widget-board/widgets/__tests__/LocalScanWidget.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import LocalScanWidget from '../LocalScanWidget';

const mockMcpSend = vi.fn();

vi.mock('../../src/hooks/useMCP', () => ({
  useMCP: () => ({
    send: mockMcpSend,
    isLoading: false,
  }),
}));

beforeEach(() => {
  mockMcpSend.mockReset();
  mockMcpSend.mockResolvedValue({ payload: { files: [] } });
});

describe('LocalScanWidget', () => {
  it('renders form and triggers scan', async () => {
    render(<LocalScanWidget widgetId="test" />);
    expect(screen.getByPlaceholderText(/Path/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Keywords/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Start Scan/i));
    await waitFor(() =>
      expect(mockMcpSend).toHaveBeenCalledWith(
        'scanner-service',
        'scan.local-drive',
        expect.objectContaining({ path: '/tmp/scan-target' })
      )
    );
  });

  it('toggles auto-scan and updates UI', async () => {
      render(<LocalScanWidget widgetId="test" />);
      const checkbox = screen.getByLabelText(/Auto-scan/i);
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(await screen.findByText(/Auto-scan active/i)).toBeInTheDocument();
  });

  it('displays results with images', async () => {
    mockMcpSend.mockResolvedValue({
      payload: {
        files: [
          {
            name: 'test.jpg',
            threatScore: 5,
            hasImage: true,
            imageAnalysis: { ocrText: 'Threat', score: 0.8 },
            fullPath: '/test',
            snippet: 'Sample snippet',
          },
        ],
      },
    });

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(await screen.findByText(/test.jpg/)).toBeInTheDocument();
    expect(await screen.findByText(/OCR: Threat/)).toBeInTheDocument();
  });

  it('handles errors discreetly', async () => {
    mockMcpSend.mockRejectedValue(new Error('Access denied'));

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(await screen.findByText(/Scan failed/)).toBeInTheDocument();
  });
});