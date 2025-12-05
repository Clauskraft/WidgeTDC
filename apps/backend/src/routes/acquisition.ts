/**
 * Knowledge Acquisition REST API
 * Endpoints for The Omni-Harvester
 */

import { Router } from 'express';
import { knowledgeAcquisition } from '../services/KnowledgeAcquisitionService.js';
import { hyperLog } from '../services/HyperLog.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS_PATH = path.join(__dirname, '../../../docs/KNOWLEDGE_TARGETS.json');

const validateRequiredFields = (fields: Record<string, any>, required: string[]): string | null => {
    for (const field of required) {
        if (!fields[field]) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
};

const handleError = (res: any, error: any, endpoint: string, logError: boolean = true) => {
    if (logError) {
        hyperLog.logEvent('API_ERROR', { endpoint, error: error.message });
    }
    res.status(500).json({
        success: false,
        error: error.message
    });
};

/**
 * POST /acquire
 * Acquire knowledge from a source (URL, text, or file)
 */
router.post('/acquire', async (req, res) => {
    try {
        const { type, content, metadata } = req.body;
        const validationError = validateRequiredFields({ type, content }, ['type', 'content']);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const result = await knowledgeAcquisition.acquire({ type, content, metadata });
        res.json({ success: result.success, data: result });
    } catch (error: any) {
        handleError(res, error, '/acquire');
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
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.json({
            success: true,
            data: { total: results.length, successful, failed, results }
        });
    } catch (error: any) {
        handleError(res, error, '/acquire/batch');
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

        const searchLimit = parseInt(limit as string) || 10;
        const results = await knowledgeAcquisition.semanticSearch(q as string, searchLimit);

        res.json({
            success: true,
            query: q,
            count: results.length,
            results
        });
    } catch (error: any) {
        handleError(res, error, '/search');
    }
});

/**
 * GET /stats
 * Get vector store statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await knowledgeAcquisition.getVectorStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        handleError(res, error, '/stats', false);
    }
});

/**
 * GET /targets
 * List knowledge acquisition targets
 */
router.get('/targets', async (req, res) => {
    try {
        const content = await fs.readFile(TARGETS_PATH, 'utf-8');
        const targets = JSON.parse(content);
        res.json({ success: true, data: targets });
    } catch (error: any) {
        handleError(res, error, '/targets', false);
    }
});

export default router;