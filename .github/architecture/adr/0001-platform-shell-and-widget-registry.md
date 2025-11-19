# ADR-0001: Platform Shell and Widget Registry 2.0

## Status
Accepted

## Context

The WidgeTDC platform requires a robust foundation for managing widgets and dashboard layouts. The existing widget system needs to be formalized into an enterprise-grade architecture that supports:

1. **Dynamic Widget Discovery**: Ability to discover and load widgets at runtime from multiple sources (proprietary, Microsoft compatibility layer, marketplace, custom)
2. **Version Management**: Support for semantic versioning, dependency resolution, and rollback capabilities
3. **Security**: Digital signature verification and capability-based permissions
4. **Performance Monitoring**: Track widget performance metrics for optimization
5. **Layout Management**: Professional dashboard shell with multi-monitor support, templates, and collaboration

### Current State

- Basic widget registry using React context (`WidgetRegistryContext.tsx`)
- Simple widget definitions with `id`, `name`, `component`, and `defaultLayout`
- Dashboard shell using `react-grid-layout` for widget positioning
- No formal versioning or validation system
- Limited metadata and no security verification

### Requirements

**Functional**:
- Register widgets from multiple sources
- Validate widget manifests
- Query widgets by capabilities, source, or metadata
- Manage dashboard layouts and templates
- Support real-time collaboration (Phase 2+)
- Provide accessibility configurations

**Non-Functional**:
- Type-safe TypeScript interfaces
- GDPR-compliant metadata handling
- Backward compatible with existing widgets
- Extensible for future enhancements (signatures, marketplace)

## Decision

We will implement a comprehensive **Widget Registry 2.0** and **Platform Shell** architecture with the following components:

### Widget Registry 2.0

**Type System** (`src/platform/widgets/types.ts`):

````typescript
// Core widget manifest describing metadata, capabilities, and requirements
interface WidgetManifest {
  id: WidgetTypeId;
  name: string;
  version: WidgetVersion;
  description: string;
  author: { name: string; email?: string; url?: string };
  capabilities: WidgetCapabilities;
  defaultLayout: WidgetLayout;
  constraints?: { minW?: number; maxW?: number; minH?: number; maxH?: number };
  dependencies?: { widgets?: Array<...>; platformVersion?: string };
  signature?: WidgetSignature;  // Phase 2+
  source: WidgetSource;
  metadata?: Record<string, unknown>;
}

// Widget instance on dashboard
interface WidgetInstance {
  id: WidgetInstanceId;
  widgetType: WidgetTypeId;
  layout: WidgetLayout;
  config?: Record<string, unknown>;
  state?: Record<string, unknown>;
  metrics?: WidgetPerformanceMetrics;
  createdAt: Date;
  updatedAt: Date;
}

// Widget capabilities for discovery and filtering
interface WidgetCapabilities {
  features: WidgetCapability[];
  requiresNetwork: boolean;
  storesData: boolean;
  gdprCompliant: boolean;
  permissions?: string[];
}
````

**Registry Interface** (`src/platform/widgets/registry.ts`):

````typescript
interface WidgetRegistry {
  register(definition: WidgetDefinition): Promise<WidgetValidationResult>;
  unregister(id: WidgetTypeId): Promise<boolean>;
  get(id: WidgetTypeId): Promise<WidgetRegistryEntry | undefined>;
  query(query: WidgetRegistryQuery): Promise<WidgetRegistryEntry[]>;
  listAll(): Promise<WidgetRegistryEntry[]>;
  validate(manifest: WidgetManifest): Promise<WidgetValidationResult>;
  setEnabled(id: WidgetTypeId, enabled: boolean): Promise<boolean>;
  has(id: WidgetTypeId): Promise<boolean>;
  count(): Promise<number>;
}
````

### Platform Shell

**Type System** (`src/platform/shell/types.ts`):

````typescript
// Dashboard state management
interface DashboardState {
  instances: Map<WidgetInstanceId, { widgetType: WidgetTypeId; config?: ...; state?: ... }>;
  layout: Layout[];
  templateId?: string;
  lastModified: Date;
}

