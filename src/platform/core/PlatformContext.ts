/**
 * Platform Context and Services Bootstrap
 * 
 * Central platform context that wires together all enterprise services
 * (audit, widgets, shell, agents, prompts, vectors, domain services).
 */

import type { AuditLogService } from '../audit/types';
import type { WidgetRegistry } from '../widgets/registry';
import type { PlatformShell } from '../shell/types';
import type { VectorStoreAdapter } from '../vector/types';
import type { NotesAggregatorService } from '../../domain/notes/types';
import type { SecurityOverwatchService } from '../../domain/security/types';
import type { ProcurementIntelligenceService } from '../../domain/procurement/types';

/**
 * Agent Chat Service interface (Phase 2 placeholder)
 */
export interface AgentChatService {
  // Phase 2: Multi-agent orchestration, conversation threading, etc.
  sendMessage(message: string): Promise<string>;
}

/**
 * Prompt Library Service interface (Phase 2 placeholder)
 */
export interface PromptLibraryService {
  // Phase 2: Team-shared prompts, versioning, A/B testing, etc.
  getPrompt(id: string): Promise<{ id: string; text: string } | undefined>;
  listPrompts(): Promise<Array<{ id: string; title: string }>>;
}

/**
 * Platform services container
 */
export interface PlatformServices {
  /** Audit log service for compliance and monitoring */
  auditLog: AuditLogService;
  
  /** Widget registry for dynamic widget management */
  widgetRegistry: WidgetRegistry;
  
  /** Platform shell for dashboard and layout management */
  platformShell: PlatformShell;
  
  /** Agent chat service for AI interactions (Phase 2+) */
  agentChat: AgentChatService;
  
  /** Prompt library service for prompt management (Phase 2+) */
  promptLibrary: PromptLibraryService;
  
  /** Vector store adapter for semantic search (Phase 4+) */
  vectorStore: VectorStoreAdapter;
  
  /** Notes aggregator service for multi-source note management */
  notesAggregator: NotesAggregatorService;
  
  /** Security overwatch service for threat monitoring */
  securityOverwatch: SecurityOverwatchService;
  
  /** Procurement intelligence service for tender management */
  procurementIntelligence: ProcurementIntelligenceService;
}

/**
 * Platform bootstrap options
 */
export interface PlatformBootstrapOptions {
  /** Whether to enable audit logging */
  enableAudit?: boolean;
  
  /** Whether to enable vector store */
  enableVectorStore?: boolean;
  
  /** Custom service implementations */
  customServices?: Partial<PlatformServices>;
}

/**
 * Bootstrap the platform with all services
 * 
 * @param options Bootstrap options
 * @returns Platform services container
 */
export async function bootstrapPlatform(
  options: PlatformBootstrapOptions = {}
): Promise<PlatformServices> {
  // Services will be instantiated by PlatformProvider
  // This function provides a factory pattern for service creation
  
  // Import implementations dynamically to avoid circular dependencies
  const { InMemoryAuditLogService } = await import('../audit/InMemoryAuditLogService');
  const { InMemoryVectorStoreAdapter } = await import('../vector/InMemoryVectorStoreAdapter');
  const { InMemoryNotesAggregatorService } = await import('../../domain/notes/InMemoryNotesAggregatorService');
  const { InMemorySecurityOverwatchService } = await import('../../domain/security/InMemorySecurityOverwatchService');
  const { InMemoryProcurementIntelligenceService } = await import('../../domain/procurement/InMemoryProcurementIntelligenceService');
  
  // Create default implementations
  const auditLog = options.enableAudit !== false 
    ? new InMemoryAuditLogService()
    : createNoOpAuditLog();
  
  const vectorStore = options.enableVectorStore !== false
    ? new InMemoryVectorStoreAdapter()
    : createNoOpVectorStore();
  
  const widgetRegistry = createInMemoryWidgetRegistry();
  const platformShell = createInMemoryPlatformShell();
  const agentChat = createPlaceholderAgentChat();
  const promptLibrary = createPlaceholderPromptLibrary();
  const notesAggregator = new InMemoryNotesAggregatorService();
  const securityOverwatch = new InMemorySecurityOverwatchService();
  const procurementIntelligence = new InMemoryProcurementIntelligenceService();
  
  return {
    auditLog,
    widgetRegistry,
    platformShell,
    agentChat,
    promptLibrary,
    vectorStore,
    notesAggregator,
    securityOverwatch,
    procurementIntelligence,
    ...options.customServices,
  };
}

/**
 * Create a no-op audit log service for when audit is disabled
 */
