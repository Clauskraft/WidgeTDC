
import React, { useState } from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useWidgetAccessibility } from '../hooks/useWidgetAccessibility';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';
import WidgetConfigModal from './WidgetConfigModal';
import type { WidgetConfig } from '../types';
import { Settings, ZoomIn, ZoomOut, Maximize2, GripVertical } from 'lucide-react';

interface WidgetContainerProps {
  widgetId: string;
  widgetType: string;
  config?: WidgetConfig;
  onRemove: () => void;
  onConfigChange: (config: WidgetConfig) => void;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widgetId,
  widgetType,
  config = {},
  onRemove,
  onConfigChange
}) => {
    const { availableWidgets } = useWidgetRegistry();
  const widgetDef = availableWidgets.find(w => w.id === widgetType);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [scale, setScale] = useState(1);

  useWidgetAccessibility(widgetId, widgetDef?.name || widgetType);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1);

  if (!widgetDef) {
    return (
      <div className="p-4 text-red-500 bg-red-100 dark:bg-red-900 h-full flex items-center justify-center rounded-lg">
        Error: Widget '{widgetType}' not found in registry.
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  return (
    <>
      <div
        className="ms-widget-container h-full flex flex-col transition-transform duration-200 origin-top-left overflow-hidden"
        role="region"
        aria-label={`${widgetDef.name} widget`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className="ms-widget-header">
          <div className="flex items-center gap-2">
            <div className="widget-drag-handle cursor-move p-1 hover:bg-white/20 rounded transition-colors" title="Træk for at flytte widget">
              <GripVertical className="w-4 h-4" />
            </div>
            <h3 className="ms-widget-title">{widgetDef.name}</h3>
          </div>
          <div className="ms-widget-actions flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="ms-icon-button ms-focusable"
              title="Zoom ud"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="ms-icon-button ms-focusable"
              title="Nulstil zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={zoomIn}
              className="ms-icon-button ms-focusable"
              title="Zoom ind"
              disabled={scale >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1"></div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="ms-icon-button ms-focusable"
              title="Konfigurer widget"
            >
              <Settings className="w-4 h-4" />
            </button>
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
          <WidgetComponent widgetId={widgetId} config={config} />
        </div>
      </div>

        {isConfigOpen && (
          <WidgetConfigModal
            onClose={() => setIsConfigOpen(false)}
            widgetName={widgetDef.name}
            initialConfig={config}
            onSave={onConfigChange}
          />
        )}
    </>
  );
};

export default WidgetContainer;
