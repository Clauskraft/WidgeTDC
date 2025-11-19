import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardShell from './DashboardShell';
import Header from './Header';
import { WidgetInstance } from '../types';

const WIDGETS_STORAGE_KEY = 'widgetboard_widgets';

const defaultWidgets: WidgetInstance[] = [
  { id: 'chat-1', widgetType: 'AgentChatWidget' },
  { id: 'prompt-library-1', widgetType: 'PromptLibraryWidget' },
];

const Shell: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(() => {
    try {
      const savedWidgets = localStorage.getItem(WIDGETS_STORAGE_KEY);
      return savedWidgets ? JSON.parse(savedWidgets) : defaultWidgets;
    } catch (error) {
      console.error('Could not parse widgets from localStorage', error);
      return defaultWidgets;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error('Could not save widgets to localStorage', error);
    }
  }, [widgets]);

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
    <div className="h-screen w-screen flex flex-col text-gray-900 dark:text-gray-100 relative">
      <div className="ms-acrylic fixed inset-0 -z-10" />
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
