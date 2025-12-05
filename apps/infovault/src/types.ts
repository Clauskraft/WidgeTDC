// Core Types for InfoVault

export type ItemType = 'person' | 'project' | 'note' | 'link' | 'document' | 'idea' | 'task' | 'contact';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'active' | 'archived' | 'pending' | 'completed';
export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface InfoItem {
  id: string;
  type: ItemType;
  title: string;
  content: string;
  tags: string[];
  priority: Priority;
  status: Status;
  securityLevel: SecurityLevel;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
  neo4jId?: string;
  relationships?: Relationship[];
}

export interface InfoGroup {
  id: string;
  name: string;
  color: string;
  icon?: string;
  itemCount: number;
}

// Graph Types
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Relationship {
  id: string;
  type: string;
  targetId: string;
  targetLabel: string;
  direction: 'in' | 'out';
}

// AI Provider Types
export type AIProvider = 'ollama' | 'mistral' | 'gemini' | 'deepseek';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  apiKeyRequired: boolean;
  endpoint: string;
  model: string;
  capabilities: string[];
}

export interface AIAnalysisResult {
  summary: string;
  entities: ExtractedEntity[];
  suggestedType: ItemType;
  suggestedTags: string[];
  suggestedPriority: Priority;
  confidence: number;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

// Agent Types
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  agent: string;
  inputSchema?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  result?: unknown;
  createdAt: Date;
}

// Quick Capture Types
export interface QuickCaptureResult {
  raw: string;
  parsed: Partial<InfoItem>;
  entities: ExtractedEntity[];
  suggestions: string[];
}

// WidgetTDC Integration Types
export interface WidgetTDCStatus {
  connected: boolean;
  neo4jConnected: boolean;
  agentsAvailable: string[];
  nodeCount: number;
  relationshipCount: number;
}
