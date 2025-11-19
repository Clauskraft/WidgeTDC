import { MCPMessage, McpContext } from '@widget-tdc/mcp-types';

type ToolPayload = Record<string, unknown>;

export type MCPToolHandler<TPayload extends ToolPayload = ToolPayload, TResult = unknown> = (
  payload: TPayload,
  ctx: McpContext,
) => Promise<TResult> | TResult;

class MCPRegistry {
  private tools: Map<string, MCPToolHandler> = new Map();

  registerTool<TPayload extends ToolPayload = ToolPayload, TResult = unknown>(
    toolName: string,
    handler: MCPToolHandler<TPayload, TResult>,
  ): void {
    if (this.tools.has(toolName)) {
      console.warn(`Tool ${toolName} is already registered. Overwriting...`);
    }
    this.tools.set(toolName, handler as MCPToolHandler);
    console.log(`Registered MCP tool: ${toolName}`);
  }

  async route(message: MCPMessage<ToolPayload>): Promise<unknown> {
    const handler = this.tools.get(message.tool);

    if (!handler) {
      throw new Error(`No handler registered for tool: ${message.tool}`);
    }

    const payload = message.payload ?? {};
    const ctx: McpContext = {
      orgId: typeof payload.orgId === 'string' ? payload.orgId : 'default-org',
      userId: typeof payload.userId === 'string' ? payload.userId : 'default-user',
      boardId: typeof payload.boardId === 'string' ? payload.boardId : undefined,
    };

    try {
      return await handler(payload, ctx);
    } catch (error) {
      console.error(`Error executing tool ${message.tool}:`, error);
      throw error;
    }
  }

  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}

export const mcpRegistry = new MCPRegistry();
