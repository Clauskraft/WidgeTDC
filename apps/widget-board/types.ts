import type { Layout } from 'react-grid-layout';
// FIX: Import ComponentType to resolve 'Cannot find namespace React' error.
import type { ComponentType } from 'react';

export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  org_id: string;
  aulaConnected?: boolean;
}

export interface GlobalState {
  theme: Theme;
  reduceMotion: boolean;
  user: User | null;
}

// Flyttet fra MSWidgetAdapter.ts og opdateret for at undgå cirkulære afhængigheder og øge fleksibiliteten.
export interface MSWidget {
  id: string;
  displayName: string;
  template: any;
  dataSource?: {
    url: string;
  };
  capabilities: string[];
  size?: string;
  detectionSource?: string; // Tilføjet for at vise kilden i UI'en
}

export interface MSWidgetDetectionResult {
  widgets: MSWidget[];
  source: string;
  confidence: number;
}


export type WidgetCategory =
  | 'cybersecurity'
  | 'ai-agents'
  | 'media-analysis'
  | 'productivity'
  | 'development'
  | 'business'
  | 'communication'
  | 'system'
  | 'project-management';

export interface WidgetProps {
  widgetId: string;
  config: WidgetConfig;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  category: WidgetCategory;
  component: ComponentType<WidgetProps>;
  defaultLayout: { w: number; h: number };
  source: 'proprietary' | 'microsoft' | 'builtin' | 'dynamic' | 'remote' | 'marketplace';
  msWidgetData?: MSWidget;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface WidgetInstance {
  id: string; // Unique instance ID, e.g., 'AgentChatWidget-1629384'
  widgetType: string; // ID from WidgetDefinition, e.g., 'AgentChatWidget'
  config?: WidgetConfig; // Widget-specific configuration
}

export interface WidgetConfig {
  [key: string]: any; // Generic config structure for widget-specific settings
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  sources?: GroundingSource[];
}

export interface TranscriptEntry {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export interface Prompt {
  id: string;
  title: string;
  text: string;
  category: string;
  tags: string[];
}

export interface Metrics {
  cpu_percent: number;
  memory_percent: number;
  api_response_time: number;
  timestamp: number;
}

export type ToolStatus = 'mandatory' | 'recommended' | 'excluded' | 'optional';

export interface ToolSuggestion {
  name: string;
  status: ToolStatus;
  description: string;
  category: string;
}

export interface Agent {
  id: string;
  name: string;
  instruction: string;
  tools: string[];
}

// MCP Connector Widget Types
export type DataSourceCategory = 'Database' | 'API' | 'File' | 'Cloud Service';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number';
  placeholder: string;
  required: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  category: DataSourceCategory;
  // FIX: Use imported ComponentType.
  icon: ComponentType<{ className?: string }>;
  fields: FormField[];
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing';

export interface Connection {
  id: string;
  name: string;
  dataSourceId: string;
  status: ConnectionStatus;
  config: Record<string, any>;
}

// Types for Email RAG Widget
export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
}

export type Tone = 'Professionel' | 'Venlig' | 'Afslappet' | 'Kortfattet';

export interface ReplySuggestion {
  text: string;
  confidence: number;
  tone: Tone;
  basedOnEmails: string[];
}
