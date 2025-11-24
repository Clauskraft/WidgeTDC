import { Agent, Tool } from 'agentset';
import { MCPMessage } from '../../mcp/types';
import { routeMcpMessage } from '../../mcp/mcpRouter.js';

/**
 * AgentsetAdapter – bridges existing MCP tools to Agentset agents.
 * All MCP tools are registered as Agentset tools so they can be
 * invoked from an agentic workflow.
 */
export class AgentsetAdapter {
    private agent: Agent;

    constructor() {
        this.agent = new Agent({ name: 'WidgeTDC-Agent' });
        this.registerMcpTools();
    }

    /** Register every MCP tool as an Agentset tool */
    private async registerMcpTools() {
        // Dynamically import all registered MCP tools
        const { mcpRegistry } = await import('../../mcp/mcpRegistry.js');
        const toolNames = mcpRegistry.getRegisteredTools();
        const tools: Tool[] = toolNames.map((name: string) => ({
            name,
            description: `MCP tool ${name}`,
            async run(payload: any) {
                const msg: MCPMessage = { tool: name, payload };
                return await routeMcpMessage(msg);
            },
        }));
        this.agent.registerTools(tools);
    }

    /** Execute a tool via Agentset – returns the tool's response. */
    async execute(toolName: string, payload: any) {
        return await this.agent.runTool(toolName, payload);
    }
}

// Export a singleton for the rest of the backend
let adapter: AgentsetAdapter | null = null;
export function getAgentsetAdapter(): AgentsetAdapter {
    if (!adapter) adapter = new AgentsetAdapter();
    return adapter;
}
