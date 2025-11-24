/**
 * Autonomous MCP Router
 * 
 * Handles autonomous query routing with AI-powered source selection
 */

import { Router } from 'express';
import { getCognitiveMemory } from './memory/CognitiveMemory';
import { AutonomousAgent, startAutonomousLearning } from './autonomous/AutonomousAgent';
import { getSourceRegistry } from './SourceRegistry';
import { getDatabase } from '../database/index.js';
import { eventBus } from './EventBus.js';
import { hybridSearchEngine } from './cognitive/HybridSearchEngine.js';
import { emotionAwareDecisionEngine } from './cognitive/EmotionAwareDecisionEngine.js';
import { unifiedMemorySystem } from './cognitive/UnifiedMemorySystem.js';
import { unifiedGraphRAG } from './cognitive/UnifiedGraphRAG.js';
import { stateGraphRouter } from './cognitive/StateGraphRouter.js';
import { patternEvolutionEngine } from './cognitive/PatternEvolutionEngine.js';
import { agentTeam } from './cognitive/AgentTeam.js';

// WebSocket server for real-time events (will be injected)
let wsServer: any = null;

// Agent instance (declared before setWebSocketServer to avoid race condition)
let agent: AutonomousAgent | null = null;

export function setWebSocketServer(server: any): void {
    wsServer = server;
    // Update agent instance if it already exists
    if (agent) {
        agent.setWebSocketServer(server);
    }
}

export const autonomousRouter = Router();

// Re-export for convenience
export { startAutonomousLearning };

/**
 * Initialize agent (called from main server)
 */
