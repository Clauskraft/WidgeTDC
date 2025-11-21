import React, { useState } from 'react';
import DashboardShell from './DashboardShell';
import Header from './Header';
import WidgetManagementPanel from './WidgetManagementPanel';
import { MCPProvider } from '../contexts/MCPContext';
import { NotificationManager } from './NotificationManager';

const Shell: React.FC = () => {
  const [isWidgetManagementOpen, setIsWidgetManagementOpen] = useState(false);

  return (
    <MCPProvider>
      <div className="h-screen w-screen flex flex-col text-gray-900 dark:text-gray-100 relative">
        <div className="ms-acrylic fixed inset-0 -z-10" />
        <Header onOpenWidgetManagement={() => setIsWidgetManagementOpen(true)} />
        <main className="flex-1 overflow-auto">
          <DashboardShell />
        </main>
        <WidgetManagementPanel
          isOpen={isWidgetManagementOpen}
          onClose={() => setIsWidgetManagementOpen(false)}
        />
        <NotificationManager />
      </div>
    </MCPProvider>
  );
};

export default Shell;
