import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { WidgetDefinition } from '../types';

interface WidgetRegistryContextType {
  availableWidgets: WidgetDefinition[];
  registerWidget: (widget: WidgetDefinition) => void;
  addDynamicWidget: (widget: WidgetDefinition) => void;
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

  const addDynamicWidget = useCallback((widget: WidgetDefinition) => {
    setAvailableWidgets(prev => {
        if (prev.some(w => w.id === widget.id)) {
            // Do not add if a widget with the same ID already exists.
            // A more advanced implementation could offer to update it.
            return prev;
        }
        return [...prev, widget];
    });
  }, []);

  return (
    <WidgetRegistryContext.Provider value={{ availableWidgets, registerWidget, addDynamicWidget }}>
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