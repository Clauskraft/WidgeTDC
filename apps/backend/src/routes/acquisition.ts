/**
 * Knowledge Acquisition REST API
 * Endpoints for The Omni-Harvester
 */

import { Router } from 'express';
import { knowledgeAcquisition } from '../services/KnowledgeAcquisitionService.js';
import { hyperLog } from '../services/HyperLog.js';

const router = Router();

/**
 * POST /acquire
 * Acquire knowledge from a source (URL, text, or file)
 */
router.post('/acquire', async (req, res) => {
    try {
        const { type, content, metadata } = req.body;

        if (!type || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type and content'
            });
        }

        const result = await knowledgeAcquisition.acquire({
            type,
            content,
            metadata
        });

        res.json({
            success: result.success,
            data: result
        });
    } catch (error: any) {
        hyperLog.logEvent('API_ERROR', { endpoint: '/acquire', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /acquire/batch
 * Batch acquire from multiple sources
 */
router.post('/acquire/batch', async (req, res) => {
    try {
        const { sources } = req.body;

        if (!sources || !Array.isArray(sources)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid sources array'
            });
        }

        const results = await knowledgeAcquisition.batchAcquire(sources);

        res.json({
            success: true,
            data: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error: any) {
        hyperLog.logEvent('API_ERROR', { endpoint: '/acquire/batch', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /search
 * Semantic search across acquired knowledge
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Missing query parameter: q'
            });
        }

        const results = await knowledgeAcquisition.semanticSearch(
            q as string, 
            parseInt(limit as string) || 10
        );

        res.json({
            success: true,
            query: q,
            count: results.length,
            results
        });
    } catch (error: any) {
        hyperLog.logEvent('API_ERROR', { endpoint: '/search', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /stats
 * Get vector store statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await knowledgeAcquisition.getVectorStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /targets
 * List knowledge acquisition targets
 */
router.get('/targets', async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const targetsPath = path.join(__dirname, '../../../docs/KNOWLEDGE_TARGETS.json');
        
        const content = await fs.readFile(targetsPath, 'utf-8');
        const targets = JSON.parse(content);

        res.json({
            success: true,
            data: targets
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /acquire/targets
 * Acquire knowledge from KNOWLEDGE_TARGETS.json
 * Body: { targetIds?: string[] } - Optional array of specific target IDs to acquire
 * If no targetIds provided, acquires ALL targets (use with caution!)
 */
router.post('/acquire/targets', async (req, res) => {
    try {
        const { targetIds } = req.body;

        hyperLog.logEvent('API_ACQUIRE_TARGETS', { 
            targetIds: targetIds || 'ALL',
            timestamp: new Date().toISOString()
        });

        const results = await knowledgeAcquisition.acquireFromTargets(targetIds);

        res.json({
            success: true,
            data: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error: any) {
        hyperLog.logEvent('API_ERROR', { endpoint: '/acquire/targets', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /acquire/target/:id
 * Acquire a single target by ID
 */
router.post('/acquire/target/:id', async (req, res) => {
    try {
        const { id } = req.params;

        hyperLog.logEvent('API_ACQUIRE_SINGLE_TARGET', { 
            targetId: id,
            timestamp: new Date().toISOString()
        });

        const result = await knowledgeAcquisition.acquireSingleTarget(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: `Target ${id} not found or failed to acquire`
            });
        }

        res.json({
            success: result.success,
            targetId: id,
            data: result
        });
    } catch (error: any) {
        hyperLog.logEvent('API_ERROR', { endpoint: `/acquire/target/${req.params.id}`, error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
