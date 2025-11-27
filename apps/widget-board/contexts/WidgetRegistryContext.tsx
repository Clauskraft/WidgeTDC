import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import type { WidgetDefinition } from '../types';
import { GenericDataWidget } from '../components/GenericDataWidget';

// ============================================================================
// WIDGET REGISTRY 2.0 - Simplified with Direct Imports
// ============================================================================

interface WidgetVersion {
  major: number;
  minor: number;
  patch: number;
}

interface WidgetPerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  loadTime: number;
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
  availableWidgets: WidgetRegistryEntry[];
  registerWidget: (widget: WidgetDefinition, version?: WidgetVersion, source?: string) => void;
  unregisterWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, widget: Partial<WidgetDefinition>) => void;
  getWidget: (widgetId: string) => WidgetRegistryEntry | undefined;
  queryWidgets: (query: WidgetRegistryQuery) => WidgetRegistryEntry[];
  findByCapability: (capability: string) => WidgetRegistryEntry[];
  getWidgetVersions: (widgetId: string) => WidgetVersion[];
  rollbackToVersion: (widgetId: string, version: WidgetVersion) => void;
  updateMetrics: (widgetId: string, metrics: Partial<WidgetPerformanceMetrics>) => void;
  getMetrics: (widgetId: string) => WidgetPerformanceMetrics | undefined;
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

// Direct lazy imports for all existing widgets
const WIDGET_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  'ActivityStreamWidget': React.lazy(() => import('../widgets/ActivityStreamWidget')),
  'AgentBuilderWidget': React.lazy(() => import('../widgets/AgentBuilderWidget')),
  'AgentChatWidget': React.lazy(() => import('../widgets/AgentChatWidget')),
  'AgentStatusDashboardWidget': React.lazy(() => import('../widgets/AgentStatusDashboardWidget')),
  'AiPalWidget': React.lazy(() => import('../widgets/AiPalWidget')),
  'AudioTranscriberWidget': React.lazy(() => import('../widgets/AudioTranscriberWidget')),
  'CmaDecisionWidget': React.lazy(() => import('../widgets/CmaDecisionWidget')),
  'CodeAnalysisWidget': React.lazy(() => import('../widgets/CodeAnalysisWidget')),
  'CybersecurityOverwatchWidget': React.lazy(() => import('../widgets/CybersecurityOverwatchWidget')),
  'DarkWebMonitorWidget': React.lazy(() => import('../widgets/DarkWebMonitorWidget')),
  'EvolutionAgentWidget': React.lazy(() => import('../widgets/EvolutionAgentWidget')),
  'FeedIngestionWidget': React.lazy(() => import('../widgets/FeedIngestionWidget')),
  'ImageAnalyzerWidget': React.lazy(() => import('../widgets/ImageAnalyzerWidget')),
  'IntelligentNotesWidget': React.lazy(() => import('../widgets/IntelligentNotesWidget')),
  'KanbanWidget': React.lazy(() => import('../widgets/KanbanWidget')),
  'LiveConversationWidget': React.lazy(() => import('../widgets/LiveConversationWidget')),
  'LocalScanWidget': React.lazy(() => import('../widgets/LocalScanWidget')),
  'MCPConnectorWidget': React.lazy(() => import('../widgets/MCPConnectorWidget')),
  'MCPEmailRAGWidget': React.lazy(() => import('../widgets/MCPEmailRAGWidget')),
  'McpRouterWidget': React.lazy(() => import('../widgets/McpRouterWidget')),
  'NetworkSpyWidget': React.lazy(() => import('../widgets/NetworkSpyWidget')),
  'NexusTerminalWidget': React.lazy(() => import('../widgets/NexusTerminalWidget')),
  'PerformanceMonitorWidget': React.lazy(() => import('../widgets/PerformanceMonitorWidget')),
  'PersonaCoordinatorWidget': React.lazy(() => import('../widgets/PersonaCoordinatorWidget')),
  'PersonalAgentWidget': React.lazy(() => import('../widgets/PersonalAgentWidget')),
  'Phase1CFastTrackKanbanWidget': React.lazy(() => import('../widgets/Phase1CFastTrackKanbanWidget')),
  'ProcurementIntelligenceWidget': React.lazy(() => import('../widgets/ProcurementIntelligenceWidget')),
  'PromptLibraryWidget': React.lazy(() => import('../widgets/PromptLibraryWidget')),
  'SearchInterfaceWidget': React.lazy(() => import('../widgets/SearchInterfaceWidget')),
  'SragGovernanceWidget': React.lazy(() => import('../widgets/SragGovernanceWidget')),
  'StatusWidget': React.lazy(() => import('../widgets/StatusWidget')),
  'SystemMonitorWidget': React.lazy(() => import('../widgets/SystemMonitorWidget')),
  'SystemSettingsWidget': React.lazy(() => import('../widgets/SystemSettingsWidget')),
  'VideoAnalyzerWidget': React.lazy(() => import('../widgets/VideoAnalyzerWidget')),
  'WidgetImporterWidget': React.lazy(() => import('../widgets/WidgetImporterWidget')),
};

