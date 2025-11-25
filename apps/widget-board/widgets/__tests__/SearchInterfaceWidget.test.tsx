import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import SearchInterfaceWidget from '../SearchInterfaceWidget';

// Mock the request utility
vi.mock('../../utils/request', () => ({
  request: vi.fn().mockResolvedValue({
    results: [],
    templates: []
  })
}));

describe('SearchInterfaceWidget', () => {
  it('renders search interface components', () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(screen.getByText(/Search Interface · Unified Threat Query/i)).toBeInTheDocument();
  });

  it('renders search input field', () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(screen.getByLabelText(/Search query/i)).toBeInTheDocument();
  });

  it('renders templates section', () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(screen.getByRole('heading', { name: /Saved templates/i })).toBeInTheDocument();
  });

  it('renders search results container', () => {
    render(<SearchInterfaceWidget widgetId="search-test" />);

    expect(screen.getByTestId('search-results')).toBeInTheDocument();
  });
});
