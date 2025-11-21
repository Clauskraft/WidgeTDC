import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useMCP } from '../../src/hooks/useMCP'; // Mock
import LocalScanWidget from '../LocalScanWidget';

vi.mock('../../src/hooks/useMCP');

const mockMcpSend = vi.fn();
(useMCP as any).mockReturnValue({ send: mockMcpSend, isLoading: false });

describe('LocalScanWidget', () => {
  afterEach(() => {
    mockMcpSend.mockClear();
  });

  it('renders form and triggers scan', async () => {
    mockMcpSend.mockResolvedValue({ payload: { files: [] } });
    render(<LocalScanWidget widgetId="test" />);
    expect(screen.getByPlaceholderText(/Path/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Keywords/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/Start Scan/i));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockMcpSend).toHaveBeenCalledWith('scanner-service', 'scan.local-drive', expect.objectContaining({ path: '/tmp/scan-target' }));
  });

  it('toggles auto-scan and updates UI', async () => {
    mockMcpSend.mockResolvedValue({ payload: { files: [] } });
    render(<LocalScanWidget widgetId="test" />);
    const checkbox = screen.getByLabelText(/Auto-scan/i);

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(checkbox).toBeChecked();
  });

  it('displays results with images', async () => {
    mockMcpSend.mockResolvedValue({ payload: { files: [{ name: 'test.jpg', threatScore: 5, hasImage: true, imageAnalysis: { ocrText: 'Threat', altText: 'test', score: 0.9 }, fullPath: '/test', sizeBytes: 1024, snippet: 'test content' }] } });

    render(<LocalScanWidget widgetId="test" />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Start Scan/i));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(screen.getByText(/test.jpg/)).toBeInTheDocument();
    });
  });

  it('handles errors discreetly', async () => {
    mockMcpSend.mockRejectedValue(new Error('Access denied'));

    render(<LocalScanWidget widgetId="test" />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Start Scan/i));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(screen.getByText(/Scan failed/)).toBeInTheDocument();
    });
  });
});