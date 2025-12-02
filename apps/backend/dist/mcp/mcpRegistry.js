class MCPRegistry {
    constructor() {
        this.tools = new Map();
        this.servers = [];
    }
    registerTool(toolName, handler) {
        if (this.tools.has(toolName)) {
            console.warn(`Tool ${toolName} is already registered. Overwriting...`);
        }
        this.tools.set(toolName, handler);
        console.log(`Registered MCP tool: ${toolName}`);
    }
    registerServer(server) {
        this.servers.push(server);
        console.log(`Registered MCP Server: ${server.name}`);
        // Auto-register tools from server
        server.listTools().then(tools => {
            tools.forEach(tool => {
                this.registerTool(tool.name, async (payload, _ctx) => {
                    return server.callTool(tool.name, payload);
                });
            });
        });
    }
    async readResource(uri) {
        // Simple linear search for now. Can be optimized with a map.
        for (const server of this.servers) {
            try {
                const resources = await server.listResources();
                if (resources.some(r => r.uri === uri)) {
                    return await server.readResource(uri);
                }
            }
            catch (e) {
                console.warn(`Error listing resources from server ${server.name}`, e);
            }
        }
        throw new Error(`Resource not found: ${uri}`);
    }
    async route(message) {
        const handler = this.tools.get(message.tool);
        if (!handler) {
            throw new Error(`No handler registered for tool: ${message.tool}`);
        }
        // Extract context from message
        const ctx = {
            orgId: message.payload.orgId || 'default-org',
            userId: message.payload.userId || 'default-user',
            boardId: message.payload.boardId,
        };
        try {
            const result = await handler(message.payload, ctx);
            return result;
        }
        catch (error) {
            console.error(`Error executing tool ${message.tool}:`, error);
            throw error;
        }
    }
    getRegisteredTools() {
        return Array.from(this.tools.keys());
    }
}
export const mcpRegistry = new MCPRegistry();
