/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    PROTOTYPE MCP HANDLERS                                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Handles MCP routing for PRD-to-Prototype generation                      ║
 * ║  Operations: generate, save, list, get, delete                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';
import { prototypeService } from '../services/PrototypeService.js';
import { eventBus } from './EventBus.js';

export const prototypeRouter = Router();

/**
 * Generate prototype from PRD content
 * POST /api/mcp/prototype/generate
 */
prototypeRouter.post('/generate', async (req, res) => {
  try {
    const { prdContent, options } = req.body;

    if (!prdContent) {
      return res.status(400).json({
        success: false,
        error: 'prdContent is required'
      });
    }

    console.log('🚀 Generating prototype with options:', options);

    const result = await prototypeService.generate(prdContent, options);

    res.json({
      success: true,
      data: result,
      meta: {
        source: 'prototype-service',
        latency: 0, // Will be calculated by client
        cached: false
      }
    });
  } catch (error: any) {
    console.error('❌ Prototype generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save prototype to database
 * POST /api/mcp/prototype/save
 */
prototypeRouter.post('/save', async (req, res) => {
  try {
    const { name, htmlContent, prdId } = req.body;

    if (!name || !htmlContent) {
      return res.status(400).json({
        success: false,
        error: 'name and htmlContent are required'
      });
    }

    const result = await prototypeService.save(name, htmlContent, prdId);

    eventBus.emit('prototype.saved', { id: result.id, name });

    res.json({
      success: true,
      data: result,
      meta: { source: 'prisma' }
    });
  } catch (error: any) {
    console.error('❌ Prototype save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all prototypes
 * GET /api/mcp/prototype/list
 */
prototypeRouter.get('/list', async (_req, res) => {
  try {
    const prototypes = await prototypeService.list();

    res.json({
      success: true,
      data: { prototypes },
      meta: { source: 'prisma', count: prototypes.length }
    });
  } catch (error: any) {
    console.error('❌ Prototype list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get prototype by ID
 * GET /api/mcp/prototype/:id
 */
prototypeRouter.get('/:id', async (req, res) => {
  try {
    const prototype = await prototypeService.getById(req.params.id);

    if (!prototype) {
      return res.status(404).json({
        success: false,
        error: 'Prototype not found'
      });
    }

    res.json({
      success: true,
      data: prototype,
      meta: { source: 'prisma' }
    });
  } catch (error: any) {
    console.error('❌ Prototype get error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete prototype
 * DELETE /api/mcp/prototype/:id
 */
prototypeRouter.delete('/:id', async (req, res) => {
  try {
    const success = await prototypeService.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Prototype not found or already deleted'
      });
    }

    eventBus.emit('prototype.deleted', { id: req.params.id });

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error: any) {
    console.error('❌ Prototype delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default prototypeRouter;
