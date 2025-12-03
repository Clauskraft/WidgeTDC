// Domain types for the widget framework

export interface WidgetContext {
  userId: string;
  organizationId: string;
  boardId: string;
  widgetId: string;
  nowIso: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  icon: string;
  init(context: WidgetContext): Promise<void>;
}

// Re-export specialized domain types
export * from './memory';
export * from './srag';
export * from './evolution';
export * from './pal';
export * from './showpad';