function createNoOpAuditLog(): AuditLogService {
  return {
    append: async () => ({} as any),
    query: async () => [],
    getById: async () => undefined,
    verifyIntegrity: async () => ({ valid: true, eventsVerified: 0, verifiedAt: new Date() }),
    getStatistics: async () => ({
      totalEvents: 0,
      byDomain: {} as any,
      bySensitivity: {} as any,
      byOutcome: {} as any,
    }),
    archiveExpiredEvents: async () => 0,
    exportEvents: async () => '',
  };
}

/**
 * Create a no-op vector store adapter for when vector store is disabled
 */
function createNoOpVectorStore(): VectorStoreAdapter {
  return {
    upsert: async () => ({} as any),
    batchUpsert: async () => [],
    search: async () => [],
    getById: async () => undefined,
    deleteById: async () => false,
    batchDelete: async () => 0,
    deleteNamespace: async () => 0,
    listNamespaces: async () => [],
    getStatistics: async () => ({
      totalRecords: 0,
      byNamespace: {},
      estimatedSize: 0,
    }),
    healthCheck: async () => true,
  };
}

/**
 * Create in-memory widget registry
 */
function createInMemoryWidgetRegistry(): WidgetRegistry {
  const registry = new Map();
  
  return {
    register: async (definition) => {
      registry.set(definition.manifest.id, {
        definition,
        registeredAt: new Date(),
        validation: { valid: true, errors: [], warnings: [] },
        enabled: true,
      });
      return { valid: true, errors: [], warnings: [] };
    },
    unregister: async (id) => registry.delete(id),
    get: async (id) => registry.get(id),
    query: async (query) => {
      let results = Array.from(registry.values());
      if (query.id) results = results.filter(e => e.definition.manifest.id === query.id);
      if (query.enabled !== undefined) results = results.filter(e => e.enabled === query.enabled);
      return results;
    },
    listAll: async () => Array.from(registry.values()),
    validate: async () => ({ valid: true, errors: [], warnings: [] }),
    setEnabled: async (id, enabled) => {
      const entry = registry.get(id);
      if (!entry) return false;
      entry.enabled = enabled;
      return true;
    },
    has: async (id) => registry.has(id),
    count: async () => registry.size,
  };
}

/**
 * Create in-memory platform shell
 */
function createInMemoryPlatformShell(): PlatformShell {
  let dashboardState = {
    instances: new Map(),
    layout: [],
    lastModified: new Date(),
  };
  
  const templates = new Map();
  let preferences = {
    theme: 'light' as const,
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      focusIndicator: 'default' as const,
      fontSizeMultiplier: 1,
      wcagLevel: 'AA' as const,
    },
    shortcuts: {
      shortcuts: [],
      enabled: true,
    },
  };
  
  return {
    getDashboardState: async () => dashboardState,
    updateDashboardState: async (state) => {
      dashboardState = { ...dashboardState, ...state, lastModified: new Date() };
    },
    saveTemplate: async (template) => {
      const id = `TPL${Date.now()}`;
      const fullTemplate = {
        ...template,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      templates.set(id, fullTemplate);
      return fullTemplate;
    },
    loadTemplate: async (templateId) => {
      const template = templates.get(templateId);
      return !!template;
    },
    listTemplates: async () => Array.from(templates.values()),
    deleteTemplate: async (templateId) => templates.delete(templateId),
    getPreferences: async () => preferences,
    updatePreferences: async (prefs) => {
      preferences = { ...preferences, ...prefs };
    },
    getCollaborationState: async () => ({
      enabled: false,
      collaborators: [],
      conflictResolution: 'last-write-wins' as const,
    }),
    updateCollaborationState: async () => {},
    exportDashboard: async (format) => {
      return format === 'json' 
        ? JSON.stringify(dashboardState, null, 2)
        : 'theme: light\n';
    },
    importDashboard: async () => true,
  };
}

/**
 * Create placeholder agent chat service (Phase 2)
 */
function createPlaceholderAgentChat(): AgentChatService {
  return {
    sendMessage: async (message) => {
      return `Echo: ${message} (Placeholder - Phase 2 implementation pending)`;
    },
  };
}

/**
 * Create placeholder prompt library service (Phase 2)
 */
function createPlaceholderPromptLibrary(): PromptLibraryService {
  const prompts = new Map([
    ['default', { id: 'default', text: 'You are a helpful assistant.' }],
  ]);
  
  return {
    getPrompt: async (id) => prompts.get(id),
    listPrompts: async () => Array.from(prompts.values()).map(p => ({ id: p.id, title: p.id })),
  };
}
