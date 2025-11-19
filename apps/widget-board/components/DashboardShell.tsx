import React, { useState, useEffect, useRef } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import WidgetContainer from './WidgetContainer';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useGlobalState } from '../contexts/GlobalStateContext';
import type { WidgetInstance, WidgetConfig } from '../types';
import type { Layout, Layouts } from 'react-grid-layout';
import TrashDropzone from './TrashDropzone';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardShellProps {
  widgets: WidgetInstance[];
  removeWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, config: WidgetConfig) => void;
}

const LAYOUTS_STORAGE_KEY = 'widgetboard_layouts';

const DashboardShell: React.FC<DashboardShellProps> = ({ widgets, removeWidget, updateWidgetConfig }) => {
  const { availableWidgets } = useWidgetRegistry();
  const { state } = useGlobalState();
  const [layouts, setLayouts] = useState<Layouts>(() => {
    try {
      const savedLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      return savedLayouts ? JSON.parse(savedLayouts) : {};
    } catch (error) {
      console.error('Could not parse layouts from localStorage', error);
      return {};
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashRef = useRef<HTMLDivElement>(null);
  const draggedItemRef = useRef<Layout | null>(null);

  useEffect(() => {
    const currentLayout = layouts.lg || [];
    const newWidgets = widgets.filter(w => !currentLayout.some(l => l.i === w.id));

    if (newWidgets.length > 0) {
      const newLayoutItems = newWidgets
        .map(widget => {
          const widgetDef = availableWidgets.find(w => w.id === widget.widgetType);
          if (!widgetDef) return null;
          return {
            i: widget.id,
            x: (currentLayout.length * widgetDef.defaultLayout.w) % 12,
            y: Infinity, // puts it at the bottom
            w: widgetDef.defaultLayout.w,
            h: widgetDef.defaultLayout.h,
            minW: widgetDef.minW,
            maxW: widgetDef.maxW,
            minH: widgetDef.minH,
            maxH: widgetDef.maxH,
          };
        })
        .filter((item): item is Layout => item !== null);

      if (newLayoutItems.length > 0) {
        setLayouts(prev => ({ ...prev, lg: [...(prev.lg || []), ...newLayoutItems] }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets, availableWidgets]);

  const onLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    try {
      // Only save layouts if not dragging to prevent intermediate saves
      if (!isDragging) {
        localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(allLayouts));
        setLayouts(allLayouts);
      }
    } catch (error) {
      console.error('Could not save layouts to localStorage', error);
    }
  };

  const onRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId);
    // When a widget is removed, we must also update the layout state and persist it.
    setLayouts(prev => {
      const newLayouts = { ...prev };
      Object.keys(newLayouts).forEach(breakpoint => {
        // @ts-ignore
        newLayouts[breakpoint] = newLayouts[breakpoint]?.filter(l => l.i !== widgetId);
      });
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(newLayouts));
      return newLayouts;
    });
  };

  const onDragStart = (layout: Layout[], oldItem: Layout) => {
    setIsDragging(true);
    draggedItemRef.current = oldItem;
  };

  const onDrag = (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    e: MouseEvent
  ) => {
    if (trashRef.current) {
      const trashRect = trashRef.current.getBoundingClientRect();
      const isOver = e.clientY > trashRect.top;
      setIsOverTrash(isOver);
    }
  };

  const onDragStop = () => {
    if (isOverTrash && draggedItemRef.current) {
      onRemoveWidget(draggedItemRef.current.i);
    }
    setIsDragging(false);
    setIsOverTrash(false);
    draggedItemRef.current = null;
  };

  const generateDOM = () => {
    return widgets.map(widget => {
      const widgetDef = availableWidgets.find(w => w.id === widget.widgetType);
      if (!widgetDef) return null;

      return (
        <WidgetContainer
          key={widget.id}
          widgetId={widget.id}
          widgetType={widget.widgetType}
          config={widget.config}
          onRemove={() => onRemoveWidget(widget.id)}
          onConfigChange={(config) => updateWidgetConfig(widget.id, config)}
        />
      );
    });
  };

  // Filter layouts to ensure we only render layouts for existing widgets and apply constraints.
  const synchronizedLayouts: Layouts = {};
  Object.keys(layouts).forEach(breakpoint => {
    const widgetIds = new Set(widgets.map(w => w.id));
    // @ts-ignore
    const filteredLayout = layouts[breakpoint]?.filter(l => widgetIds.has(l.i));

    // @ts-ignore
    synchronizedLayouts[breakpoint] = filteredLayout?.map(layoutItem => {
      const widget = widgets.find(w => w.id === layoutItem.i);
      const widgetDef = widget ? availableWidgets.find(w => w.id === widget.widgetType) : undefined;

      if (widgetDef) {
        return {
          ...layoutItem,
          minW: widgetDef.minW,
          maxW: widgetDef.maxW,
          minH: widgetDef.minH,
          maxH: widgetDef.maxH,
        };
      }
      return layoutItem;
    });
  });

  return (
    <div className="p-2 h-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={synchronizedLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragStop={onDragStop}
        isDraggable={!state.reduceMotion}
        isResizable={!state.reduceMotion}
        useCSSTransforms={true}
        draggableHandle=".widget-drag-handle"
      >
        {generateDOM()}
      </ResponsiveGridLayout>
      <TrashDropzone ref={trashRef} isVisible={isDragging} isActive={isOverTrash} />
    </div>
  );
};

export default DashboardShell;
