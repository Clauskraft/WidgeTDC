/**
 * MCP Type Definitions for Matrix UI
 * Aligned with WidgetTDC backend MCP infrastructure
 */

export interface MCPMessage {
  id: string;
  type: 'tool_call' | 'resource_read' | 'query' | 'subscribe';
  tool?: string;
  resource?: string;
  params?: Record<string, unknown>;
  timestamp: number;
}

export interface MCPResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  meta?: {
    source: string;
    latency: number;
    cached: boolean;
  };
  timestamp: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPConnection {
  id: string;
  url: string;
  connected: boolean;
  lastActivity: number;
}

export interface MCPEvent {
  type: 'connected' | 'disconnected' | 'response' | 'error' | 'tool_result' | 'stream_chunk';
  data: unknown;
  timestamp: number;
}

// PRD-specific types
export interface PRDDocument {
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'markdown' | 'text';
  source: 'upload' | 'vidensarkiv' | 'graph';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface GeneratedPrototype {
  id: string;
  prdId?: string;
  name: string;
  htmlContent: string;
  version: number;
  status: 'generating' | 'complete' | 'error';
  createdAt: Date;
}

export interface PrototypeGenerationRequest {
  prdContent: string;
  prdType: 'pdf' | 'markdown' | 'text';
  options?: {
    style?: 'modern' | 'minimal' | 'corporate';
    framework?: 'vanilla' | 'tailwind' | 'bootstrap';
    locale?: string;
  };
}
