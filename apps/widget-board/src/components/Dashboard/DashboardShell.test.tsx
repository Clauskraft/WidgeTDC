import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardShell } from './DashboardShell';

describe('DashboardShell', () => {
  it('should render without crashing', () => {
    render(<DashboardShell />);
    expect(screen.getByText('WidgetBoard')).toBeInTheDocument();
  });

  it('should display welcome content when no children provided', () => {
    render(<DashboardShell />);
    expect(screen.getByText('Welcome to WidgetBoard')).toBeInTheDocument();
    expect(screen.getByText(/Your enterprise widget management platform is ready/)).toBeInTheDocument();
  });

  it('should display custom children when provided', () => {
    render(
      <DashboardShell>
        <div>Custom Content</div>
      </DashboardShell>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to WidgetBoard')).not.toBeInTheDocument();
  });

  it('should toggle sidebar when toggle button is clicked', () => {
    render(<DashboardShell />);
    const toggleButton = screen.getByLabelText('Toggle sidebar');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    expect(sidebar).toHaveClass('open');
    
    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass('closed');
    
    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass('open');
  });

  it('should have all navigation items as buttons (not links)', () => {
    render(<DashboardShell />);
    
    const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
    const widgetsButton = screen.getByRole('button', { name: 'Widgets' });
    const analyticsButton = screen.getByRole('button', { name: 'Analytics' });
    const settingsButton = screen.getByRole('button', { name: 'Settings' });
    
    expect(dashboardButton).toBeInTheDocument();
    expect(widgetsButton).toBeInTheDocument();
    expect(analyticsButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
  });

  it('should update active nav item when clicked', () => {
    render(<DashboardShell />);
    
    const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
    const widgetsButton = screen.getByRole('button', { name: 'Widgets' });
    
    expect(dashboardButton).toHaveClass('active');
    expect(widgetsButton).not.toHaveClass('active');
    
    fireEvent.click(widgetsButton);
    
    expect(dashboardButton).not.toHaveClass('active');
    expect(widgetsButton).toHaveClass('active');
  });

  it('should have proper ARIA attributes for navigation', () => {
    render(<DashboardShell />);
    
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
    
    const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
    expect(dashboardButton).toHaveAttribute('aria-current', 'page');
  });

  it('should have accessible buttons with aria-labels', () => {
    render(<DashboardShell />);
    
    const toggleButton = screen.getByLabelText('Toggle sidebar');
    const notificationsButton = screen.getByLabelText('View notifications');
    const settingsButton = screen.getByLabelText('Open settings');
    
    expect(toggleButton).toBeInTheDocument();
    expect(notificationsButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
  });

  it('should log navigation actions to console', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<DashboardShell />);
    
    const widgetsButton = screen.getByRole('button', { name: 'Widgets' });
    fireEvent.click(widgetsButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigating to: widgets');
    
    consoleSpy.mockRestore();
  });

  it('should display footer with copyright and phase information', () => {
    render(<DashboardShell />);
    expect(screen.getByText(/WidgetBoard © 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Phase 1.B Active/)).toBeInTheDocument();
    expect(screen.getByText(/Secure & GDPR Compliant/)).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(<DashboardShell />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('WidgetBoard');
  });

  it('should have main landmark with role', () => {
    render(<DashboardShell />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
