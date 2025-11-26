import { Router } from 'express';
import { neo4jService } from '../database/Neo4jService';
import { getDatabase } from '../database/index';

const router = Router();

/**
 * Overall system health check
 */
router.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: 'unknown',
            neo4j: 'unknown',
            redis: 'unknown',
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };

    try {
        // Check PostgreSQL/SQLite
        const db = getDatabase();
        db.prepare('SELECT 1').get();
        health.services.database = 'healthy';
    } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
    }

    try {
        // Check Neo4j
        await neo4jService.connect();
        const neo4jHealthy = await neo4jService.healthCheck();
        health.services.neo4j = neo4jHealthy ? 'healthy' : 'unhealthy';
        await neo4jService.disconnect();

        if (!neo4jHealthy) {
            health.status = 'degraded';
        }
    } catch (error) {
        health.services.neo4j = 'unhealthy';
        health.status = 'degraded';
    }

    // Check Redis (if configured)
    try {
        if (process.env.REDIS_URL) {
            // TODO: Add Redis health check when Redis client is available
            health.services.redis = 'not_configured';
        } else {
            health.services.redis = 'not_configured';
        }
    } catch (error) {
        health.services.redis = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * Database-specific health check
 */
router.get('/health/database', async (req, res) => {
    try {
        const db = getDatabase();
        const result = db.prepare('SELECT 1 as test').get() as any;

        const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all() as any[];

        res.json({
            status: 'healthy',
            type: 'SQLite',
            tables: tables.length,
            test: result.test === 1,
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: String(error),
        });
    }
});

/**
 * Neo4j-specific health check
 */
router.get('/health/neo4j', async (req, res) => {
    try {
        await neo4jService.connect();
        const healthy = await neo4jService.healthCheck();

        if (healthy) {
            const stats = await neo4jService.runQuery('MATCH (n) RETURN count(n) as nodeCount');
            await neo4jService.disconnect();

            res.json({
                status: 'healthy',
                connected: true,
                nodeCount: stats[0]?.nodeCount || 0,
            });
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            connected: false,
            error: String(error),
        });
    }
});

/**
 * Readiness check (for Kubernetes)
 */
router.get('/ready', async (req, res) => {
    try {
        const db = getDatabase();
        db.prepare('SELECT 1').get();

        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'not_ready',
            error: String(error),
        });
    }
});

/**
 * Liveness check (for Kubernetes)
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;
