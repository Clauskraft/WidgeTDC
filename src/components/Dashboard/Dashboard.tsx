import React from 'react';
import './Dashboard.css';

interface DashboardProps {
  title?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ title = 'WidgetTDC Dashboard' }) => {
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>WidgetTDC</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><a href="#widgets">Widgets</a></li>
            <li><a href="#registry">Registry</a></li>
            <li><a href="#audit">Audit Log</a></li>
            <li><a href="#settings">Settings</a></li>
          </ul>
        </nav>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>{title}</h1>
        </header>
        <div className="dashboard-content">
          <p>Dashboard shell ready for widget integration</p>
        </div>
      </main>
    </div>
  );
};
