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

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface Resource {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
}

export interface MCPServer {
  name: string;
  version: string;
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: any): Promise<any>;
  listResources(): Promise<Resource[]>;
  readResource(uri: string): Promise<string | Buffer>;
}
