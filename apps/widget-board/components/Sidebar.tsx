import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';

interface SidebarProps {
  onOpenWidgetManagement: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenWidgetManagement }) => {
  const { state, toggleReduceMotion } = useGlobalState();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          WidgetTDC • Powered by CGentCore
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <button
            onClick={onOpenWidgetManagement}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-[var(--shadow-button)]"
          >
            <MicrosoftIcons.Settings />
            <span className="font-medium">Manage Widgets</span>
          </button>

          <div className="mt-6 p-4 bg-gradient-subtle rounded-lg border border-border/20">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">
              Click "Manage Widgets" to enable, disable, and add widgets to your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MicrosoftIcons.Settings />
          Settings
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Reduce Motion</span>
          <button
            onClick={toggleReduceMotion}
            className={`ms-focusable relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              state.reduceMotion ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                state.reduceMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
