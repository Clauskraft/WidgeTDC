// Dashboard Shell Enhanced Types - Phase 1.B Professionalization
import type { Layout, Layouts } from 'react-grid-layout';

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layouts: Layouts;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isShared: boolean;
  tags: string[];
}

export interface CollaborationPresence {
  userId: string;
  userName: string;
  cursorX: number;
  cursorY: number;
  lastActive: Date;
  color: string;
}

export interface MonitorConfiguration {
  id: string;
  displayName: string;
  width: number;
  height: number;
  dpiScale: number;
  isPrimary: boolean;
  position: { x: number; y: number };
}

export interface DockingZone {
  id: string;
  monitorId: string;
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  width: number;
  height: number;
  widgets: string[];
}

export interface LayoutSnapshot {
  id: string;
  timestamp: Date;
  layouts: Layouts;
  description: string;
  action: string;
}

export interface DashboardPreferences {
  autoSave: boolean;
  autoSaveInterval: number;
  showGridLines: boolean;
  snapToGrid: boolean;
  compactLayout: boolean;
  defaultTemplate: string | null;
  keyboardShortcuts: boolean;
  collaborationMode: 'view-only' | 'comment' | 'edit' | 'full-control';
  theme: 'light' | 'dark' | 'auto';
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  action: string;
  description: string;
  enabled: boolean;
}

export interface DragHandleConfig {
  enableMouseDrag: boolean;
  enableTouchDrag: boolean;
  enableKeyboardDrag: boolean;
  snapPixels: number;
  visualFeedback: boolean;
}

export interface DashboardStatus {
  layout: 'loading' | 'ready' | 'error' | 'saving';
  lastSaved: Date | null;
  unsavedChanges: boolean;
  collaborators: CollaborationPresence[];
  selectedWidgets: string[];
  focusedWidget: string | null;
}

export interface UndoRedoAction {
  id: string;
  timestamp: Date;
  action: string;
  layouts: Layouts;
}

export const STORAGE_KEYS = {
  LAYOUTS: 'widgetboard_layouts',
  TEMPLATES: 'widgetboard_layout_templates',
  PREFERENCES: 'widgetboard_preferences',
  SNAPSHOTS: 'widgetboard_layout_snapshots',
  MONITORS: 'widgetboard_monitor_config',
  SHORTCUTS: 'widgetboard_keyboard_shortcuts',
} as const;