// Widget metadata (name, description, category, defaultLayout)
const WIDGET_METADATA: Record<string, { name: string; description: string; category: string; defaultLayout: { w: number; h: number } }> = {
  'ActivityStreamWidget': { name: 'Activity Stream', description: 'Real-time activity feed', category: 'monitoring', defaultLayout: { w: 6, h: 2 } },
  'AgentBuilderWidget': { name: 'Agent Builder', description: 'Build custom AI agents', category: 'agents', defaultLayout: { w: 6, h: 3 } },
  'AgentChatWidget': { name: 'Agent Chat', description: 'Chat with AI agents', category: 'communication', defaultLayout: { w: 4, h: 3 } },
  'AgentStatusDashboardWidget': { name: 'Agent Status', description: 'Agent status overview', category: 'agents', defaultLayout: { w: 8, h: 2 } },
  'AiPalWidget': { name: 'AI Pal', description: 'Personal AI assistant', category: 'ai', defaultLayout: { w: 4, h: 3 } },
  'AudioTranscriberWidget': { name: 'Audio Transcriber', description: 'Transcribe audio to text', category: 'media', defaultLayout: { w: 6, h: 2 } },
  'CmaDecisionWidget': { name: 'CMA Decision', description: 'Decision analysis', category: 'analytics', defaultLayout: { w: 6, h: 2 } },
  'CodeAnalysisWidget': { name: 'Code Analysis', description: 'Analyze code quality', category: 'development', defaultLayout: { w: 8, h: 3 } },
  'CybersecurityOverwatchWidget': { name: 'Cybersecurity Overwatch', description: 'Security monitoring', category: 'security', defaultLayout: { w: 8, h: 3 } },
  'DarkWebMonitorWidget': { name: 'Dark Web Monitor', description: 'Monitor dark web threats', category: 'security', defaultLayout: { w: 6, h: 3 } },
  'EvolutionAgentWidget': { name: 'Evolution Agent', description: 'Self-evolving AI', category: 'agents', defaultLayout: { w: 6, h: 2 } },
  'FeedIngestionWidget': { name: 'Feed Ingestion', description: 'Process data feeds', category: 'data', defaultLayout: { w: 6, h: 2 } },
  'ImageAnalyzerWidget': { name: 'Image Analyzer', description: 'AI image analysis', category: 'media', defaultLayout: { w: 6, h: 3 } },
  'IntelligentNotesWidget': { name: 'Intelligent Notes', description: 'Smart note-taking', category: 'productivity', defaultLayout: { w: 4, h: 3 } },
  'KanbanWidget': { name: 'Kanban Board', description: 'Task management', category: 'productivity', defaultLayout: { w: 12, h: 3 } },
  'LiveConversationWidget': { name: 'Live Conversation', description: 'Real-time chat', category: 'communication', defaultLayout: { w: 6, h: 3 } },
  'LocalScanWidget': { name: 'Local Scan', description: 'Scan local system', category: 'security', defaultLayout: { w: 6, h: 2 } },
  'MCPConnectorWidget': { name: 'MCP Connector', description: 'Connect to MCP', category: 'integration', defaultLayout: { w: 4, h: 2 } },
  'MCPEmailRAGWidget': { name: 'MCP Email RAG', description: 'Email RAG processing', category: 'integration', defaultLayout: { w: 6, h: 3 } },
  'McpRouterWidget': { name: 'MCP Router', description: 'Route MCP messages', category: 'integration', defaultLayout: { w: 6, h: 2 } },
  'NetworkSpyWidget': { name: 'Network Spy', description: 'Monitor network', category: 'security', defaultLayout: { w: 6, h: 2 } },
  'NexusTerminalWidget': { name: 'Nexus Terminal', description: 'AI-powered terminal', category: 'development', defaultLayout: { w: 12, h: 3 } },
  'PerformanceMonitorWidget': { name: 'Performance Monitor', description: 'System metrics', category: 'monitoring', defaultLayout: { w: 6, h: 2 } },
  'PersonaCoordinatorWidget': { name: 'Persona Coordinator', description: 'Manage AI personas', category: 'agents', defaultLayout: { w: 6, h: 2 } },
  'PersonalAgentWidget': { name: 'Personal Agent', description: 'Your personal AI', category: 'agents', defaultLayout: { w: 4, h: 2 } },
  'Phase1CFastTrackKanbanWidget': { name: 'Fast Track Kanban', description: 'Project management', category: 'productivity', defaultLayout: { w: 12, h: 3 } },
  'ProcurementIntelligenceWidget': { name: 'Procurement Intelligence', description: 'Procurement insights', category: 'analytics', defaultLayout: { w: 6, h: 2 } },
  'PromptLibraryWidget': { name: 'Prompt Library', description: 'Manage AI prompts', category: 'ai', defaultLayout: { w: 6, h: 3 } },
  'SearchInterfaceWidget': { name: 'Search Interface', description: 'Advanced search', category: 'productivity', defaultLayout: { w: 8, h: 2 } },
  'SragGovernanceWidget': { name: 'SRAG Governance', description: 'Compliance monitoring', category: 'compliance', defaultLayout: { w: 6, h: 2 } },
  'StatusWidget': { name: 'Status', description: 'System status', category: 'monitoring', defaultLayout: { w: 4, h: 1 } },
  'SystemMonitorWidget': { name: 'System Monitor', description: 'System monitoring', category: 'monitoring', defaultLayout: { w: 6, h: 2 } },
  'SystemSettingsWidget': { name: 'System Settings', description: 'Configure settings', category: 'settings', defaultLayout: { w: 6, h: 3 } },
  'VideoAnalyzerWidget': { name: 'Video Analyzer', description: 'AI video analysis', category: 'media', defaultLayout: { w: 8, h: 3 } },
  'WidgetImporterWidget': { name: 'Widget Importer', description: 'Import widgets', category: 'system', defaultLayout: { w: 6, h: 2 } },
};

