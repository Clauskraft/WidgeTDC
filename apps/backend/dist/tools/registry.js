/**
 * Tool Registry - The Nervous System
 *
 * Central registry that connects all system tools to the brain.
 * This keeps index.ts clean and makes it easy to add new capabilities.
 *
 * Each tool represents a capability the system can invoke.
 */
import { harvestFetchHandler, harvestListHandler, harvestReadHandler, harvestToolDefinitions } from '../mcp/tools/harvestTool.js';
/**
 * All system tools - the capabilities available to agents
 */
const systemTools = [
    // The Harvester - Knowledge Acquisition
    {
        ...harvestToolDefinitions[0], // harvest.fetch
        handler: harvestFetchHandler
    },
    {
        ...harvestToolDefinitions[1], // harvest.list
        handler: harvestListHandler
    },
    {
        ...harvestToolDefinitions[2], // harvest.read
        handler: harvestReadHandler
    }
];
/**
 * Get all system tools for agent registration
 */
export function getSystemTools() {
    return systemTools;
}
/**
 * Get a specific tool by name
 */
export function getTool(name) {
    return systemTools.find(t => t.name === name);
}
/**
 * Register tools with MCP registry
 */
export async function registerSystemTools(mcpRegistry) {
    for (const tool of systemTools) {
        mcpRegistry.registerTool(tool.name, tool.handler);
    }
    console.log(`🔧 System Tools registered: ${systemTools.map(t => t.name).join(', ')}`);
}
/**
 * Get tool definitions for agent context (without handlers)
 */
export function getToolDefinitionsForAgent() {
    return systemTools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema
    }));
}
