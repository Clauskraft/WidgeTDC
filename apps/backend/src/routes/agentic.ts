import { Router } from 'express';
import { getAgentsetAdapter } from '../services/agentic/AgentsetAdapter';

/**
 * /api/agentic routes – expose Agentset execution to the frontend.
 * Expected payload: { tool: string, payload: any }
 */
const router = Router();

router.post('/run', async (req, res) => {
    const { tool, payload } = req.body;
    if (!tool) {
        return res.status(400).json({ error: 'Missing tool name' });
    }
    try {
        const adapter = getAgentsetAdapter();
        const result = await adapter.execute(tool, payload);
        res.json({ result });
    } catch (err: any) {
        console.error('Agentic run error:', err);
        res.status(500).json({ error: err.message ?? 'Internal error' });
    }
});

export default router;