export const WidgetRegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Map<string, WidgetRegistryEntry>>(new Map());
  const versionHistoryRef = useRef<Map<string, WidgetVersion[]>>(new Map());

  useEffect(() => {
    // Register all widgets with direct imports
    const now = new Date();
    const initialEntries = new Map<string, WidgetRegistryEntry>();

    Object.entries(WIDGET_COMPONENTS).forEach(([id, LazyComponent]) => {
      const meta = WIDGET_METADATA[id] || {
        name: id,
        description: '',
        category: 'misc',
        defaultLayout: { w: 6, h: 2 }
      };

      initialEntries.set(id, {
        id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        component: LazyComponent,
        defaultLayout: meta.defaultLayout,
        source: 'builtin',
        version: parseVersion('1.0.0'),
        enabled: true,
        registeredAt: now,
        updatedAt: now,
      });
    });

    console.log(`[WidgetRegistry] Registered ${initialEntries.size} widgets`);
    setEntries(initialEntries);

    // Load custom widgets from localStorage
    try {
      const savedWidgetsJSON = localStorage.getItem(CUSTOM_WIDGETS_STORAGE_KEY);
      if (savedWidgetsJSON) {
        const customWidgets: WidgetDefinition[] = JSON.parse(savedWidgetsJSON);
        setEntries(prev => {
          const updated = new Map<string, WidgetRegistryEntry>(prev);
          customWidgets.forEach(widgetDef => {
            const entry: WidgetRegistryEntry = {
              ...widgetDef,
              component: GenericDataWidget,
              enabled: true,
              registeredAt: new Date(),
              updatedAt: new Date(),
              version: parseVersion('1.0.0')
            };
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
        const history = versionHistoryRef.current.get(widget.id) || [];
        history.push(existing.version);
        versionHistoryRef.current.set(widget.id, history);
      }

      updated.set(widget.id, entry);
      return updated;
    });

    if (source === 'dynamic') {
      setEntries(currentEntries => {
        const dynamicWidgets = Array.from(currentEntries.values())
          .filter(w => w.source === 'dynamic')
          .map(({ component, ...rest }) => rest);

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
        entry.metrics = { ...entry.metrics, ...metrics, lastUpdated: new Date() } as WidgetPerformanceMetrics;
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
