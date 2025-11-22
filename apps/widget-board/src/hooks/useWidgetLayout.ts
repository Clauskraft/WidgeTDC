import { useState, useCallback } from 'react';

export interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useWidgetLayout = (initialLayout: WidgetPosition[] = []) => {
  const [widgets, setWidgets] = useState<WidgetPosition[]>(initialLayout);
  const [savedLayouts, setSavedLayouts] = useState<Record<string, WidgetPosition[]>>({});

  const moveWidget = useCallback((id: string, x: number, y: number) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, x, y } : w)
    );
  }, []);

  const resizeWidget = useCallback((id: string, width: number, height: number) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, width, height } : w)
    );
  }, []);

  const saveLayout = useCallback((layoutName: string = 'default') => {
    setSavedLayouts(prev => ({
      ...prev,
      [layoutName]: widgets
    }));
    localStorage.setItem(`widget-layout-${layoutName}`, JSON.stringify(widgets));
  }, [widgets]);

  const loadLayout = useCallback((layoutName: string = 'default') => {
    const stored = localStorage.getItem(`widget-layout-${layoutName}`);
    if (stored) {
      setWidgets(JSON.parse(stored));
    }
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(initialLayout);
  }, [initialLayout]);

  return {
    widgets,
    moveWidget,
    resizeWidget,
    saveLayout,
    loadLayout,
    resetLayout
  };
};
