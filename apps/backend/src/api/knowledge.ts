/**
 * Knowledge API - Endpoints for KnowledgeCompiler
 * 
 * Endpoints:
 * - GET /api/knowledge/summary - Full system state summary
 * - GET /api/knowledge/health - Quick health check
 * - GET /api/knowledge/insights - AI-generated insights only
 */

import { Router, Request, Response } from 'express';
import { knowledgeCompiler } from '../services/Knowledge/KnowledgeCompiler.js';

const router = Router();

/**
 * GET /api/knowledge/summary
 * Returns full system state summary
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await knowledgeCompiler.compile();
    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('[Knowledge] Summary compilation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compile summary'
    });
  }
});

/**
 * GET /api/knowledge/health
 * Returns quick health status
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await knowledgeCompiler.quickHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});

/**
 * GET /api/knowledge/insights
 * Returns AI-generated insights only
 */
router.get('/insights', async (_req: Request, res: Response) => {
  try {
    const summary = await knowledgeCompiler.compile();
    res.json({
      success: true,
      data: {
        overallHealth: summary.health.overall,
        insights: summary.insights,
        timestamp: summary.timestamp
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insights'
    });
  }
});

export default router;
