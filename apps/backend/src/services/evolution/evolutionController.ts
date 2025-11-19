import { Router } from 'express';
import { EvolutionRepository } from './evolutionRepository.js';
import { AgentRunReport } from '@widget-tdc/mcp-types';

export const evolutionRouter = Router();
const evolutionRepo = new EvolutionRepository();

// Report an agent run
evolutionRouter.post('/report-run', (req, res) => {
  try {
    const report: AgentRunReport = req.body;

    if (!report.agentId || !report.promptVersion || !report.kpiName) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, promptVersion, kpiName',
      });
    }

    const runId = evolutionRepo.recordRun(report);

    // Check if refinement is needed
    const avgDelta = evolutionRepo.getAverageKpiDelta(report.agentId, 10);
    const threshold = 0.0; // If average KPI delta is negative, consider refinement

    const needsRefinement = avgDelta < threshold;

    res.json({
      success: true,
      runId,
      evaluation: {
        agentId: report.agentId,
        needsRefinement,
        averageKpiDelta: avgDelta,
        reason: needsRefinement
          ? 'Average KPI delta is below threshold, consider prompt refinement'
          : 'Performance is acceptable',
      },
    });
  } catch (error: any) {
    console.error('Evolution report error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get latest prompt for an agent
evolutionRouter.get('/prompt/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const prompt = evolutionRepo.getLatestPrompt(agentId);

    if (!prompt) {
      return res.status(404).json({
        error: 'No prompt found for agent',
      });
    }

    res.json({
      success: true,
      prompt: {
        agentId: prompt.agent_id,
        version: prompt.version,
        promptText: prompt.prompt_text,
        createdAt: prompt.created_at,
        createdBy: prompt.created_by,
      },
    });
  } catch (error: any) {
    console.error('Get prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all prompts for an agent
evolutionRouter.get('/prompts/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const prompts = evolutionRepo.getAllPrompts(agentId);

    res.json({
      success: true,
      prompts: prompts.map(p => ({
        agentId: p.agent_id,
        version: p.version,
        promptText: p.prompt_text,
        createdAt: p.created_at,
        createdBy: p.created_by,
      })),
      count: prompts.length,
    });
  } catch (error: any) {
    console.error('Get prompts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create a new prompt version
evolutionRouter.post('/prompt', (req, res) => {
  try {
    const { agentId, promptText, createdBy } = req.body;

    if (!agentId || !promptText) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, promptText',
      });
    }

    const promptId = evolutionRepo.createPrompt(agentId, promptText, createdBy);
    const newPrompt = evolutionRepo.getLatestPrompt(agentId);

    res.json({
      success: true,
      promptId,
      version: newPrompt.version,
    });
  } catch (error: any) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get recent runs for an agent
evolutionRouter.get('/runs/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const runs = evolutionRepo.getRecentRuns(agentId, limit);

    res.json({
      success: true,
      runs,
      count: runs.length,
    });
  } catch (error: any) {
    console.error('Get runs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
