import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './database/index.js';
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
import { AgentOrchestratorServer } from './mcp/servers/AgentOrchestratorServer.js';

// Security & Validation Middleware
import {
  inputValidationMiddleware,
  csrfProtectionMiddleware,
  rateLimitingMiddleware
} from './middleware/inputValidation.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimitingMiddleware);
app.use(inputValidationMiddleware);
app.use(csrfProtectionMiddleware);

// CRITICAL: Start server only after database is initialized
async function startServer() {
  try {
    // Step 1: Initialize database (MUST be first!)
    await initializeDatabase();
    console.log('🗄️  Database initialized');

    // Step 2: Register MCP tools (repositories can now safely use getDatabase())
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

    // Step 3: Initialize Agent Orchestrator
    const orchestrator = new AgentOrchestratorServer();
    mcpRegistry.registerServer(orchestrator);
    console.log('🤖 Agent Orchestrator initialized');

    // Step 3.5: Initialize Autonomous Intelligence System
    const { initCognitiveMemory, getCognitiveMemory } = await import('./mcp/memory/CognitiveMemory.js');
    const { getSourceRegistry } = await import('./mcp/SourceRegistry.js');
    const { initAutonomousAgent, startAutonomousLearning } = await import('./mcp/autonomousRouter.js');
    const { autonomousRouter } = await import('./mcp/autonomousRouter.js');
    const { getDatabase } = await import('./database/index.js');
    const { existsSync } = await import('fs');
    const { readFileSync } = await import('fs');
    const yaml = (await import('js-yaml')).default;

    const db = getDatabase();
    const memory = initCognitiveMemory(db);
    console.log('🧠 Cognitive Memory initialized');

    const registry = getSourceRegistry();

    // Register agents-yaml data source
    registry.registerSource({
      name: 'agents-yaml',
      type: 'file',
      capabilities: ['agents.*', 'agents.list', 'agents.get', 'agents.trigger'],
      isHealthy: async () => existsSync('agents/registry.yml'),
      estimatedLatency: 50,
      costPerQuery: 0,
      query: async (operation: string, params: any) => {
        const content = readFileSync('agents/registry.yml', 'utf-8');
        const data = yaml.load(content) as any;

        if (operation === 'list') {
          return data.agents || [];
        } else if (operation === 'get' && params?.id) {
          return data.agents?.find((a: any) => a.id === params.id);
        }

        return data.agents || [];
      }
    });

    // Step 3.6: Initialize MCP → Autonomous Integration
    const { initializeAutonomousSources } = await import('./mcp/autonomous/MCPIntegration.js');
    await initializeAutonomousSources();
    console.log('🔗 MCP tools registered as autonomous sources');

    const agent = initAutonomousAgent();
    console.log('🤖 Autonomous Agent initialized');

    // Start learning loop (every 5 minutes)
    startAutonomousLearning(agent, 300000);
    console.log('🔄 Autonomous learning started (5min intervals)');

    // Step 4: Setup routes
    app.use('/api/mcp', mcpRouter);
    app.use('/api/mcp/autonomous', autonomousRouter);
    app.use('/api/memory', memoryRouter);
    app.use('/api/srag', sragRouter);
    app.use('/api/evolution', evolutionRouter);
    app.use('/api/pal', palRouter);
    app.use('/api/security', securityRouter);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        registeredTools: mcpRegistry.getRegisteredTools(),
      });
    });

    // Step 5: Create HTTP server
    const server = createServer(app);

    // Step 6: Initialize WebSocket server for MCP
    const wsServer = new MCPWebSocketServer(server);

    // Step 6.5: Wire WebSocket server to autonomous router for real-time events
    const { setWebSocketServer } = await import('./mcp/autonomousRouter.js');
    setWebSocketServer(wsServer);

    // Step 7: Wire up orchestrator broadcasting
    orchestrator.setBroadcaster((message) => {
      wsServer.sendToAll(message);
    });

    // Step 8: Start server
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

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
