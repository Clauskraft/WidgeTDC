
import React from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useWidgetAccessibility } from '../hooks/useWidgetAccessibility';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';

interface WidgetContainerProps {
  widgetId: string;
  widgetType: string;
  onRemove: () => void;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ widgetId, widgetType, onRemove }) => {
  const { availableWidgets } = useWidgetRegistry();
  const widgetDef = availableWidgets.find(w => w.id === widgetType);
  
  useWidgetAccessibility(widgetId, widgetDef?.name || widgetType);

  if (!widgetDef) {
    return (
      <div className="p-4 text-red-500 bg-red-100 dark:bg-red-900 h-full flex items-center justify-center rounded-lg">
        Error: Widget '{widgetType}' not found in registry.
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  return (
    <div className="h-full flex flex-col" role="region" aria-label={`${widgetDef.name} widget`}>
       <div className="ms-widget-header widget-drag-handle cursor-move">
        <h3 className="ms-widget-title">{widgetDef.name}</h3>
        <div className="ms-widget-actions">
           <button
             onClick={onRemove}
             className="ms-icon-button ms-focusable"
             title="Fjern widget"
           >
             <MicrosoftIcons.Close />
           </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <WidgetComponent widgetId={widgetId} />
      </div>
    </div>
  );
};

export default WidgetContainer;