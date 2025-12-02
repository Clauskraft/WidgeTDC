/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    CORTEX API - VISUAL BRIDGE                             ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Exposes system health and graph status to frontend visualization         ║
 * ║  Handover #007 - Visual Cortex Activation                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
import { Router } from 'express';
import { neo4jAdapter } from '../adapters/Neo4jAdapter';
import { selfHealing } from '../services/SelfHealingAdapter';
const router = Router();
/**
 * GET /api/cortex/status
 * Returns unified system health status for frontend visualization
 */
router.get('/status', async (req, res) => {
    try {
        // Get Neo4j health status
        const dbHealth = await neo4jAdapter.healthCheck();
        // Get self-healing system status
        const systemStatus = selfHealing.getSystemStatus();
        // Determine provider based on URI
        const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const isCloud = neo4jUri.includes('neo4j.io');
        const response = {
            brain: {
                connected: dbHealth.connected,
                nodes: dbHealth.nodeCount || 0,
                relationships: dbHealth.relationshipCount || 0,
                latencyMs: dbHealth.latencyMs || -1,
                provider: isCloud ? 'AuraDB' : 'Local Docker',
                lastCheck: dbHealth.lastCheck
            },
            immune_system: {
                status: systemStatus.overallHealth,
                active_services: systemStatus.services
                    .filter((s) => s.status === 'healthy')
                    .map((s) => s.name),
                unhealthy_services: systemStatus.services
                    .filter((s) => s.status !== 'healthy')
                    .map((s) => s.name),
                uptime: systemStatus.uptime,
                lastIncident: systemStatus.lastIncident
            },
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('[Cortex API] ❌ Status check failed:', error.message);
        res.status(503).json({
            brain: {
                connected: false,
                nodes: 0,
                provider: 'UNKNOWN',
                error: error.message
            },
            immune_system: {
                status: 'CRITICAL',
                active_services: [],
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/cortex/pulse
 * Lightweight heartbeat endpoint for quick connectivity checks
 */
router.get('/pulse', async (req, res) => {
    const isHealthy = neo4jAdapter.isHealthy();
    res.status(isHealthy ? 200 : 503).json({
        alive: true,
        cortex_online: isHealthy,
        timestamp: Date.now()
    });
});
export default router;
