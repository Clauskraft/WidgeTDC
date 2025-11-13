
import React, { useState, useEffect } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import WidgetContainer from './WidgetContainer';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useGlobalState } from '../contexts/GlobalStateContext';
import type { WidgetInstance } from '../types';
import type { Layout, Layouts } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardShellProps {
  widgets: WidgetInstance[];
  removeWidget: (widgetId: string) => void;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ widgets, removeWidget }) => {
  const { availableWidgets } = useWidgetRegistry();
  const { state } = useGlobalState();
  const [layouts, setLayouts] = useState<Layouts>({});

  useEffect(() => {
    const newLayouts: Layouts = { lg: [] };
    widgets.forEach(widget => {
      const widgetDef = availableWidgets.find(w => w.id === widget.widgetType);
      if(widgetDef) {
        const existingLayout = layouts.lg?.find(l => l.i === widget.id);
        if(!existingLayout) {
          newLayouts.lg.push({
            i: widget.id,
            x: (newLayouts.lg.length * widgetDef.defaultLayout.w) % 12,
            y: Infinity, // puts it at the bottom
            w: widgetDef.defaultLayout.w,
            h: widgetDef.defaultLayout.h,
          });
        }
      }
    });
    if(newLayouts.lg.length > 0) {
      setLayouts(prev => ({...prev, lg: [...(prev.lg || []), ...newLayouts.lg]}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets.length, availableWidgets]);

  const onLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  };
  
  const generateDOM = () => {
    return widgets.map(widget => {
      const widgetDef = availableWidgets.find(w => w.id === widget.widgetType);
      if (!widgetDef) return null;

      const defaultLayout = {
        ...widgetDef.defaultLayout,
        i: widget.id,
        x: (widgets.length * widgetDef.defaultLayout.w) % 12,
        y: Infinity,
      };

      const layout = layouts.lg?.find(l => l.i === widget.id) || defaultLayout;

      return (
        <div key={widget.id} data-grid={layout} className="rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <WidgetContainer
            widgetId={widget.id}
            widgetType={widget.widgetType}
            onRemove={() => removeWidget(widget.id)}
          />
        </div>
      );
    });
  };

  return (
    <div className="p-2 h-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        isDraggable={!state.reduceMotion}
        isResizable={!state.reduceMotion}
        useCSSTransforms={true}
        draggableHandle=".widget-drag-handle"
      >
        {generateDOM()}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardShell;
