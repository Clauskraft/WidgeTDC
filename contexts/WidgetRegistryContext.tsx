
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { WidgetDefinition } from '../types';

interface WidgetRegistryContextType {
  availableWidgets: WidgetDefinition[];
  registerWidget: (widget: WidgetDefinition) => void;
}

const WidgetRegistryContext = createContext<WidgetRegistryContextType | undefined>(undefined);

export const WidgetRegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);

  const registerWidget = useCallback((widget: WidgetDefinition) => {
    setAvailableWidgets(prev => {
        if (prev.some(w => w.id === widget.id)) {
            return prev;
        }
        return [...prev, widget];
    });
  }, []);

  return (
    <WidgetRegistryContext.Provider value={{ availableWidgets, registerWidget }}>
      {children}
    </WidgetRegistryContext.Provider>
  );
};

export const useWidgetRegistry = () => {
  const context = useContext(WidgetRegistryContext);
  if (context === undefined) {
    throw new Error('useWidgetRegistry must be used within a WidgetRegistryProvider');
  }
  return context;
};
