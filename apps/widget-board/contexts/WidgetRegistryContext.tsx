import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { staticWidgetRegistry, widgetMetadata } from '../src/staticWidgetRegistry';

// Widget entry with metadata
export interface WidgetEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  type?: 'app' | 'tool';
  component: React.LazyExoticComponent<any>;
  defaultLayout: { w: number; h: number };
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  enabled?: boolean;
}

// Alias for backward compatibility
export type WidgetRegistryEntry = WidgetEntry;

// Define the shape of our context
interface WidgetRegistryContextType {
  availableWidgets: WidgetEntry[];
  getWidgetComponent: (id: string) => React.ComponentType<any> | null;
  isLoading: boolean;
  registerWidget?: (widget: WidgetEntry) => void;
  setEnabled?: (id: string, enabled: boolean) => void;
}

const WidgetRegistryContext = createContext<WidgetRegistryContextType | undefined>(undefined);

export function WidgetRegistryProvider({ children }: { children: ReactNode }) {
  const [availableWidgets, setAvailableWidgets] = useState<WidgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Build widget entries from static registry
    const entries: WidgetEntry[] = Object.entries(staticWidgetRegistry).map(([id, component]) => {
      const meta = widgetMetadata[id] || {
        name: id,
        description: '',
        category: 'misc',
        defaultLayout: { w: 6, h: 2 },
        type: 'app'
      };

      return {
        id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        type: (meta as any).type || 'app',
        component: component as React.LazyExoticComponent<any>,
        defaultLayout: meta.defaultLayout,
      };
    });

    console.log(`[WidgetRegistry] Loaded ${entries.length} widgets:`, entries.map(e => e.id));
    setAvailableWidgets(entries);
    setIsLoading(false);
  }, []);

  const getWidgetComponent = (id: string): React.ComponentType<any> | null => {
    const component = staticWidgetRegistry[id];
    if (!component) {
      console.warn(`[WidgetRegistry] Widget component not found for ID: ${id}`);
      return null;
    }
    return component;
  };

  return (
    <WidgetRegistryContext.Provider value={{ availableWidgets, getWidgetComponent, isLoading }}>
      {children}
    </WidgetRegistryContext.Provider>
  );
}

export const useWidgetRegistry = () => {
  const context = useContext(WidgetRegistryContext);
  if (context === undefined) {
    throw new Error('useWidgetRegistry must be used within a WidgetRegistryProvider');
  }
  return context;
};
