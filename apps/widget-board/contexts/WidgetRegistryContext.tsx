import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import type { WidgetDefinition } from '../types';
import { GenericDataWidget } from '../components/GenericDataWidget';
import { WIDGET_REGISTRY } from '../widgetRegistry';

// ============================================================================
// WIDGET REGISTRY 2.0 - Enhanced with Version Management & Performance
// ============================================================================

interface WidgetVersion {
  major: number;
  minor: number;
  patch: number;
}

interface WidgetPerformanceMetrics {
  renderTime: number; // milliseconds
  memoryUsage: number; // bytes
  loadTime: number; // milliseconds
  lastUpdated: Date;
}

export interface WidgetRegistryEntry extends WidgetDefinition {
  version: WidgetVersion;
  enabled: boolean;
  metrics?: WidgetPerformanceMetrics;
  registeredAt: Date;
  updatedAt: Date;
}

interface WidgetRegistryQuery {
  id?: string;
  enabled?: boolean;
  source?: string;
  search?: string;
}

interface WidgetRegistryContextType {
  // Core Registry Operations
  availableWidgets: WidgetRegistryEntry[];
  registerWidget: (widget: WidgetDefinition, version?: WidgetVersion, source?: string) => void;
  unregisterWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, widget: Partial<WidgetDefinition>) => void;

  // Query & Discovery
  getWidget: (widgetId: string) => WidgetRegistryEntry | undefined;
  queryWidgets: (query: WidgetRegistryQuery) => WidgetRegistryEntry[];
  findByCapability: (capability: string) => WidgetRegistryEntry[];

  // Version Management
  getWidgetVersions: (widgetId: string) => WidgetVersion[];
  rollbackToVersion: (widgetId: string, version: WidgetVersion) => void;

  // Performance Monitoring
  updateMetrics: (widgetId: string, metrics: Partial<WidgetPerformanceMetrics>) => void;
  getMetrics: (widgetId: string) => WidgetPerformanceMetrics | undefined;

  // State Management
  setEnabled: (widgetId: string, enabled: boolean) => void;
  count: () => number;
  clear: () => void;
}

const WidgetRegistryContext = createContext<WidgetRegistryContextType | undefined>(undefined);

const CUSTOM_WIDGETS_STORAGE_KEY = 'widgetboard_custom_widgets';

const parseVersion = (versionString?: string): WidgetVersion => {
  const parts = (versionString || '1.0.0').split('.').map(p => parseInt(p, 10));
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
};

const versionToString = (version: WidgetVersion): string =>
  `${version.major}.${version.minor}.${version.patch}`;

