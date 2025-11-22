import React, { useState } from 'react';
import './DashboardShell.css';

/**
 * WidgetBoard Dashboard Shell Component
 * Provides responsive, accessible dashboard container with modern UI
 */
export const DashboardShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-shell">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1 className="dashboard-title">WidgetBoard</h1>
          <div className="header-actions">
            <button className="btn-icon" aria-label="Notifications">🔔</button>
            <button className="btn-icon" aria-label="Settings">⚙️</button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">Dashboard</a>
            <a href="#" className="nav-item">Widgets</a>
            <a href="#" className="nav-item">Analytics</a>
            <a href="#" className="nav-item">Settings</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="content-wrapper">
            {children || <div className="placeholder">Dashboard content goes here</div>}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>WidgetBoard © 2025 | Phase 1.B Active</p>
      </footer>
    </div>
  );
};

export default DashboardShell;
