import { createServer } from 'http';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { createApp, createMcpWebSocketServer } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

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
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 MCP WebSocket available at ws://localhost:${PORT}/mcp/ws`);
  console.log(`🔧 Registered MCP tools:`, mcpRegistry.getRegisteredTools());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
