/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    NEURAL CHAT CONTROLLER                                 ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  REST API endpoints for Neural Chat                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { neuralChatService } from './ChatService.js';
import { AgentId, ChannelId, MessageType, MessagePriority } from './types.js';

export const neuralChatRouter = Router();

// Initialize service on first request
let initialized = false;
const ensureInitialized = async () => {
    if (!initialized) {
        await neuralChatService.initialize();
        initialized = true;
    }
};

/**
 * POST /api/neural-chat/send
 * Send a message to a channel
 */
neuralChatRouter.post('/send', async (req: Request, res: Response) => {
    try {
        await ensureInitialized();
        
        const { channel, from, body, type, priority, subject, to, replyTo, mentions } = req.body;
        
        if (!channel || !from || !body) {
            return res.status(400).json({ 
                error: 'Missing required fields: channel, from, body' 
            });
        }

        const message = await neuralChatService.sendMessage({
            channel: channel as ChannelId,
            from: from as AgentId,
            body,
            type: type as MessageType,
            priority: priority as MessagePriority,
            subject,
            to: to as AgentId | AgentId[],
            replyTo,
            mentions: mentions as AgentId[]
        });
        
        res.json({ success: true, message });
    } catch (error: any) {
        console.error('Neural Chat send error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/neural-chat/messages
 * Get messages from a channel or for an agent
 */
neuralChatRouter.get('/messages', async (req: Request, res: Response) => {
    try {
        await ensureInitialized();
        
        const { channel, since, limit, agent } = req.query;
        
        const messages = await neuralChatService.getMessages({
            channel: channel as ChannelId,
            since: since as string,
            limit: limit ? parseInt(limit as string) : undefined,
            agent: agent as AgentId
        });
        
        res.json({ messages, count: messages.length });
    } catch (error: any) {
        console.error('Neural Chat fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/neural-chat/channels
 * List all channels
 */
neuralChatRouter.get('/channels', async (_req: Request, res: Response) => {
    try {
        await ensureInitialized();
        const channels = neuralChatService.getChannels();
        res.json({ channels });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/neural-chat/health
 * Health check for Neural Chat
 */
neuralChatRouter.get('/health', async (_req: Request, res: Response) => {
    res.json({ 
        status: 'healthy',
        service: 'neural-chat',
        timestamp: new Date().toISOString()
    });
});


// ═══════════════════════════════════════════════════════════════════
// CAPABILITY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

import { capabilityBroker, AGENT_CAPABILITIES } from './CapabilityBroker.js';

/**
 * GET /api/neural-chat/capabilities
 * List all agent capabilities
 */
neuralChatRouter.get('/capabilities', async (req: Request, res: Response) => {
    try {
        const agent = req.query.agent as AgentId;
        
        if (agent) {
            const capabilities = capabilityBroker.getAgentCapabilities(agent);
            res.json({ agent, capabilities });
        } else {
            res.json({ capabilities: AGENT_CAPABILITIES });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/neural-chat/capabilities/request
 * Request a capability from another agent
 */
neuralChatRouter.post('/capabilities/request', async (req: Request, res: Response) => {
    try {
        const { fromAgent, toAgent, capability, params, priority, deadline } = req.body;
        
        if (!fromAgent || !toAgent || !capability) {
            return res.status(400).json({ 
                error: 'Missing required fields: fromAgent, toAgent, capability' 
            });
        }
        
        const request = await capabilityBroker.requestCapability({
            fromAgent,
            toAgent,
            capability,
            params: params || {},
            priority,
            deadline
        });
        
        res.json({ success: true, request });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/neural-chat/capabilities/respond
 * Respond to a capability request
 */
neuralChatRouter.post('/capabilities/respond', async (req: Request, res: Response) => {
    try {
        const { requestId, success, result, error, respondingAgent } = req.body;
        
        if (!requestId || success === undefined || !respondingAgent) {
            return res.status(400).json({ 
                error: 'Missing required fields: requestId, success, respondingAgent' 
            });
        }
        
        const response = await capabilityBroker.respondToCapability({
            requestId,
            success,
            result,
            error,
            respondingAgent
        });
        
        res.json({ success: true, response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/neural-chat/capabilities/pending
 * Get pending capability requests for an agent
 */
neuralChatRouter.get('/capabilities/pending', async (req: Request, res: Response) => {
    try {
        const agent = req.query.agent as AgentId;
        
        if (!agent) {
            return res.status(400).json({ error: 'Missing agent parameter' });
        }
        
        const requests = await capabilityBroker.getPendingRequests(agent);
        res.json({ agent, pending: requests, count: requests.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/neural-chat/capabilities/route
 * Smart-route a task to the best agent
 */
neuralChatRouter.post('/capabilities/route', async (req: Request, res: Response) => {
    try {
        const { task, context, fromAgent } = req.body;
        
        if (!task || !fromAgent) {
            return res.status(400).json({ 
                error: 'Missing required fields: task, fromAgent' 
            });
        }
        
        const result = await capabilityBroker.smartRoute({ task, context, fromAgent });
        
        if (result) {
            res.json({ 
                success: true, 
                recommendation: result,
                message: `Recommended: ${result.agent} for ${result.capability.name} (confidence: ${(result.confidence * 100).toFixed(0)}%)`
            });
        } else {
            res.json({ 
                success: false, 
                message: 'No suitable agent found for this task' 
            });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
