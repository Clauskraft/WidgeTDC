/**
 * MCP Integration with Autonomous System
 * 
 * Auto-registers MCP tools as data sources in the autonomous system
 * for intelligent routing and self-healing
 */

import { mcpRegistry } from '../mcpRegistry.js';
import { getSourceRegistry } from '../SourceRegistry.js';
import { DataSource } from './DecisionEngine.js';
import { SelfHealingAdapter } from './SelfHealingAdapter.js';
import { getCognitiveMemory } from '../memory/CognitiveMemory.js';
import { OutlookJsonAdapter } from '../../services/external/OutlookJsonAdapter.js';
import { join } from 'path';
import { cwd } from 'process';

/**
 * Register all MCP tools as autonomous data sources
 */
export async function registerMCPToolsAsSources(): Promise<void> {
    const sourceRegistry = getSourceRegistry();
    const memory = getCognitiveMemory();
    const tools = mcpRegistry.getRegisteredTools();

    console.log(`🔗 Registering ${tools.length} MCP tools as autonomous data sources...`);

    for (const toolName of tools) {
        try {
            // Parse tool name to extract domain
            const [domain, operation] = toolName.split('.');
            const capabilities = [
                toolName,
                `${domain}.*`,
                operation || '*'
            ];

            // Create base data source
            const baseSource: DataSource = {
                name: `mcp-${toolName}`,
                type: 'mcp-tool',
                capabilities,
                isHealthy: async () => {
                    // Check if tool is registered
                    return mcpRegistry.getRegisteredTools().includes(toolName);
                },
                estimatedLatency: 100, // MCP tools typically fast
                costPerQuery: 0, // MCP tools are free
                query: async (op: string, params: any) => {
                    // Route through MCP registry
                    // Include operation in payload so handlers can distinguish different operations
                    return await mcpRegistry.route({
                        id: `auton-${Date.now()}`,
                        createdAt: new Date().toISOString(),
                        sourceId: 'autonomous-agent',
                        targetId: 'mcp-registry',
                        tool: toolName,
                        payload: {
                            ...(params || {}),
                            operation: op // Include operation parameter for routing
                        }
                    });
                }
            };

            // Wrap with self-healing adapter
            const selfHealingSource = new SelfHealingAdapter(
                {
                    name: baseSource.name,
                    type: baseSource.type,
                    query: async (operation: string, params: any) => {
                        return await baseSource.query!(operation, params);
                    },
                    health: async () => {
                        const healthy = await baseSource.isHealthy();
                        return {
                            healthy,
                            score: healthy ? 1.0 : 0.0
                        };
                    }
                },
                memory
            );

            // Register as data source with self-healing wrapper
            sourceRegistry.registerSource({
                ...baseSource,
                query: async (op: string, params: any) => {
                    return await selfHealingSource.query(op, params);
                },
                isHealthy: async () => {
                    const health = await selfHealingSource.health();
                    return health.healthy;
                }
            });

            console.log(`  ✓ Registered: ${toolName} → mcp-${toolName}`);
        } catch (error: any) {
            console.warn(`  ⚠️  Failed to register ${toolName}: ${error.message}`);
        }
    }

    console.log(`✅ Registered ${tools.length} MCP tools as autonomous sources`);
}

/**
 * Register database as data source
 */
export async function registerDatabaseSource(): Promise<void> {
    const sourceRegistry = getSourceRegistry();
    const { getDatabase } = await import('../../database/index.js');

    sourceRegistry.registerSource({
        name: 'database-main',
        type: 'database',
        capabilities: ['*', 'database.*', 'agents.*', 'memory.*', 'srag.*', 'evolution.*', 'pal.*'],
        isHealthy: async () => {
            try {
                const db = getDatabase();
                const stmt = db.prepare('SELECT 1');
                stmt.get();
                stmt.free();
                return true;
            } catch {
                return false;
            }
        },
        estimatedLatency: 50,
        costPerQuery: 0,
        query: async (_operation: string, _params: any) => {
            // Database queries are handled by repositories
            // This is a placeholder - actual routing happens in repositories
            throw new Error('Database query routing handled by repositories');
        }
    });

    console.log('📌 Registered database as autonomous source');
}

/**
 * Register Outlook JSON source
 */
export async function registerOutlookSource(): Promise<void> {
    const sourceRegistry = getSourceRegistry();
    // Path to data file
    const dataPath = join(cwd(), 'apps', 'backend', 'data', 'outlook-mails.json');
    
    const adapter = new OutlookJsonAdapter(dataPath);
    
    sourceRegistry.registerSource({
        name: 'outlook-mail',
        type: 'email-adapter',
        capabilities: ['email.search', 'email.read', 'communication.history'],
        isHealthy: async () => true, // File adapter is always "healthy" if file exists or not (just returns empty)
        estimatedLatency: 20, // Fast local read
        costPerQuery: 0,
        query: async (operation: string, params: any) => {
            return await adapter.query(operation, params);
        }
    });

    console.log(`📌 Registered Outlook JSON source (path: ${dataPath})`);
}

/**
 * Initialize all autonomous data sources
 */
export async function initializeAutonomousSources(): Promise<void> {
    // Register database first (highest priority for most queries)
    await registerDatabaseSource();

    // Register Outlook source
    await registerOutlookSource();

    // Wait a bit for MCP tools to be registered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Register all MCP tools as sources
    await registerMCPToolsAsSources();
}
