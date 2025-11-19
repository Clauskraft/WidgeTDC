import { MCPMessage, McpContext } from '@widget-tdc/mcp-types';

export type MCPToolHandler = (payload: any, ctx: McpContext) => Promise<any>;

class MCPRegistry {
  private tools: Map<string, MCPToolHandler> = new Map();

  registerTool(toolName: string, handler: MCPToolHandler): void {
    if (this.tools.has(toolName)) {
      console.warn(`Tool ${toolName} is already registered. Overwriting...`);
    }
    this.tools.set(toolName, handler);
    console.log(`Registered MCP tool: ${toolName}`);
  }

  async route(message: MCPMessage): Promise<any> {
    const handler = this.tools.get(message.tool);
    
    if (!handler) {
      throw new Error(`No handler registered for tool: ${message.tool}`);
    }

    // Extract context from message
    const ctx: McpContext = {
      orgId: message.payload.orgId || 'default-org',
      userId: message.payload.userId || 'default-user',
      boardId: message.payload.boardId,
    };

    try {
      const result = await handler(message.payload, ctx);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${message.tool}:`, error);
      throw error;
    }
  }

  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const mcpRegistry = new MCPRegistry();
