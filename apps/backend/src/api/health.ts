import { Router } from 'express';
import { neo4jService } from '../database/Neo4jService';
import { getDatabase } from '../database/index';

const router = Router();

/**
 * Overall system health check
 */
router.get('/health', async (req, res) => {
    const health = {
        status: 'healthy' as 'healthy' | 'degraded',
        timestamp: new Date().toISOString(),
        services: {
            database: 'unknown' as 'unknown' | 'healthy' | 'unhealthy',
            neo4j: 'unknown' as 'unknown' | 'healthy' | 'unhealthy',
            redis: 'unknown' as 'unknown' | 'configured_but_client_unavailable' | 'not_configured',
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };

    try {
        const db = getDatabase();
        db.prepare('SELECT 1').get();
        health.services.database = 'healthy';
    } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
    }

    try {
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

    health.services.redis = process.env.REDIS_URL
        ? 'configured_but_client_unavailable'
        : 'not_configured';

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * Database-specific health check
 */
router.get('/health/database', async (req, res) => {
    try {
        const db = getDatabase();
        const result = db.prepare('SELECT 1 as test').get() as { test: number };
        const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];

        res.json({
            status: 'healthy',
            type: 'SQLite',
            tables: tables.length,
            test: result.test === 1,
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : String(error),
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

        if (!healthy) {
            throw new Error('Health check failed');
        }

        const stats = await neo4jService.runQuery('MATCH (n) RETURN count(n) as nodeCount');
        await neo4jService.disconnect();

        res.json({
            status: 'healthy',
            connected: true,
            nodeCount: stats[0]?.nodeCount || 0,
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            connected: false,
            error: error instanceof Error ? error.message : String(error),
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
            error: error instanceof Error ? error.message : String(error),
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