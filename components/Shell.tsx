
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardShell from './DashboardShell';
import Header from './Header';
import { WidgetInstance } from '../types';

const Shell: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([
      { id: 'chat-1', widgetType: 'AgentChatWidget' },
      { id: 'prompt-library-1', widgetType: 'PromptLibraryWidget' }
  ]);

  const addWidget = (widgetType: string) => {
    const newWidget: WidgetInstance = {
      id: `${widgetType}-${Date.now()}`,
      widgetType,
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar addWidget={addWidget} />
        <main className="flex-1 overflow-auto">
          <DashboardShell widgets={widgets} removeWidget={removeWidget} />
        </main>
      </div>
    </div>
  );
};

export default Shell;
