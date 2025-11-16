// Core MCP message interface
export interface MCPMessage<TPayload = any> {
  id: string;
  traceId?: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: TPayload;
  createdAt: string;
}

export interface McpContext {
  orgId: string;
  userId: string;
  boardId?: string;
}

// Re-export specialized MCP types
export * from './memory';
export * from './srag';
export * from './evolution';
export * from './pal';
