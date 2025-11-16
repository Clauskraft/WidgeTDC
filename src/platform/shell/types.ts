/**
 * Platform Shell Types
 * 
 * Enterprise dashboard shell types supporting multi-monitor layouts,
 * real-time collaboration, accessibility, and keyboard navigation.
 */

import type { Layout } from 'react-grid-layout';
import type { WidgetInstanceId, WidgetTypeId } from '../widgets/types';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Dashboard state containing widget instances and layout
 */
export interface DashboardState {
  /** Active widget instances */
  instances: Map<WidgetInstanceId, {
    widgetType: WidgetTypeId;
    config?: Record<string, unknown>;
    state?: Record<string, unknown>;
  }>;
  
  /** Current layout configuration */
  layout: Layout[];
  
  /** Active template ID (if any) */
  templateId?: string;
  
  /** Last modified timestamp */
  lastModified: Date;
}

/**
 * Dashboard template for saved layouts
 */
export interface DashboardTemplate {
  /** Unique template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Template thumbnail (base64 or URL) */
  thumbnail?: string;
  
  /** Widget instances in template */
  instances: Array<{
    widgetType: WidgetTypeId;
    layout: Layout[number];
    config?: Record<string, unknown>;
  }>;
  
  /** Template author */
  author?: {
    id: string;
    name: string;
  };
  
  /** Whether template is shared */
  shared: boolean;
  
  /** Template tags for discovery */
  tags?: string[];
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Collaboration state for real-time editing
 */
export interface CollaborationState {
  /** Whether collaboration is enabled */
  enabled: boolean;
  
  /** Active collaborators */
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
    activeWidgetId?: WidgetInstanceId;
  }>;
  
  /** Conflict resolution mode */
  conflictResolution: 'last-write-wins' | 'manual' | 'operational-transform';
  
  /** Session ID for collaboration */
  sessionId?: string;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Reduce motion preference */
  reduceMotion: boolean;
  
  /** High contrast mode */
  highContrast: boolean;
  
  /** Screen reader announcements */
  screenReaderEnabled: boolean;
  
  /** Keyboard navigation mode */
  keyboardNavigation: boolean;
  
  /** Focus indicator style */
  focusIndicator: 'default' | 'enhanced' | 'high-visibility';
  
  /** Font size multiplier */
  fontSizeMultiplier: number;
  
  /** WCAG compliance level */
  wcagLevel: 'A' | 'AA' | 'AAA';
}

/**
 * Keyboard shortcut configuration
 */
export interface ShellShortcutConfig {
  /** Shortcut key combination */
  key: string;
  
  /** Shortcut description */
  description: string;
  
  /** Shortcut action */
  action: string;
  
  /** Whether shortcut is enabled */
  enabled: boolean;
  
  /** Shortcut scope */
  scope: 'global' | 'widget';
}

/**
 * Shell shortcuts configuration
 */
export interface ShellShortcutsConfig {
  /** Registered shortcuts */
  shortcuts: ShellShortcutConfig[];
  
  /** Whether shortcuts are enabled globally */
  enabled: boolean;
}

/**
 * User preferences for the shell
 */
export interface UserPreferences {
  /** Theme mode */
  theme: ThemeMode;
  
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
  
  /** Keyboard shortcuts */
  shortcuts: ShellShortcutsConfig;
  
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
  
  /** Default dashboard template */
  defaultTemplate?: string;
}

/**
 * Monitor configuration for multi-monitor support
 */
export interface MonitorConfig {
  /** Monitor identifier */
  id: string;
  
  /** Monitor dimensions */
  dimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  
  /** Whether this is the primary monitor */
  primary: boolean;
  
  /** Dashboard state for this monitor */
  dashboard?: DashboardState;
}

/**
 * Platform Shell interface
 * 
 * Manages the dashboard shell state, layouts, templates, and user preferences.
 */
export interface PlatformShell {
  /**
   * Get current dashboard state
   */
  getDashboardState(): Promise<DashboardState>;
  
  /**
   * Update dashboard state
   * @param state New dashboard state
   */
  updateDashboardState(state: Partial<DashboardState>): Promise<void>;
  
  /**
   * Save current dashboard as template
   * @param template Template metadata
   * @returns Created template
   */
  saveTemplate(template: Omit<DashboardTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardTemplate>;
  
  /**
   * Load a dashboard template
   * @param templateId Template ID
   * @returns Whether load was successful
   */
  loadTemplate(templateId: string): Promise<boolean>;
  
  /**
   * List available templates
   * @param filters Optional filters
   * @returns Array of templates
   */
  listTemplates(filters?: { shared?: boolean; tags?: string[] }): Promise<DashboardTemplate[]>;
  
  /**
   * Delete a template
   * @param templateId Template ID
   * @returns Whether deletion was successful
   */
  deleteTemplate(templateId: string): Promise<boolean>;
  
  /**
   * Get user preferences
   */
  getPreferences(): Promise<UserPreferences>;
  
  /**
   * Update user preferences
   * @param preferences Updated preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Promise<void>;
  
  /**
   * Get collaboration state
   */
  getCollaborationState(): Promise<CollaborationState>;
  
  /**
   * Update collaboration state
   * @param state Updated collaboration state
   */
  updateCollaborationState(state: Partial<CollaborationState>): Promise<void>;
  
  /**
   * Export dashboard state
   * @param format Export format
   * @returns Serialized dashboard
   */
  exportDashboard(format: 'json' | 'yaml'): Promise<string>;
  
  /**
   * Import dashboard state
   * @param data Serialized dashboard
   * @param format Import format
   * @returns Whether import was successful
   */
  importDashboard(data: string, format: 'json' | 'yaml'): Promise<boolean>;
}
