import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMCP } from '../../src/hooks/useMCP'; // Mock
import LocalScanWidget from '../LocalScanWidget';

vi.mock('../../src/hooks/useMCP');

const mockMcpSend = vi.fn();
(useMCP as any).mockReturnValue({ send: mockMcpSend });

describe('LocalScanWidget', () => {
  it('renders form and triggers scan', async () => {
    render(<LocalScanWidget widgetId="test" />);
    expect(screen.getByPlaceholderText(/Path/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Keywords/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Start Scan/i));
    expect(mockMcpSend).toHaveBeenCalledWith('scanner-service', 'scan.local-drive', expect.objectContaining({ path: '/tmp/scan-target' }));
  });

  it('toggles auto-scan and updates UI', async () => {
    render(<LocalScanWidget widgetId="test" />);
    const checkbox = screen.getByLabelText(/Auto-scan/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Simulate poll interval (mock setInterval)
    const { container } = render(<LocalScanWidget widgetId="test" />);
    expect(container).toHaveTextContent(/Auto-scan active/);
  });

  it('displays results with images', async () => {
    mockMcpSend.mockResolvedValue({ payload: { files: [{ name: 'test.jpg', threatScore: 5, hasImage: true, imageAnalysis: { ocrText: 'Threat' }, fullPath: '/test' }] } });

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(screen.getByText(/test.jpg/)).toBeInTheDocument();
    expect(screen.getByText(/OCR: Threat/)).toBeInTheDocument();
  });

  it('handles errors discreetly', async () => {
    mockMcpSend.mockRejectedValue(new Error('Access denied'));

    render(<LocalScanWidget widgetId="test" />);
    fireEvent.click(screen.getByText(/Start Scan/i));

    expect(screen.getByText(/Scan failed/)).toBeInTheDocument();
  });
});