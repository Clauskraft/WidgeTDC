import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MCPMessage } from '@widget-tdc/mcp-types';
import { mcpRegistry } from './mcpRegistry.js';

export const mcpRouter = Router();

// Route MCP messages
mcpRouter.post('/route', async (req, res) => {
  try {
    const message: MCPMessage = req.body;

    // Validate message
    if (!message.tool || !message.payload) {
      return res.status(400).json({
        error: 'Invalid MCP message format. Required: tool, payload',
      });
    }

    // Ensure message has ID and timestamp
    if (!message.id) {
      message.id = uuidv4();
    }
    if (!message.createdAt) {
      message.createdAt = new Date().toISOString();
    }

    // Route the message
    const result = await mcpRegistry.route(message);

    res.json({
      success: true,
      messageId: message.id,
      result,
    });
  } catch (error: any) {
    console.error('MCP routing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
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
  const uri = req.query.uri as string;

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
    } catch (e) {
      // Not JSON, return as is
    }
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});
