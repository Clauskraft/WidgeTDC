import type { Layout } from 'react-grid-layout';

export type Theme = 'light' | 'dark';

export interface GlobalState {
  theme: Theme;
  reduceMotion: boolean;
  user: { name: string } | null;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  defaultLayout: { w: number; h: number };
}

export interface WidgetInstance {
  id: string; // Unique instance ID, e.g., 'AgentChatWidget-1629384'
  widgetType: string; // ID from WidgetDefinition, e.g., 'AgentChatWidget'
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
  icon: React.ComponentType<{ className?: string }>;
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