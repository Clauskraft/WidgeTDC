// apps/widget-board/widgets/__tests__/LocalScanWidget.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMCP } from '../../src/hooks/useMCP'; // Mock
import LocalScanWidget from '../LocalScanWidget';

vi.mock('../../src/hooks/useMCP');

const mockMcpSend = vi.fn();
vi.mocked(useMCP).mockReturnValue({ send: mockMcpSend });

describe('LocalScanWidget', () => {
  beforeEach(() => {
    mockMcpSend.mockReset();
    mockMcpSend.mockResolvedValue({ payload: { files: [] } });
  });

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
    const user = userEvent.setup();
    const checkbox = screen.getByLabelText(/Auto-scan/i);
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/Auto-scan active/i)).toBeInTheDocument();
  });

  it('displays results with images', async () => {
    mockMcpSend.mockResolvedValue({
      payload: {
        files: [
          {
            name: 'test.jpg',
            threatScore: 5,
            hasImage: true,
            imageAnalysis: { ocrText: 'Threat' },
            fullPath: '/test',
            sizeBytes: 1024,
            snippet: 'Threat snippet',
          },
        ],
      },
    });

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(await screen.findByText(/test.jpg/)).toBeInTheDocument();
    expect(screen.getByText(/OCR: Threat/)).toBeInTheDocument();
  });

  it('handles errors discreetly', async () => {
    mockMcpSend.mockRejectedValue(new Error('Access denied'));

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(await screen.findByText(/Scan failed/)).toBeInTheDocument();
  });
});