export function initAutonomousAgent(): AutonomousAgent {
    if (agent) return agent;

    const memory = getCognitiveMemory();
    const registry = getSourceRegistry();

    agent = new AutonomousAgent(memory, registry, wsServer);

    // Listen to system events
    eventBus.onEvent('system.alert', async (event) => {
        if (agent) {
            console.log('🤖 Agent received system alert:', event);
            // TODO: Trigger autonomous response logic here
        }
    });

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
/**
 * Get decision history
 */
autonomousRouter.get('/decisions', async (req, res) => {
    try {
        const db = getDatabase();
        const limit = parseInt(req.query.limit as string) || 50;

        const stmt = db.prepare(`
            SELECT * FROM mcp_decision_log
            ORDER BY timestamp DESC
            LIMIT ?
        `);
        // Use variadic parameters for consistency with sqlite3 API
        const decisions = stmt.all(limit);
        stmt.free();

        res.json({ decisions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get learned patterns
 */
autonomousRouter.get('/patterns', async (req, res) => {
    try {
        const memory = getCognitiveMemory();
        const widgetId = req.query.widgetId as string;

        if (widgetId) {
            const patterns = await memory.getWidgetPatterns(widgetId);
            res.json({ patterns });
        } else {
            // Get all patterns
            const db = getDatabase();
            const stmt = db.prepare(`
                SELECT DISTINCT widget_id, query_type, source_used, 
                       AVG(latency_ms) as avg_latency,
                       COUNT(*) as frequency
                FROM query_patterns
                GROUP BY widget_id, query_type, source_used
                ORDER BY frequency DESC
                LIMIT 100
            `);
            const patterns = stmt.all();
            stmt.free();
            res.json({ patterns });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Trigger manual learning cycle
 */
autonomousRouter.post('/learn', async (req, res) => {
    if (!agent) {
        return res.status(503).json({ error: 'Agent not initialized' });
    }

    try {
        await agent.learn();
        res.json({
            success: true,
            message: 'Learning cycle completed'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * MCP Tool: Manage Project Memory
 * Allows autonomous agent to document its own actions
 */
autonomousRouter.post('/manage_project_memory', async (req, res) => {
    try {
        // Support both flat and nested param formats
        const action = req.body.action;
        const params = req.body.params || req.body;

        const { eventType, event_type, component_name, status, details, metadata,
            name, description, featureStatus, limit } = params;

        // Import projectMemory here to avoid circular dependency
        const { projectMemory } = await import('../services/project/ProjectMemory.js');

        switch (action) {
            case 'log_event':
                const finalEventType = eventType || event_type;
                if (!finalEventType || !status) {
                    return res.status(400).json({ error: 'event_type and status required' });
                }

                // Merge component_name and description into details if provided
                const eventDetails = {
                    ...(details || {}),
                    ...(component_name && { component_name }),
                    ...(description && { description }),
                    ...(metadata && { metadata })
                };

                projectMemory.logLifecycleEvent({
                    eventType: finalEventType,
                    status,
                    details: eventDetails
                });
                console.log(`✅ [ProjectMemory] Logged ${finalEventType} event: ${status}`);
                res.json({ success: true, message: 'Event logged', eventType: finalEventType });
                break;

            case 'add_feature':
                const featureName = name || params.feature_name;
                const featureDesc = description;
                const featureStat = featureStatus || params.status;

                if (!featureName || !featureDesc || !featureStat) {
                    return res.status(400).json({
                        error: 'feature_name, description, and status required',
                        received: { name: featureName, description: featureDesc, status: featureStat }
                    });
                }

                projectMemory.addFeature({
                    name: featureName,
                    description: featureDesc,
                    status: featureStat
                });
                console.log(`✅ [ProjectMemory] Added feature: ${featureName} (${featureStat})`);
                res.json({ success: true, message: 'Feature added', featureName });
                break;

            case 'query_history':
                const queryLimit = limit || params.limit || 50;
                const events = projectMemory.getLifecycleEvents(queryLimit);
                res.json({ success: true, events, count: events.length });
                break;

            case 'update_feature':
                if (!name || !featureStatus) {
                    return res.status(400).json({ error: 'name and featureStatus required' });
                }
                projectMemory.updateFeatureStatus(name, featureStatus);
                console.log(`✅ [ProjectMemory] Updated feature: ${name} → ${featureStatus}`);
                res.json({ success: true, message: 'Feature updated' });
                break;

            default:
                res.status(400).json({
                    error: 'Invalid action',
                    validActions: ['log_event', 'add_feature', 'query_history', 'update_feature'],
                    received: { action, params }
                });
        }
    } catch (error: any) {
        console.error('❌ [ProjectMemory] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

/**
 * Hybrid search endpoint
 */
autonomousRouter.post('/search', async (req, res) => {
    try {
        const { query, limit, filters } = req.body;
        const userId = (req as any).user?.id || 'anonymous';
        const orgId = (req as any).user?.orgId || 'default';

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const results = await hybridSearchEngine.search(query, {
            userId,
            orgId,
            timestamp: new Date(),
            limit: limit || 20,
            filters: filters || {}
        });

        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error: any) {
        console.error('Hybrid search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Emotion-aware decision endpoint
 */
autonomousRouter.post('/decision', async (req, res) => {
    try {
        const query = req.body;
        const userId = (req as any).user?.id || 'anonymous';
        const orgId = (req as any).user?.orgId || 'default';

        const decision = await emotionAwareDecisionEngine.makeDecision(query, {
            userId,
            orgId
        });

        res.json({
            success: true,
            decision
        });
    } catch (error: any) {
        console.error('Emotion-aware decision error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GraphRAG endpoint - Multi-hop reasoning over knowledge graph
 */
autonomousRouter.post('/graphrag', async (req, res) => {
    try {
        const { query, maxHops, context } = req.body;
        const userId = (req as any).user?.id || context?.userId || 'anonymous';
        const orgId = (req as any).user?.orgId || context?.orgId || 'default';

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const result = await unifiedGraphRAG.query(query, {
            userId,
            orgId
        });

        res.json({
            success: true,
            result,
            query,
            maxHops: maxHops || 2
        });
    } catch (error: any) {
        console.error('GraphRAG error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * StateGraphRouter endpoint - LangGraph-style state routing
 */
autonomousRouter.post('/stategraph', async (req, res) => {
    try {
        const { taskId, input } = req.body;

        if (!taskId || !input) {
            return res.status(400).json({ error: 'taskId and input are required' });
        }

        // Initialize state
        const state = stateGraphRouter.initState(taskId, input);

        // Route until completion
        let currentState = state;
        let iterations = 0;
        const maxIterations = 20;

        while (currentState.status === 'active' && iterations < maxIterations) {
            currentState = await stateGraphRouter.route(currentState);
            iterations++;
        }

        res.json({
            success: true,
            state: currentState,
            iterations,
            checkpoints: stateGraphRouter.getCheckpoints(taskId)
        });
    } catch (error: any) {
        console.error('StateGraphRouter error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PatternEvolutionEngine endpoint - Strategy evolution
 */
autonomousRouter.post('/evolve', async (req, res) => {
    try {
        await patternEvolutionEngine.evolveStrategies();

        const currentStrategy = patternEvolutionEngine.getCurrentStrategy();
        const history = patternEvolutionEngine.getEvolutionHistory();

        res.json({
            success: true,
            currentStrategy,
            history: history.slice(0, 10), // Last 10 evolutions
            message: 'Evolution cycle completed'
        });
    } catch (error: any) {
        console.error('PatternEvolution error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get current evolution strategy
 */
autonomousRouter.get('/evolution/strategy', async (req, res) => {
    try {
        const strategy = patternEvolutionEngine.getCurrentStrategy();
        const history = patternEvolutionEngine.getEvolutionHistory();

        res.json({
            success: true,
            current: strategy,
            history: history.slice(0, 20)
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * AgentTeam endpoint - Route message to role-based agents
 */
autonomousRouter.post('/agentteam', async (req, res) => {
    try {
        const { from, to, type, content, metadata } = req.body;
        const userId = (req as any).user?.id || metadata?.userId || 'anonymous';
        const orgId = (req as any).user?.orgId || metadata?.orgId || 'default';

        if (!content) {
            return res.status(400).json({ error: 'content is required' });
        }

        const message = {
            from: from || 'user',
            to: to || 'all',
            type: type || 'query',
            content,
            metadata: { ...metadata, userId, orgId },
            timestamp: new Date()
        };

        const result = await agentTeam.routeMessage(message);

        res.json({
            success: true,
            result,
            message
        });
    } catch (error: any) {
        console.error('AgentTeam error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * AgentTeam coordination endpoint - Complex multi-agent tasks
 */
autonomousRouter.post('/agentteam/coordinate', async (req, res) => {
    try {
        const { task, context } = req.body;

        if (!task) {
            return res.status(400).json({ error: 'task is required' });
        }

        const result = await agentTeam.coordinate(task, context);

        res.json({
            success: true,
            result
        });
    } catch (error: any) {
        console.error('AgentTeam coordination error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get AgentTeam status
 */
autonomousRouter.get('/agentteam/status', async (req, res) => {
    try {
        const statuses = await agentTeam.getAllStatuses();

        res.json({
            success: true,
            agents: statuses,
            totalAgents: statuses.length,
            activeAgents: statuses.filter(s => s.active).length
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get PAL agent conversation history
 */
autonomousRouter.get('/agentteam/pal/history', async (req, res) => {
    try {
        const palAgent = agentTeam.getAgent('pal');
        if (!palAgent) {
            return res.status(404).json({ error: 'PAL agent not found' });
        }

        // Access conversation history if available
        const history = (palAgent as any).getConversationHistory?.() || [];

        res.json({
            success: true,
            history,
            count: history.length
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get system health with cognitive analysis
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

        // Get cognitive system health
        const cognitiveHealth = await unifiedMemorySystem.analyzeSystemHealth();

        res.json({
            status: healthyCount > 0 ? 'healthy' : 'unhealthy',
            healthySourcesCount: healthyCount,
            totalSourcesCount: totalCount,
            sources: sourceHealth,
            cognitive: {
                globalHealth: cognitiveHealth.globalHealth,
                componentHealth: cognitiveHealth.componentHealth,
                wholePartRatio: cognitiveHealth.wholePartRatio,
                healthVariance: cognitiveHealth.healthVariance
            }
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});
