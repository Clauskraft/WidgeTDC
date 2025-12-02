/**
 * AgentsetAdapter – bridges existing MCP tools to agentic workflows.
 *
 * This is a simplified adapter that routes tool calls through the MCP registry
 * without requiring the external 'agentset' package.
 *
 * All MCP tools can be invoked from an agentic workflow via this adapter.
 */
import { mcpRegistry } from '../../mcp/mcpRegistry.js';
export class AgentsetAdapter {
    constructor() {
        this.toolNames = [];
        this.initialized = false;
        // Tools will be loaded on first use
    }
    /** Initialize and load available MCP tools */
    async initialize() {
        if (this.initialized)
            return;
        this.toolNames = mcpRegistry.getRegisteredTools();
        this.initialized = true;
    }
    /** Get list of available tools */
    async getAvailableTools() {
        await this.initialize();
        return [...this.toolNames];
    }
    /** Execute a tool via MCP registry – returns the tool's response. */
    async execute(toolName, payload, ctx) {
        await this.initialize();
        const context = {
            orgId: ctx?.orgId || 'default',
            userId: ctx?.userId || 'system',
            ...ctx
        };
        // Route through MCP registry
        // MCPMessage requires id, sourceId, targetId, createdAt
        const result = await mcpRegistry.route({
            id: `agentic-${Date.now()}`,
            sourceId: 'agentset-adapter',
            targetId: toolName,
            tool: toolName,
            payload: {
                ...payload,
                orgId: context.orgId,
                userId: context.userId
            },
            createdAt: new Date().toISOString()
        });
        return result;
    }
    /** Execute multiple tools in sequence */
    async executeWorkflow(steps, ctx) {
        const results = [];
        for (const step of steps) {
            const result = await this.execute(step.tool, step.payload, ctx);
            results.push(result);
        }
        return results;
    }
}
// Export a singleton for the rest of the backend
let adapter = null;
export function getAgentsetAdapter() {
    if (!adapter) {
        adapter = new AgentsetAdapter();
    }
    return adapter;
}
