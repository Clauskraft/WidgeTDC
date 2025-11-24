/**
 * Autonomous MCP Router
 * 
 * Handles autonomous query routing with AI-powered source selection
 */

import { Router } from 'express';
import { getCognitiveMemory } from './memory/CognitiveMemory';
import { AutonomousAgent, startAutonomousLearning } from './autonomous/AutonomousAgent';
import { getSourceRegistry } from './SourceRegistry';

export const autonomousRouter = Router();

// Re-export for convenience
export { startAutonomousLearning };

let agent: AutonomousAgent | null = null;

/**
 * Initialize agent (called from main server)
 */
export function initAutonomousAgent(): AutonomousAgent {
    if (agent) return agent;

    const memory = getCognitiveMemory();
    const registry = getSourceRegistry();

    agent = new AutonomousAgent(memory, registry);

    console.log('🤖 Autonomous Agent initialized');

    return agent;
}

/**
 * Autonomous query endpoint
 */
autonomousRouter.post('/query', async (req, res) => {
    if (!agent) {
        return res.status(503).json({
            success: false,
            error: 'Autonomous agent not initialized'
        });
    }

    try {
        const query = req.body;

        // Execute with autonomous routing
        const result = await agent.executeAndLearn(query, async (source) => {
            // Simple executor - calls source.query
            if ('query' in source && typeof source.query === 'function') {
                return await source.query(query.operation, query.params);
            }

            throw new Error(`Source ${source.name} does not support query operation`);
        });

        res.json({
            success: true,
            data: result.data,
            meta: {
                source: result.source,
                latency: result.latencyMs,
                cached: result.cached,
                timestamp: result.timestamp
            }
        });
    } catch (error: any) {
        console.error('Autonomous query error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get agent statistics
 */
autonomousRouter.get('/stats', async (req, res) => {
    if (!agent) {
        return res.status(503).json({ error: 'Agent not initialized' });
    }

    try {
        const stats = await agent.getStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Trigger predictive pre-fetch for a widget
 */
autonomousRouter.post('/prefetch/:widgetId', async (req, res) => {
    if (!agent) {
        return res.status(503).json({ error: 'Agent not initialized' });
    }

    try {
        const { widgetId } = req.params;
        await agent.predictAndPrefetch(widgetId);

        res.json({
            success: true,
            message: `Pre-fetch triggered for ${widgetId}`
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * List available sources
 */
autonomousRouter.get('/sources', async (req, res) => {
    try {
        const registry = getSourceRegistry();
        const sources = registry.getAllSources();

        const sourcesInfo = await Promise.all(
            sources.map(async (source) => {
                try {
                    const health = await source.isHealthy();
                    return {
                        name: source.name,
                        type: source.type,
                        capabilities: source.capabilities,
                        healthy: health,
                        estimatedLatency: source.estimatedLatency,
                        costPerQuery: source.costPerQuery
                    };
                } catch {
                    return {
                        name: source.name,
                        type: source.type,
                        capabilities: source.capabilities,
                        healthy: false,
                        estimatedLatency: source.estimatedLatency,
                        costPerQuery: source.costPerQuery
                    };
                }
            })
        );

        res.json({ sources: sourcesInfo });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get system health
 */
autonomousRouter.get('/health', async (req, res) => {
    try {
        const registry = getSourceRegistry();
        const sources = registry.getAllSources();

        const sourceHealth = await Promise.all(
            sources.map(async (source) => {
                try {
                    const healthy = await source.isHealthy();
                    return {
                        name: source.name,
                        healthy,
                        score: healthy ? 1.0 : 0.0
                    };
                } catch {
                    return {
                        name: source.name,
                        healthy: false,
                        score: 0.0
                    };
                }
            })
        );

        const healthyCount = sourceHealth.filter(s => s.healthy).length;
        const totalCount = sourceHealth.length;

        res.json({
            status: healthyCount > 0 ? 'healthy' : 'unhealthy',
            healthySourcesCount: healthyCount,
            totalSourcesCount: totalCount,
            sources: sourceHealth
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});