// Layout templates for saved configurations
interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  instances: Array<{ widgetType: WidgetTypeId; layout: Layout[number]; config?: ... }>;
  author?: { id: string; name: string };
  shared: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User preferences and accessibility
interface UserPreferences {
  theme: ThemeMode;
  accessibility: AccessibilityConfig;
  shortcuts: ShellShortcutsConfig;
  autoSaveInterval?: number;
  defaultTemplate?: string;
}

// Accessibility configuration (WCAG 2.1 AA compliance)
interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-visibility';
  fontSizeMultiplier: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
}
````

**Shell Interface**:

````typescript
interface PlatformShell {
  getDashboardState(): Promise<DashboardState>;
  updateDashboardState(state: Partial<DashboardState>): Promise<void>;
  saveTemplate(template: Omit<DashboardTemplate, 'id' | ...>): Promise<DashboardTemplate>;
  loadTemplate(templateId: string): Promise<boolean>;
  listTemplates(filters?: ...): Promise<DashboardTemplate[]>;
  deleteTemplate(templateId: string): Promise<boolean>;
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(preferences: Partial<UserPreferences>): Promise<void>;
  exportDashboard(format: 'json' | 'yaml'): Promise<string>;
  importDashboard(data: string, format: 'json' | 'yaml'): Promise<boolean>;
}
````

### Integration with Existing Code

The new architecture is designed to be **non-invasive**:

1. **Backward Compatibility**: Existing widgets continue to work via adapter pattern
2. **Gradual Migration**: Components can adopt new types incrementally
3. **Context Preservation**: Existing `WidgetRegistryContext` can delegate to new registry
4. **No Breaking Changes**: All existing public APIs remain functional

## Consequences

### Positive

✅ **Type Safety**: Comprehensive TypeScript types catch errors at compile-time  
✅ **Extensibility**: Well-defined interfaces support future enhancements  
✅ **Security**: Foundation for signature verification and capability-based permissions  
✅ **Performance**: Structured metrics enable monitoring and optimization  
✅ **Accessibility**: Built-in WCAG 2.1 AA compliance support  
✅ **Enterprise-Ready**: Supports versioning, templates, and collaboration  
✅ **GDPR-Compliant**: Metadata-focused design avoids storing sensitive content

### Negative

⚠️ **Complexity**: More sophisticated type system requires learning curve  
⚠️ **Migration Effort**: Existing widgets need adaptation (but backward compatible)  
⚠️ **Bundle Size**: Additional types and interfaces increase bundle size (~10KB)

### Mitigation

- Comprehensive documentation and examples
- Adapter functions for easy migration
- Tree-shaking to minimize bundle impact
- Gradual rollout starting with new widgets

## Alternatives Considered

### Alternative 1: Extend Existing Registry
**Rejected**: Would require breaking changes and doesn't provide clean separation of concerns

### Alternative 2: Use External Widget Framework
**Rejected**: Adds significant dependency overhead and reduces control over architecture

### Alternative 3: Minimal Types Only
**Rejected**: Insufficient for enterprise requirements (versioning, security, monitoring)

## Implementation Notes

### Phase 1 (Current)
- ✅ Define all TypeScript interfaces
- ✅ Implement in-memory registry for development
- ✅ Create adapter for existing widgets
- ✅ Document migration guide

### Phase 2 (Future)
- Digital signature verification
- Widget marketplace integration
- Remote widget loading
- Version conflict resolution

### Phase 3 (Future)
- Real-time collaboration support
- Multi-monitor docking
- Advanced layout algorithms
- Performance optimization tools

## References

- SystemOverSeer Architecture: `.github/agents/SystemOverSeer.md`
- Widget Registry Context: `contexts/WidgetRegistryContext.tsx`
- Existing Widget Types: `types.ts`
- React Grid Layout: https://github.com/react-grid-layout/react-grid-layout

---

**Date**: 2024-11-16  
**Author**: Chief Architect (SystemOverSeer)  
**Reviewers**: Frontend Architect, Security Architect  
**Status**: Implemented in Phase 1
