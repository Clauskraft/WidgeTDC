/**
 * Knowledge Routes - REST API for KnowledgeCompiler
 * 
 * Endpoints:
 * - GET /api/knowledge/summary - Get system state summary
 * - GET /api/knowledge/insights - Get current insights
 * - GET /api/knowledge/health - Get health status
 * - POST /api/knowledge/compile - Force recompilation
 */

import express from 'express';
import { knowledgeCompiler } from '../services/Knowledge/index.js';

const router = express.Router();

/**
 * GET /api/knowledge/summary
 * Get the current system state summary
 */
router.get('/summary', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const summary = await knowledgeCompiler.getSystemSummary(forceRefresh);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('[Knowledge] Error getting summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system summary'
        });
    }
});

/**
 * GET /api/knowledge/insights
 * Get current insights only
 */
router.get('/insights', async (req, res) => {
    try {
        const summary = await knowledgeCompiler.getSystemSummary();
        res.json({
            success: true,
            data: {
                insights: summary.insights,
                recommendations: summary.recommendations,
                timestamp: summary.timestamp
            }
        });
    } catch (error) {
        console.error('[Knowledge] Error getting insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get insights'
        });
    }
});

/**
 * GET /api/knowledge/health
 * Get health status only
 */
router.get('/health', async (req, res) => {
    try {
        const summary = await knowledgeCompiler.getSystemSummary();
        res.json({
            success: true,
            data: summary.health
        });
    } catch (error) {
        console.error('[Knowledge] Error getting health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health status'
        });
    }
});

/**
 * GET /api/knowledge/graph-stats
 * Get Neo4j graph statistics
 */
router.get('/graph-stats', async (req, res) => {
    try {
        const summary = await knowledgeCompiler.getSystemSummary();
        res.json({
            success: true,
            data: summary.graphStats
        });
    } catch (error) {
        console.error('[Knowledge] Error getting graph stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get graph statistics'
        });
    }
});

/**
 * POST /api/knowledge/compile
 * Force a full recompilation
 */
router.post('/compile', async (req, res) => {
    try {
        const summary = await knowledgeCompiler.compile();
        res.json({
            success: true,
            message: 'Compilation complete',
            data: summary
        });
    } catch (error) {
        console.error('[Knowledge] Error compiling:', error);
        res.status(500).json({
            success: false,
            error: 'Compilation failed'
        });
    }
});

export default router;
