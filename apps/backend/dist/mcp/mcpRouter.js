import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mcpRegistry } from './mcpRegistry.js';
import { unifiedMemorySystem } from './cognitive/UnifiedMemorySystem.js';
import { eventBus } from './EventBus.js';
export const mcpRouter = Router();
// Route MCP messages
mcpRouter.post('/route', async (req, res) => {
    const startTime = Date.now();
    let success = false;
    try {
        console.log('📨 MCP Router received request:', JSON.stringify(req.body));
        const message = req.body;
        // Context for memory enrichment
        const ctx = {
            userId: req.user?.id ?? 'anonymous',
            orgId: req.user?.orgId ?? 'default',
            timestamp: new Date()
        };
        // Enrich message with memory context
        const enrichedMessage = await unifiedMemorySystem.enrichMCPRequest(message, ctx);
        // Ensure ID/timestamp
        if (!enrichedMessage.id)
            enrichedMessage.id = uuidv4();
        if (!enrichedMessage.createdAt)
            enrichedMessage.createdAt = new Date().toISOString();
        // Route the enriched message
        const result = await mcpRegistry.route(enrichedMessage);
        // Persist result in working memory for future context
        await unifiedMemorySystem.updateWorkingMemory(ctx, result);
        success = true;
        const duration = Date.now() - startTime;
        // Emit event for TaskRecorder observation
        eventBus.emit('mcp.tool.executed', {
            tool: enrichedMessage.tool,
            payload: enrichedMessage.payload,
            userId: ctx.userId,
            orgId: ctx.orgId,
            success: true,
            result,
            duration
        });
        res.json({
            success: true,
            messageId: enrichedMessage.id,
            result,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        // Emit event for TaskRecorder observation (failure)
        eventBus.emit('mcp.tool.executed', {
            tool: req.body?.tool || 'unknown',
            payload: req.body?.payload || {},
            userId: req.user?.id ?? 'anonymous',
            orgId: req.user?.orgId ?? 'default',
            success: false,
            error: error.message,
            duration
        });
        console.error('MCP routing error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});
// Get list of available tools
mcpRouter.get('/tools', (req, res) => {
    const tools = mcpRegistry.getRegisteredTools();
    res.json({
        tools,
        count: tools.length,
    });
});
// Get resource content
mcpRouter.get('/resources', async (req, res) => {
    const uri = req.query.uri;
    if (!uri) {
        return res.status(400).json({ error: 'Missing uri parameter' });
    }
    try {
        const content = await mcpRegistry.readResource(uri);
        // If content is a string (JSON), try to parse it to return proper JSON object
        try {
            if (typeof content === 'string') {
                const jsonContent = JSON.parse(content);
                return res.json({ success: true, data: jsonContent });
            }
        }
        catch (e) {
            // Not JSON, return as is
        }
        res.json({ success: true, content });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
