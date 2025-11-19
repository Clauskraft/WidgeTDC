import { createServer } from 'http';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { createApp, createMcpWebSocketServer } from './app.js';
import sysRouter from './routes/sys.js';
import { securityRouter } from './services/security/securityController.js';
import { agentRouter } from './services/agent/agentController.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

// Additional routes not in createApp
app.use('/api/security', securityRouter);
app.use('/api/agent', agentRouter);
app.use('/api/sys', sysRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    registeredTools: mcpRegistry.getRegisteredTools(),
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server for MCP
createMcpWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`MCP WebSocket available at ws://localhost:${PORT}/mcp/ws`);
  console.log(`Registered MCP tools:`, mcpRegistry.getRegisteredTools());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
