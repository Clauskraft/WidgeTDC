
import React from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';

interface WidgetContainerProps {
  widgetId: string;
  widgetType: string;
  onRemove: () => void;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ widgetId, widgetType, onRemove }) => {
  const { availableWidgets } = useWidgetRegistry();
  const widgetDef = availableWidgets.find(w => w.id === widgetType);

  if (!widgetDef) {
    return (
      <div className="p-4 text-red-500 bg-red-100 dark:bg-red-900 h-full flex items-center justify-center rounded-lg">
        Error: Widget '{widgetType}' not found in registry.
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  return (
    <div className="h-full flex flex-col">
      <div className="widget-drag-handle flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 cursor-move">
        <h3 className="font-semibold text-base">{widgetDef.name}</h3>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Fjern widget"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <WidgetComponent widgetId={widgetId} />
      </div>
    </div>
  );
};

export default WidgetContainer;
