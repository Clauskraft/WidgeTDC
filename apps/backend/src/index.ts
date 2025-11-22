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
import {
  cmaContextHandler,
  cmaIngestHandler,
  cmaMemoryStoreHandler,
  cmaMemoryRetrieveHandler,
  sragQueryHandler,
  sragGovernanceCheckHandler,
  evolutionReportHandler,
  evolutionGetPromptHandler,
  evolutionAnalyzePromptsHandler,
  palEventHandler,
  palBoardActionHandler,
  palOptimizeWorkflowHandler,
  palAnalyzeSentimentHandler,
  notesListHandler,
  notesCreateHandler,
  notesUpdateHandler,
  notesDeleteHandler,
  notesGetHandler,
} from './mcp/toolHandlers.js';
import { securityRouter } from './services/security/securityController.js';
// import { agentRouter } from './services/agent/agentController.js';
// import { scRouter } from './services/sc/scController.js';
// import networkRouter from './services/network/networkController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Validation Middleware (FIX #2: Input validation)
import {
  inputValidationMiddleware,
  csrfProtectionMiddleware,
  rateLimitingMiddleware
} from './middleware/inputValidation.js';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // FIX #1: Limit payload size
app.use(rateLimitingMiddleware); // Prevent DOS attacks
app.use(inputValidationMiddleware); // Sanitize all inputs
app.use(csrfProtectionMiddleware); // CSRF protection

// Initialize database
getDatabase();

// Register MCP tools
mcpRegistry.registerTool('cma.context', cmaContextHandler);
mcpRegistry.registerTool('cma.ingest', cmaIngestHandler);
mcpRegistry.registerTool('cma.memory.store', cmaMemoryStoreHandler);
mcpRegistry.registerTool('cma.memory.retrieve', cmaMemoryRetrieveHandler);
mcpRegistry.registerTool('srag.query', sragQueryHandler);
mcpRegistry.registerTool('srag.governance-check', sragGovernanceCheckHandler);
mcpRegistry.registerTool('evolution.report-run', evolutionReportHandler);
mcpRegistry.registerTool('evolution.get-prompt', evolutionGetPromptHandler);
mcpRegistry.registerTool('evolution.analyze-prompts', evolutionAnalyzePromptsHandler);
mcpRegistry.registerTool('pal.event', palEventHandler);
mcpRegistry.registerTool('pal.board-action', palBoardActionHandler);
mcpRegistry.registerTool('pal.optimize-workflow', palOptimizeWorkflowHandler);
mcpRegistry.registerTool('pal.analyze-sentiment', palAnalyzeSentimentHandler);
mcpRegistry.registerTool('notes.list', notesListHandler);
mcpRegistry.registerTool('notes.create', notesCreateHandler);
mcpRegistry.registerTool('notes.update', notesUpdateHandler);
mcpRegistry.registerTool('notes.delete', notesDeleteHandler);
mcpRegistry.registerTool('notes.get', notesGetHandler);

// Initialize Agent Orchestrator
import { AgentOrchestratorServer } from './mcp/servers/AgentOrchestratorServer.js';
const orchestrator = new AgentOrchestratorServer();
mcpRegistry.registerServer(orchestrator);
console.log('🤖 Agent Orchestrator initialized');

// Routes
app.use('/api/mcp', mcpRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/srag', sragRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/api/pal', palRouter);
app.use('/api/security', securityRouter);
// app.use('/api/agent', agentRouter);
// app.use('/api/commands/sc', scRouter);
// app.use('/api/network', networkRouter);

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