export const WidgetRegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Map<string, WidgetRegistryEntry>>(new Map());
  const versionHistoryRef = useRef<Map<string, WidgetVersion[]>>(new Map());

  // Auto-discover widget modules
  const widgetModules = import.meta.glob('../widgets/*.tsx');

  useEffect(() => {
    // 1. Register Built-in Widgets from WIDGET_REGISTRY
    Object.values(WIDGET_REGISTRY).forEach((def: any) => {
      // Convert registry path (e.g., "./widgets/Name") to glob path (e.g., "../widgets/Name.tsx")
      const modulePath = def.path.replace('./', '../') + '.tsx';
      const importer = widgetModules[modulePath];

      if (importer) {
        const LazyComponent = React.lazy(importer as any);
        // Register without triggering a re-render loop (using the internal setEntries directly would be better but registerWidget is wrapped in useCallback)
        // We'll use a direct map update pattern in a separate effect or just call registerWidget

        // Construct the full definition
        const fullDef: WidgetDefinition = {
          id: def.id,
          name: def.name,
          description: def.description,
          category: def.category,
          component: LazyComponent,
          defaultLayout: def.defaultSize,
          source: 'builtin',
          // Add other props if needed
        };

        // We can't call registerWidget here easily because it might depend on state. 
        // But registerWidget updates state. 
        // Let's just update the initial state or do it once.

        setEntries(prev => {
          const updated = new Map(prev);
          if (!updated.has(def.id)) {
            const now = new Date();
            updated.set(def.id, {
              ...fullDef,
              version: parseVersion('1.0.0'),
              enabled: true,
              registeredAt: now,
              updatedAt: now,
              source: 'builtin'
            });
          }
          return updated;
        });
      } else {
        console.warn(`Widget module not found for ${def.id} at ${modulePath}`);
      }
    });

    // 2. Load custom widgets from localStorage
    try {
      const savedWidgetsJSON = localStorage.getItem(CUSTOM_WIDGETS_STORAGE_KEY);
      if (savedWidgetsJSON) {
        const customWidgets: WidgetDefinition[] = JSON.parse(savedWidgetsJSON);

        setEntries(prev => {
          const updated = new Map<string, WidgetRegistryEntry>(prev);
          customWidgets.forEach(widgetDef => {
            // Re-hydrate the widget with its component and register it
            const entry: WidgetRegistryEntry = { ...widgetDef, component: GenericDataWidget, enabled: true, registeredAt: new Date(), updatedAt: new Date(), version: parseVersion('1.0.0') };
            updated.set(widgetDef.id, entry);
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to load custom widgets from localStorage", error);
    }
  }, []);

  const registerWidget = useCallback((
    widget: WidgetDefinition,
    version?: WidgetVersion,
    source: string = 'builtin'
  ) => {
    const widgetVersion = version || parseVersion(widget.id);
    const now = new Date();

    const entry: WidgetRegistryEntry = {
      ...widget,
      version: widgetVersion,
      enabled: true,
      registeredAt: now,
      updatedAt: now,
      source: source as 'builtin' | 'dynamic' | 'remote' | 'marketplace',
    };

    setEntries(prev => {
      const updated = new Map<string, WidgetRegistryEntry>(prev);
      const existing = updated.get(widget.id);

      if (existing) {
        // Track version history
        const history = versionHistoryRef.current.get(widget.id) || [];
        history.push(existing.version);
        versionHistoryRef.current.set(widget.id, history);
      }

      updated.set(widget.id, entry);
      return updated;
    });

    // Persist dynamic widgets to localStorage
    if (source === 'dynamic') {
      setEntries(currentEntries => {
        const dynamicWidgets = Array.from(currentEntries.values())
          .filter(w => w.source === 'dynamic')
          .map(({ component, ...rest }) => rest); // Strip non-serializable component

        localStorage.setItem(CUSTOM_WIDGETS_STORAGE_KEY, JSON.stringify(dynamicWidgets));
        return currentEntries;
      });
    }
  }, []);

  const unregisterWidget = useCallback((widgetId: string) => {
    setEntries(prev => {
      const updated = new Map<string, WidgetRegistryEntry>(prev);
      updated.delete(widgetId);
      return updated;
    });
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetDefinition>) => {
    setEntries(prev => {
      const updated = new Map<string, WidgetRegistryEntry>(prev);
      const existing = updated.get(widgetId);
      if (existing) {
        updated.set(widgetId, { ...existing, ...updates, updatedAt: new Date() });
      }
      return updated;
    });
  }, []);

  const getWidget = useCallback((widgetId: string) => {
    return entries.get(widgetId);
  }, [entries]);

  const queryWidgets = useCallback((query: WidgetRegistryQuery) => {
    const results: WidgetRegistryEntry[] = [];

    for (const entry of entries.values()) {
      if (query.id && entry.id !== query.id) continue;
      if (query.enabled !== undefined && entry.enabled !== query.enabled) continue;
      if (query.source && entry.source !== query.source) continue;
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        if (!entry.name.toLowerCase().includes(searchLower) &&
          !entry.id.toLowerCase().includes(searchLower)) {
          continue;
        }
      }
      results.push(entry);
    }

    return results;
  }, [entries]);

  const findByCapability = useCallback((capability: string) => {
    const results: WidgetRegistryEntry[] = [];

    for (const entry of entries.values()) {
      // Check if widget supports this capability through metadata
      if (entry.id.toLowerCase().includes(capability.toLowerCase())) {
        results.push(entry);
      }
    }

    return results;
  }, [entries]);

  const getWidgetVersions = useCallback((widgetId: string) => {
    const current = entries.get(widgetId);
    const history = versionHistoryRef.current.get(widgetId) || [];
    return current ? [...history, current.version] : history;
  }, [entries]);

  const rollbackToVersion = useCallback((widgetId: string, version: WidgetVersion) => {
    const current = entries.get(widgetId);
    if (!current) return;

    // For now, just update the version - full rollback would need version snapshots
    setEntries(prev => {
      const updated = new Map(prev);
      updated.set(widgetId, { ...current, version, updatedAt: new Date() });
      return updated;
    });
  }, [entries]);

  const updateMetrics = useCallback((widgetId: string, metrics: Partial<WidgetPerformanceMetrics>) => {
    setEntries(prev => {
      const updated = new Map<string, WidgetRegistryEntry>(prev);
      const entry = updated.get(widgetId);
      if (entry) {
        entry.metrics = { ...entry.metrics, ...metrics, lastUpdated: new Date() };
      }
      return updated;
    });
  }, []);

  const getMetrics = useCallback((widgetId: string) => {
    return entries.get(widgetId)?.metrics;
  }, [entries]);

  const setEnabled = useCallback((widgetId: string, enabled: boolean) => {
    setEntries(prev => {
      const updated = new Map<string, WidgetRegistryEntry>(prev);
      const entry = updated.get(widgetId);
      if (entry) {
        entry.enabled = enabled;
      }
      return updated;
    });
  }, []);

  const count = useCallback(() => entries.size, [entries]);

  const clear = useCallback(() => {
    setEntries(new Map());
    versionHistoryRef.current.clear();
  }, []);

  const value: WidgetRegistryContextType = {
    availableWidgets: Array.from(entries.values()),
    registerWidget,
    unregisterWidget,
    updateWidget,
    getWidget,
    queryWidgets,
    findByCapability,
    getWidgetVersions,
    rollbackToVersion,
    updateMetrics,
    getMetrics,
    setEnabled,
    count,
    clear,
  };

  return (
    <WidgetRegistryContext.Provider value={value}>
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
