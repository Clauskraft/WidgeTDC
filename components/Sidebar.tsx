
import React from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

interface SidebarProps {
  addWidget: (widgetType: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ addWidget }) => {
  const { availableWidgets } = useWidgetRegistry();
  const { state, toggleReduceMotion } = useGlobalState();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Widgets</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {availableWidgets.map(widget => (
            <button
              key={widget.id}
              className="w-full text-left p-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => addWidget(widget.id)}
            >
              {widget.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3">Indstillinger</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Reducer bevægelse</span>
          <button
            onClick={toggleReduceMotion}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              state.reduceMotion ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              state.reduceMotion ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
