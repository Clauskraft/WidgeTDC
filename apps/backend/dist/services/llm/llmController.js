import { Router } from 'express';
import { getLlmService } from './llmService.js';
export const llmRouter = Router();
llmRouter.post('/completion', async (req, res) => {
    try {
        const { model, messages, temperature, maxTokens } = req.body;
        if (!model || !messages) {
            return res.status(400).json({ error: 'Missing model or messages' });
        }
        const llmService = getLlmService();
        const response = await llmService.complete({
            model,
            messages,
            temperature,
            maxTokens
        });
        res.json(response);
    }
    catch (error) {
        console.error('LLM Completion Error:', error);
        res.status(500).json({ error: error.message });
    }
});
