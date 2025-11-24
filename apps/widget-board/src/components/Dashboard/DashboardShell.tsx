import React, { useState } from 'react';
import './DashboardShell.css';

/**
 * WidgetBoard Dashboard Shell Component
 * Provides responsive, accessible dashboard container with modern UI
 */
export const DashboardShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
    // Add navigation logic here when routes are implemented
    console.log(`Navigating to: ${navItem}`);
  };

  return (
    <div className="dashboard-shell">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>
          <h1 className="dashboard-title">WidgetBoard</h1>
          <div className="header-actions">
            <button 
              className="btn-icon" 
              aria-label="View notifications"
              onClick={() => console.log('Notifications clicked')}
            >
              🔔
            </button>
            <button 
              className="btn-icon" 
              aria-label="Open settings"
              onClick={() => console.log('Settings clicked')}
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <button 
              className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
              aria-current={activeNav === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </button>
            <button 
              className={`nav-item ${activeNav === 'widgets' ? 'active' : ''}`}
              onClick={() => handleNavClick('widgets')}
              aria-current={activeNav === 'widgets' ? 'page' : undefined}
            >
              Widgets
            </button>
            <button 
              className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
              onClick={() => handleNavClick('analytics')}
              aria-current={activeNav === 'analytics' ? 'page' : undefined}
            >
              Analytics
            </button>
            <button 
              className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
              aria-current={activeNav === 'settings' ? 'page' : undefined}
            >
              Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main" role="main">
          <div className="content-wrapper">
            {children || (
              <div className="welcome-content">
                <h2>Welcome to WidgetBoard</h2>
                <p>Your enterprise widget management platform is ready.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>WidgetBoard © 2025 | Phase 1.B Active | Secure & GDPR Compliant</p>
      </footer>
    </div>
  );
};

export default DashboardShell;
