
import React, { useState, useCallback, memo, Suspense } from 'react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useWidgetAccessibility } from '../hooks/useWidgetAccessibility';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';
import WidgetConfigModal from './WidgetConfigModal';
import type { WidgetConfig } from '../types';
import { Settings, ZoomIn, ZoomOut, Maximize, GripVertical } from 'lucide-react';

interface WidgetContainerProps {
  widgetId: string;
  widgetType: string;
  config?: WidgetConfig;
  onRemove: () => void;
  onConfigChange: (config: WidgetConfig) => void;
}

interface WidgetHeaderProps {
  widgetName: string;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenConfig: () => void;
  onRemove: () => void;
}

const WidgetHeader = memo(({
  widgetName,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenConfig,
  onRemove
}: WidgetHeaderProps) => {
  return (
    <div className="ms-widget-header">
      <div className="flex items-center gap-2">
        <div
          className="widget-drag-handle cursor-move p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          title="Træk for at flytte widget"
          tabIndex={0}
          role="button"
          aria-roledescription="Træk håndtag"
          aria-label={`Flyt ${widgetName} widget. Brug piletasterne til at flytte efter aktivering.`}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <h3 className="ms-widget-title">{widgetName}</h3>
      </div>
      <div className="ms-widget-actions flex items-center gap-1">
        <button onClick={onZoomOut} className="ms-icon-button ms-focusable" title="Zoom ud" disabled={scale <= 0.5}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={onResetZoom} className="ms-icon-button ms-focusable" title="Nulstil zoom">
          <Maximize className="w-4 h-4" />
        </button>
        <button onClick={onZoomIn} className="ms-icon-button ms-focusable" title="Zoom ind" disabled={scale >= 2}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-border mx-1"></div>
        <button onClick={onOpenConfig} className="ms-icon-button ms-focusable" title="Konfigurer widget">
          <Settings className="w-4 h-4" />
        </button>
        <button onClick={onRemove} className="ms-icon-button ms-focusable" title="Fjern widget">
          <MicrosoftIcons.Close />
        </button>
      </div>
    </div>
  );
});

WidgetHeader.displayName = 'WidgetHeader';

const WidgetContainer: React.FC<WidgetContainerProps> = memo(({
  widgetId,
  widgetType,
  config = {},
  onRemove,
  onConfigChange
}) => {
  const { availableWidgets } = useWidgetRegistry();
  const { state } = useGlobalState();
  const widgetDef = availableWidgets.find(w => w.id === widgetType);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const isDark = state.theme === 'dark';

  useWidgetAccessibility(widgetId, widgetDef?.name || widgetType);

  const zoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.1, 2)), []);
  const zoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.1, 0.5)), []);
  const resetZoom = useCallback(() => setScale(1), []);

  // Prevent drag when clicking on interactive elements
  const handleContentMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.matches(
      'input, textarea, select, button, a, [contenteditable="true"]'
    ) || target.closest('input, textarea, select, button, a, [contenteditable="true"]');

    if (isInteractive) {
      e.stopPropagation();
    }
  }, []);

  if (!widgetDef) {
    return (
      <div className="p-4 text-red-500 bg-red-100 dark:bg-red-900 h-full flex items-center justify-center rounded-lg">
        Error: Widget '{widgetType}' not found in registry.
      </div>
    );
  }

  const WidgetComponent = widgetDef.component as React.ComponentType<{ widgetId: string; config?: WidgetConfig }>;

  return (
    <>
      <div
        className="ms-widget-container h-full flex flex-col transition-transform duration-200 origin-top-left overflow-hidden"
        role="region"
        aria-label={`${widgetDef.name} widget`}
        style={{ transform: `scale(${scale})` }}
      >
        <WidgetHeader
          widgetName={widgetDef.name}
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onOpenConfig={() => setIsConfigOpen(true)}
          onRemove={onRemove}
        />
        <div
          className="flex-1 overflow-auto p-4 relative"
          onMouseDown={handleContentMouseDown}
        >
          <Suspense fallback={<WidgetLoader />}>
            <WidgetComponent widgetId={widgetId} config={config || {}} />
          </Suspense>
        </div>
      </div>

      <WidgetConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        widgetId={widgetId}
        widgetName={widgetDef.name}
        initialConfig={config}
        onSave={onConfigChange}
      />
    </>
  );
});

const WidgetLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm">
    <div className="text-center text-muted-foreground">
      <div className="flex gap-1 justify-center">
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <p className="text-xs mt-2">Loading Widget...</p>
    </div>
  </div>
);

WidgetContainer.displayName = 'WidgetContainer';
export default WidgetContainer;
