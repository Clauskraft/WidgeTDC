// HansPedder Agent API Routes
// Endpoints for controlling and monitoring the autonomous test agent

import { Router, Request, Response } from 'express';
import { hansPedderAgent } from '../services/agent/HansPedderAgentController.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/hanspedder/status - Get current agent status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = hansPedderAgent.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// POST /api/hanspedder/start - Start the agent
router.post('/start', (req: Request, res: Response) => {
  try {
    hansPedderAgent.start();
    logger.info('🤖 HansPedder started via API');
    res.json({
      success: true,
      message: 'HansPedder agent started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// POST /api/hanspedder/stop - Stop the agent
router.post('/stop', (req: Request, res: Response) => {
  try {
    hansPedderAgent.stop();
    logger.info('🛑 HansPedder stopped via API');
    res.json({
      success: true,
      message: 'HansPedder agent stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
