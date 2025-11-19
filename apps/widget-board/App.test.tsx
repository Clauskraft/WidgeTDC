import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Widget Board App', () => {
  it('renders shell and placeholder content', () => {
    render(<App />);
    expect(screen.getByText(/Widget Board Placeholder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Permissions/i })).toBeInTheDocument();
  });

  it('opens permissions panel when clicking the permissions button', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Permissions/i }));
    expect(screen.getByText(/Platform Permissions/i)).toBeInTheDocument();
  });
});
