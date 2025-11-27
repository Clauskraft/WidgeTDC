// MCP (Model Context Protocol) Type Definitions

export interface MCPMessage {
  id: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: Record<string, any>;
  timestamp?: number;
}

export interface MCPResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: number;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface MCPEvent {
  type: 'message' | 'response' | 'error' | 'connected' | 'disconnected';
  data: MCPMessage | MCPResponse | any;
  timestamp: number;
}

export type MCPEventHandler = (event: MCPEvent) => void;

export interface MCPConnection {
  id: string;
  url: string;
  connected: boolean;
  lastActivity?: number;
}
