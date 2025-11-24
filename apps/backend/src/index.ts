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
import { llmRouter } from './services/llm/llmController.js';

// Swagger/OpenAPI Documentation (if using Fastify in future)
// Note: Currently using Express, but Swagger can be added later
// import swaggerJsdoc from 'swagger-jsdoc';
// import swaggerUi from 'swagger-ui-express';
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

    // Step 1.5: Initialize Neo4j Graph Database
    try {
      const { getNeo4jGraphAdapter } = await import('./platform/graph/Neo4jGraphAdapter.js');
      const neo4jAdapter = getNeo4jGraphAdapter();
      await neo4jAdapter.initialize();
      console.log('🕸️  Neo4j Graph Database initialized');
    } catch (error) {
      console.warn('⚠️  Neo4j not available (optional):', error);
      console.log('   Continuing without Neo4j - using implicit graph patterns');
    }

    // Step 1.6: Initialize Transformers.js Embeddings
    try {
      const { getTransformersEmbeddings } = await import('./platform/embeddings/TransformersEmbeddings.js');
      const embeddings = getTransformersEmbeddings();
      await embeddings.initialize();
      console.log('🧠 Transformers.js Embeddings initialized');
    } catch (error) {
      console.warn('⚠️  Transformers.js not available (optional):', error);
      console.log('   Continuing without local embeddings');
    }

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

    // Project Memory tools
    const {
      projectMemoryLogEventHandler,
      projectMemoryGetEventsHandler,
      projectMemoryAddFeatureHandler,
      projectMemoryUpdateFeatureHandler,
      projectMemoryGetFeaturesHandler
    } = await import('./mcp/projectMemoryHandlers.js');

    mcpRegistry.registerTool('project.log_event', projectMemoryLogEventHandler);
    mcpRegistry.registerTool('project.get_events', projectMemoryGetEventsHandler);
    mcpRegistry.registerTool('project.add_feature', projectMemoryAddFeatureHandler);
    mcpRegistry.registerTool('project.update_feature', projectMemoryUpdateFeatureHandler);
    mcpRegistry.registerTool('project.get_features', projectMemoryGetFeaturesHandler);

    // Data Ingestion tools
    const {
      ingestionStartHandler,
      ingestionStatusHandler,
      ingestionConfigureHandler
    } = await import('./mcp/ingestionHandlers.js');

    mcpRegistry.registerTool('ingestion.start', ingestionStartHandler);
    mcpRegistry.registerTool('ingestion.status', ingestionStatusHandler);
    mcpRegistry.registerTool('ingestion.configure', ingestionConfigureHandler);

    // Autonomous Cognitive Tools
    const {
      autonomousGraphRAGHandler,
      autonomousStateGraphHandler,
      autonomousEvolutionHandler,
      autonomousAgentTeamHandler,
      autonomousAgentTeamCoordinateHandler
    } = await import('./mcp/toolHandlers.js');

    mcpRegistry.registerTool('autonomous.graphrag', autonomousGraphRAGHandler);
    mcpRegistry.registerTool('autonomous.stategraph', autonomousStateGraphHandler);
    mcpRegistry.registerTool('autonomous.evolve', autonomousEvolutionHandler);
    mcpRegistry.registerTool('autonomous.agentteam', autonomousAgentTeamHandler);
    mcpRegistry.registerTool('autonomous.agentteam.coordinate', autonomousAgentTeamCoordinateHandler);

    // Vidensarkiv (Knowledge Archive) Tools - Persistent vector database
    const {
      vidensarkivSearchHandler,
      vidensarkivAddHandler,
      vidensarkivBatchAddHandler,
      vidensarkivGetRelatedHandler,
      vidensarkivListHandler,
      vidensarkivStatsHandler
    } = await import('./mcp/toolHandlers.js');

    mcpRegistry.registerTool('vidensarkiv.search', vidensarkivSearchHandler);
    mcpRegistry.registerTool('vidensarkiv.add', vidensarkivAddHandler);
    mcpRegistry.registerTool('vidensarkiv.batch_add', vidensarkivBatchAddHandler);
    mcpRegistry.registerTool('vidensarkiv.get_related', vidensarkivGetRelatedHandler);
    mcpRegistry.registerTool('vidensarkiv.list', vidensarkivListHandler);
    mcpRegistry.registerTool('vidensarkiv.stats', vidensarkivStatsHandler);

    // TaskRecorder Tools - Observes tasks, learns patterns, suggests automation (requires approval)
    const {
      taskRecorderGetSuggestionsHandler,
      taskRecorderApproveHandler,
      taskRecorderRejectHandler,
      taskRecorderExecuteHandler,
      taskRecorderGetPatternsHandler
    } = await import('./mcp/toolHandlers.js');

    mcpRegistry.registerTool('taskrecorder.get_suggestions', taskRecorderGetSuggestionsHandler);
    mcpRegistry.registerTool('taskrecorder.approve', taskRecorderApproveHandler);
    mcpRegistry.registerTool('taskrecorder.reject', taskRecorderRejectHandler);
    mcpRegistry.registerTool('taskrecorder.execute', taskRecorderExecuteHandler);
    mcpRegistry.registerTool('taskrecorder.get_patterns', taskRecorderGetPatternsHandler);

    // Step 3: Initialize Agent Orchestrator
    const orchestrator = new AgentOrchestratorServer();
    mcpRegistry.registerServer(orchestrator);
    console.log('🤖 Agent Orchestrator initialized');

    // Step 3.5: Initialize Autonomous Intelligence System
    const { initCognitiveMemory } = await import('./mcp/memory/CognitiveMemory.js');
    const { getSourceRegistry } = await import('./mcp/SourceRegistry.js');
    const { initAutonomousAgent, startAutonomousLearning } = await import('./mcp/autonomousRouter.js');
    const { autonomousRouter } = await import('./mcp/autonomousRouter.js');
    const { getDatabase } = await import('./database/index.js');
    const { existsSync } = await import('fs');
    const { readFileSync } = await import('fs');
    const yaml = (await import('js-yaml')).default;

    const db = getDatabase();
    initCognitiveMemory(db);
    console.log('🧠 Cognitive Memory initialized');

    // Initialize Unified Memory System
    const { unifiedMemorySystem } = await import('./mcp/cognitive/UnifiedMemorySystem.js');
    unifiedMemorySystem.init();
    console.log('🧠 Unified Memory System initialized');

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

    // Step 3.7: Start HansPedder orchestrator
    try {
      const { startHansPedder } = await import('./orchestrator/hansPedder.js');
      await startHansPedder();
      console.log('👔 HansPedder orchestrator started');
    } catch (err) {
      console.error('⚠️ Failed to start HansPedder:', err);
      // Non-critical, continue server startup
    }

    // Step 4: Setup routes
    app.use('/api/mcp', mcpRouter);
    app.use('/api/mcp/autonomous', autonomousRouter);
    app.use('/api/memory', memoryRouter);
    app.use('/api/srag', sragRouter);
    app.use('/api/evolution', evolutionRouter);
    app.use('/api/pal', palRouter);
    app.use('/api/security', securityRouter);
    app.use('/api/ai', llmRouter);

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
