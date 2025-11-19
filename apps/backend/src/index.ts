import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { getDatabase } from './database/index.js';
import { mcpRouter } from './mcp/mcpRouter.js';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { MCPWebSocketServer } from './mcp/mcpWebsocketServer.js';
import { memoryRouter } from './services/memory/memoryController.js';
import { sragRouter } from './services/srag/sragController.js';
import { evolutionRouter } from './services/evolution/evolutionController.js';
import { palRouter } from './services/pal/palController.js';
import sysRouter from './routes/sys.js';
import {
  cmaContextHandler,
  cmaIngestHandler,
  sragQueryHandler,
  evolutionReportHandler,
  evolutionGetPromptHandler,
  palEventHandler,
  palBoardActionHandler,
} from './mcp/toolHandlers.js';

const app = express();
const PORT = 3001; // Fixed port to avoid conflicts with exec-daemon

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
getDatabase();

// Register MCP tools
mcpRegistry.registerTool('cma.context', cmaContextHandler);
mcpRegistry.registerTool('cma.ingest', cmaIngestHandler);
mcpRegistry.registerTool('srag.query', sragQueryHandler);
mcpRegistry.registerTool('evolution.report-run', evolutionReportHandler);
mcpRegistry.registerTool('evolution.get-prompt', evolutionGetPromptHandler);
mcpRegistry.registerTool('pal.event', palEventHandler);
mcpRegistry.registerTool('pal.board-action', palBoardActionHandler);

// Routes
app.use('/api/mcp', mcpRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/srag', sragRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/api/pal', palRouter);
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
new MCPWebSocketServer(server);

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
