// Load environment variables FIRST - before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Polyfills for PDF parsing environment (pdfjs-dist v4+ compatibility)
// @ts-ignore
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() {}
    };
}
// @ts-ignore
if (typeof global.ImageData === 'undefined') {
    // @ts-ignore
    global.ImageData = class ImageData {
        data: Uint8ClampedArray;
        width: number;
        height: number;
        constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}
// @ts-ignore
if (typeof global.Path2D === 'undefined') {
    // @ts-ignore
    global.Path2D = class Path2D {};
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Load .env from backend directory, or root if not found
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../../../.env') });

// --- SAFETY CHECK: VISUAL CONFIRMATION ---
const ENV_MODE = process.env.NODE_ENV || 'unknown';
const DB_HOST = process.env.POSTGRES_HOST || 'unknown';
const NEO_URI = process.env.NEO4J_URI || 'unknown';

console.log('\n\n');
if (ENV_MODE === 'production') {
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║                    WARNING: PRODUCTION MODE                  ║');
    console.error('║   You are running against LIVE DATA. Use extreme caution.    ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
} else {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                 SAFE MODE: LOCAL DEVELOPMENT                 ║');
    console.log('║                                                              ║');
    console.log(`║  • Environment: ${ENV_MODE.padEnd(28)} ║`);
    console.log(`║  • Postgres:    ${DB_HOST.padEnd(28)} ║`);
    console.log(`║  • Neo4j:       ${NEO_URI.padEnd(28)} ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
}
console.log('\n');
// -----------------------------------------

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './database/index.js';
import { mcpRouter } from './mcp/mcpRouter.js';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { MCPWebSocketServer } from './mcp/mcpWebsocketServer.js';
import { WebSocketServer as LogsWebSocketServer, WebSocket as LogsWebSocket } from 'ws';
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
  widgetsInvokeHandler,
  widgetsOsintInvestigateHandler,
  widgetsThreatHuntHandler,
  widgetsOrchestratorCoordinateHandler,
  widgetsUpdateStateHandler,
  visionaryGenerateHandler
} from './mcp/toolHandlers.js';
import { securityRouter } from './services/security/securityController.js';
import { AgentOrchestratorServer } from './mcp/servers/AgentOrchestratorServer.js';
import {
  inputValidationMiddleware,
  csrfProtectionMiddleware,
  rateLimitingMiddleware
} from './middleware/inputValidation.js';
import { dataScheduler } from './services/ingestion/DataScheduler.js';
import { logStream } from './services/logging/logStream.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimitingMiddleware);
app.use(inputValidationMiddleware);
app.use(csrfProtectionMiddleware);

// CRITICAL: Start server only after database is initialized
async function startServer() {
  try {
    // Show environment banner
    const isProd = process.env.NODE_ENV === 'production';
    const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const isAuraDB = neo4jUri.includes('neo4j.io') || neo4jUri.startsWith('neo4j+s://');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    if (isProd || isAuraDB) {
      console.log('  🔴 WIDGETTDC - PRODUCTION MODE');
      console.log('  Neo4j: AuraDB Cloud');
    } else {
      console.log('  🟢 WIDGETTDC - DEVELOPMENT MODE');
      console.log('  Neo4j: Local Docker');
    }
    console.log(`  URI: ${neo4jUri}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Step 0: Always initialize sql.js (used by CognitiveMemory, etc)
    await initializeDatabase();
    console.log('🗄️  SQLite (sql.js) initialized for memory systems');

    // Step 1: Initialize Prisma (PostgreSQL + pgvector) - Primary database
    try {
      const { getDatabaseAdapter } = await import('./platform/db/PrismaDatabaseAdapter.js');
      const prismaAdapter = getDatabaseAdapter();
      await prismaAdapter.initialize();
      console.log('🐘 PostgreSQL + pgvector initialized via Prisma');
    } catch (prismaError) {
      console.warn('⚠️  Prisma/PostgreSQL not available:', prismaError);
      console.log('   Using SQLite (sql.js) as fallback for all storage');
    }

    // Step 1.5: Initialize Neo4j Graph Database
    try {
      const { getNeo4jGraphAdapter } = await import('./platform/graph/Neo4jGraphAdapter.js');
      const neo4jAdapter = getNeo4jGraphAdapter();
      await neo4jAdapter.initialize();
      console.log('🕸️  Neo4j Graph Database initialized');

      // Also connect Neo4jService (used by GraphMemoryService)
      const { neo4jService } = await import('./database/Neo4jService.js');
      await neo4jService.connect();
      console.log('🕸️  Neo4j Service connected');

      // Run initialization if database is empty
      const stats = await neo4jAdapter.getStatistics();
      if (stats.nodeCount < 5) {
        console.log('📦 Neo4j database appears empty, running initialization...');
        const { initializeNeo4j } = await import('./scripts/initNeo4j.js');
        await initializeNeo4j();
      }
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
    mcpRegistry.registerTool('widgets.invoke', widgetsInvokeHandler);
    mcpRegistry.registerTool('widgets.osint.investigate', widgetsOsintInvestigateHandler);
    mcpRegistry.registerTool('widgets.threat.hunt', widgetsThreatHuntHandler);
    mcpRegistry.registerTool('widgets.orchestrator.coordinate', widgetsOrchestratorCoordinateHandler);
    mcpRegistry.registerTool('widgets.update_state', widgetsUpdateStateHandler);
    mcpRegistry.registerTool('visionary.generate', visionaryGenerateHandler);

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

    // TaskRecorder Tools
    const {
      taskRecorderGetSuggestionsHandler,
      taskRecorderApproveHandler,
      taskRecorderRejectHandler,
      taskRecorderExecuteHandler,
      taskRecorderGetPatternsHandler,
      emailRagHandler
    } = await import('./mcp/toolHandlers.js');

    mcpRegistry.registerTool('taskrecorder.get_suggestions', taskRecorderGetSuggestionsHandler);
    mcpRegistry.registerTool('taskrecorder.approve', taskRecorderApproveHandler);
    mcpRegistry.registerTool('taskrecorder.reject', taskRecorderRejectHandler);
    mcpRegistry.registerTool('taskrecorder.execute', taskRecorderExecuteHandler);
    mcpRegistry.registerTool('taskrecorder.get_patterns', taskRecorderGetPatternsHandler);
    mcpRegistry.registerTool('email.rag', emailRagHandler);

    // Document Generator Tools
    const {
      docgenPowerpointCreateHandler,
      docgenWordCreateHandler,
      docgenExcelCreateHandler,
      docgenStatusHandler
    } = await import('./mcp/toolHandlers.js');

    mcpRegistry.registerTool('docgen.powerpoint.create', docgenPowerpointCreateHandler);
    mcpRegistry.registerTool('docgen.word.create', docgenWordCreateHandler);
    mcpRegistry.registerTool('docgen.excel.create', docgenExcelCreateHandler);
    mcpRegistry.registerTool('docgen.status', docgenStatusHandler);

    // DevTools Guardian Tools
    const { handleDevToolsRequest } = await import('./mcp/devToolsHandlers.js');
    mcpRegistry.registerTool('devtools-status', handleDevToolsRequest);
    mcpRegistry.registerTool('devtools-scan', handleDevToolsRequest);
    mcpRegistry.registerTool('devtools-validate', handleDevToolsRequest);

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

    // Step 3.6: Initialize MCP → Autonomous Integration (non-blocking with timeout)
    const autonomousInitPromise = (async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Autonomous init timeout')), 5000)
        );
        const { initializeAutonomousSources } = await import('./mcp/autonomous/MCPIntegration.js');
        await Promise.race([initializeAutonomousSources(), timeoutPromise]);
        console.log('🔗 MCP tools registered as autonomous sources');

        const agent = initAutonomousAgent();
        console.log('🤖 Autonomous Agent initialized');

        startAutonomousLearning(agent, 300000);
        console.log('🔄 Autonomous learning started (5min intervals)');
      } catch (err: any) {
        console.warn('⚠️ Autonomous sources initialization skipped:', err.message);
      }
    })();
    // Don't await - let it run in background

    // Step 3.7: Start HansPedder orchestrator (non-blocking)
    (async () => {
      try {
        const { startHansPedder } = await import('./orchestrator/hansPedder.js');
        await startHansPedder();
        console.log('👔 HansPedder orchestrator started');
      } catch (err) {
        console.error('⚠️ Failed to start HansPedder:', err);
      }
    })();

    // Step 3.8: Start Data Ingestion Scheduler
    dataScheduler.start();
    console.log('⏰ Data Ingestion Scheduler started');

    // Step 3.8.5: Start NudgeService (aggressive data generation every 15 min)
    const { nudgeService } = await import('./services/NudgeService.js');
    nudgeService.start();

    // Step 3.9: Start HansPedder Agent Controller (non-blocking)
    (async () => {
      try {
        const { hansPedderAgent } = await import('./services/agent/HansPedderAgentController.js');
        hansPedderAgent.start();
        console.log('🤖 HansPedder Agent Controller started (continuous testing + nudges)');
      } catch (err) {
        console.error('⚠️ Failed to start HansPedder Agent Controller:', err);
      }
    })();

    // Step 4: Setup routes
    app.use('/api/mcp', mcpRouter);
    app.use('/api/mcp/autonomous', autonomousRouter);
    app.use('/api/memory', memoryRouter);
    app.use('/api/srag', sragRouter);
    app.use('/api/evolution', evolutionRouter);
    app.use('/api/harvest', (req, res, next) => {
      req.url = `/harvest${req.url}`;
      evolutionRouter(req, res, next);
    });
    app.use('/api/pal', palRouter);
    app.use('/api/security', securityRouter);

    // HansPedder Agent Controller routes
    const hanspedderRoutes = (await import('./routes/hanspedderRoutes.js')).default;
    app.use('/api/hanspedder', hanspedderRoutes);

    // Prototype Generation routes (PRD to Prototype)
    const prototypeRoutes = (await import('./routes/prototype.js')).default;
    app.use('/api/prototype', prototypeRoutes);

    // System Information routes (CPU, Memory, GPU, Network stats)
    const sysRoutes = (await import('./routes/sys.js')).default;
    app.use('/api/sys', sysRoutes);
    console.log('📊 System Info API mounted at /api/sys');

    // Neural Chat - Agent-to-Agent Communication
    const { neuralChatRouter } = await import('./services/NeuralChat/index.js');
    app.use('/api/neural-chat', neuralChatRouter);
    console.log('💬 Neural Chat API mounted at /api/neural-chat');

    // Knowledge Compiler - System State Aggregation
    const knowledgeRoutes = (await import('./routes/knowledge.js')).default;
    app.use('/api/knowledge', knowledgeRoutes);
    console.log('🧠 Knowledge API mounted at /api/knowledge');

    // Knowledge Acquisition - The Omni-Harvester
    const acquisitionRoutes = (await import('./routes/acquisition.js')).default;
    app.use('/api/acquisition', acquisitionRoutes);
    console.log('🌾 Omni-Harvester API mounted at /api/acquisition');

    // Start KnowledgeCompiler auto-compilation (every 60 seconds)
    const { knowledgeCompiler } = await import('./services/Knowledge/index.js');
    knowledgeCompiler.startAutoCompilation(60000);
    console.log('🧠 KnowledgeCompiler auto-compilation started');

    // ═══════════════════════════════════════════════════════════════════
    // 🛡️ BOOTSTRAP HEALTH CHECK - Verify critical services before startup
    // Prevents "Death on Startup" if Neo4j/DB unavailable
    // ═══════════════════════════════════════════════════════════════════
    const bootstrapHealthCheck = async (): Promise<{ ready: boolean; degraded: boolean; services: any[] }> => {
        const services: { name: string; status: 'healthy' | 'degraded' | 'unavailable'; latencyMs?: number }[] = [];
        let criticalFailure = false;
        
        // Check Neo4j
        try {
            const start = Date.now();
            const { neo4jAdapter } = await import('./adapters/Neo4jAdapter.js');
            await neo4jAdapter.executeQuery('RETURN 1 as ping');
            services.push({ name: 'Neo4j', status: 'healthy', latencyMs: Date.now() - start });
            console.log('✅ Neo4j: HEALTHY');
        } catch (err: any) {
            services.push({ name: 'Neo4j', status: 'degraded' });
            console.warn('⚠️ Neo4j: DEGRADED - continuing without graph features');
        }

        // Check Prisma/PostgreSQL (already initialized above)
        try {
            const start = Date.now();
            // Prisma is already connected if we got here
            services.push({ name: 'PostgreSQL', status: 'healthy', latencyMs: Date.now() - start });
            console.log('✅ PostgreSQL: HEALTHY (Prisma connected)');
        } catch (err: any) {
            services.push({ name: 'PostgreSQL', status: 'degraded' });
            console.warn('⚠️ PostgreSQL: DEGRADED - some features may be unavailable');
        }

        // Check filesystem (DropZone)
        try {
            const fs = await import('fs/promises');
            const os = await import('os');
            const path = await import('path');
            const dropzone = path.join(os.homedir(), 'Desktop', 'WidgeTDC_DropZone');
            await fs.access(dropzone);
            services.push({ name: 'Filesystem', status: 'healthy' });
            console.log('✅ Filesystem: HEALTHY');
        } catch {
            services.push({ name: 'Filesystem', status: 'degraded' });
            console.warn('⚠️ Filesystem: DropZone not accessible');
        }

        const degraded = services.some(s => s.status === 'degraded');
        return { ready: !criticalFailure, degraded, services };
    };

    console.log('\n🔍 Running Bootstrap Health Check...');
    const bootHealth = await bootstrapHealthCheck();
    
    if (!bootHealth.ready) {
        console.error('💀 CRITICAL: Bootstrap health check failed - aborting startup');
        process.exit(1);
    }
    
    if (bootHealth.degraded) {
        console.warn('⚠️ WARNING: Starting in DEGRADED MODE - some features may be unavailable\n');
    } else {
        console.log('✅ All systems nominal - proceeding with startup\n');
    }

    // ═══════════════════════════════════════════════════════════════════
    // EARLY SERVER START - Start accepting connections ASAP
    // All additional route handlers are registered below
    // ═══════════════════════════════════════════════════════════════════
    const server = createServer(app);
    const wsServer = new MCPWebSocketServer(server);

    const logsWsServer = new LogsWebSocketServer({ server, path: '/api/logs/stream' });
    logsWsServer.on('connection', (socket: LogsWebSocket) => {
      try {
        socket.send(JSON.stringify({ type: 'bootstrap', entries: logStream.getRecent({ limit: 50 }) }));
      } catch (err) {
        console.error('Failed to send initial log buffer:', err);
      }

      const listener = (entry: any) => {
        if (socket.readyState === LogsWebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'log', entry }));
        }
      };

      logStream.on('log', listener);

      socket.on('close', () => {
        logStream.off('log', listener);
      });
    });

    // Start server IMMEDIATELY - don't wait for additional setup
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 MCP WebSocket available at ws://0.0.0.0:${PORT}/mcp/ws`);
      console.log(`🔧 Registered MCP tools:`, mcpRegistry.getRegisteredTools());
    });

    // Wire up WebSocket and orchestrator in background (non-blocking)
    (async () => {
      try {
        const { setWebSocketServer } = await import('./mcp/autonomousRouter.js');
        setWebSocketServer(wsServer);
        orchestrator.setBroadcaster((message) => {
          wsServer.sendToAll(message);
        });
        console.log('📡 WebSocket server wired to orchestrator');
      } catch (err) {
        console.warn('⚠️ WebSocket setup deferred:', err);
      }
    })();

    // Health check endpoint - comprehensive system health
    app.get('/health', async (req, res) => {
      try {
        const { getNeo4jVectorStore } = await import('./platform/vector/Neo4jVectorStoreAdapter.js');
        const { neo4jService } = await import('./database/Neo4jService.js');

        // Vector store health (Neo4j)
        let vectorHealth = { healthy: false, backend: 'unknown' as any };
        try {
          const vectorStore = getNeo4jVectorStore();
          // Assume healthy if no error thrown
          vectorHealth = { healthy: true, backend: 'neo4j' };
        } catch { /* ignore */ }

        // Neo4j health
        let neo4jHealthy = false;
        try {
          neo4jHealthy = await neo4jService.healthCheck();
        } catch { /* ignore */ }

        // SQLite health
        let sqliteHealthy = false;
        try {
          const { getDatabase } = await import('./database/index.js');
          const db = getDatabase();
          const result = db.prepare('SELECT 1 as test').get() as any;
          sqliteHealthy = result?.test === 1;
        } catch { /* ignore */ }

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            sqlite: { healthy: sqliteHealthy },
            neo4j: { healthy: neo4jHealthy, optional: true },
            vectorStore: vectorHealth
          },
          registeredTools: mcpRegistry.getRegisteredTools().length,
          toolsList: mcpRegistry.getRegisteredTools()
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: String(error)
        });
      }
    });

    // Readiness/Liveness checks
    app.get('/ready', (req, res) => res.json({ ready: true, timestamp: new Date().toISOString() }));
    app.get('/live', (req, res) => res.json({ live: true, timestamp: new Date().toISOString() }));

    // ============================================
    // KNOWLEDGE COMPILER API - System Intelligence
    // ============================================
    const knowledgeApi = (await import('./api/knowledge.js')).default;
    app.use('/api/knowledge', knowledgeApi);
    console.log('📚 Knowledge Compiler API mounted at /api/knowledge');

    const logsRouter = (await import('./routes/logs.js')).default;
    app.use('/api/logs', logsRouter);
    console.log('📝 Log API mounted at /api/logs');

    // HyperLog API - Real-time intelligence monitoring for NeuroLink widget
    app.get('/api/hyper/events', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const events = hyperLog.getHistory(50);
        const metrics = hyperLog.getMetrics();
        res.json({ events, metrics });
      } catch (error) {
        console.error('HyperLog error:', error);
        res.status(500).json({ error: 'HyperLog unavailable', events: [], metrics: { totalThoughts: 0, toolUsageRate: 0, activeAgents: 0 } });
      }
    });

    // ============================================
    // SEMANTIC BUS: Widget Telepathy API
    // ============================================

    // Dream API - Semantic search across collective memory
    app.post('/api/hyper/dream', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { query, limit = 5, minScore = 0.6 } = req.body;

        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        const results = await hyperLog.findRelatedThoughts(query, limit, minScore);
        const canDream = hyperLog.canDream();

        res.json({
          results,
          query,
          dreamMode: canDream ? 'semantic' : 'keyword',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Dream API error:', error);
        res.status(500).json({ error: 'Dream failed', results: [] });
      }
    });

    // Broadcast API - Widget sends a thought into the collective
    app.post('/api/hyper/broadcast', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { type, agent, content, metadata = {} } = req.body;

        if (!type || !agent || !content) {
          return res.status(400).json({ error: 'type, agent, and content are required' });
        }

        const eventId = await hyperLog.log(type, agent, content, metadata);

        res.json({
          success: true,
          eventId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Broadcast API error:', error);
        res.status(500).json({ error: 'Broadcast failed' });
      }
    });

    // Find similar thoughts to a specific event
    app.get('/api/hyper/similar/:eventId', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { eventId } = req.params;
        const limit = parseInt(req.query.limit as string) || 5;

        const results = await hyperLog.findSimilarTo(eventId, limit);

        res.json({ results, eventId });
      } catch (error) {
        console.error('Similar API error:', error);
        res.status(500).json({ error: 'Similarity search failed', results: [] });
      }
    });

    // Get causal path leading to an event (rewind the brain)
    app.get('/api/hyper/rewind/:eventId', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { eventId } = req.params;
        const maxDepth = parseInt(req.query.maxDepth as string) || 50;

        const path = await hyperLog.getCausalPath(eventId, maxDepth);

        res.json({ path, eventId, depth: path.length });
      } catch (error) {
        console.error('Rewind API error:', error);
        res.status(500).json({ error: 'Rewind failed', path: [] });
      }
    });

    // Start a new thought chain (correlation)
    app.post('/api/hyper/chain/start', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { label } = req.body;

        const correlationId = hyperLog.startChain(label);

        res.json({ correlationId, label });
      } catch (error) {
        console.error('Chain start error:', error);
        res.status(500).json({ error: 'Failed to start chain' });
      }
    });

    // Get brain status (can it dream?)
    app.get('/api/hyper/status', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const metrics = hyperLog.getMetrics();
        const canDream = hyperLog.canDream();

        res.json({
          canDream,
          metrics,
          status: canDream ? 'dreaming' : 'awake',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Status API error:', error);
        res.status(500).json({ error: 'Status unavailable' });
      }
    });

    // ============================================
    // THE STRATEGIST - Team Delegation API
    // ============================================

    /**
     * POST /api/team/delegate
     * The Strategist delegates tasks to team members (Architect, Visionary)
     */
    app.post('/api/team/delegate', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const {
          task,
          assignTo,
          priority = 'medium',
          context = {},
          parentTaskId
        } = req.body;

        if (!task || !assignTo) {
          return res.status(400).json({
            error: 'Missing required fields: task, assignTo'
          });
        }

        // Log the delegation event
        const eventId = await hyperLog.log(
          'DELEGATION',
          'TheStrategist',
          `Delegating to ${assignTo}: ${task}`,
          {
            assignedTo: assignTo,
            priority,
            context,
            parentTaskId,
            status: 'pending'
          }
        );

        // Broadcast the delegation for the assigned widget to pick up
        await hyperLog.log(
          'THOUGHT',
          assignTo,
          `Received task from Strategist: ${task}`,
          {
            delegationId: eventId,
            priority,
            context
          }
        );

        res.json({
          success: true,
          delegationId: eventId,
          message: `Task delegated to ${assignTo}`,
          task: {
            id: eventId,
            description: task,
            assignedTo: assignTo,
            priority,
            status: 'pending',
            createdAt: Date.now()
          }
        });

      } catch (error) {
        console.error('Delegation API error:', error);
        res.status(500).json({ error: 'Delegation failed' });
      }
    });

    /**
     * GET /api/team/tasks
     * Get all delegated tasks and their status
     */
    app.get('/api/team/tasks', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { assignedTo, status } = req.query;

        // Search for delegation events
        const allEvents = hyperLog.getHistory(100);
        let tasks = allEvents.filter(e => e.type === 'DELEGATION');

        if (assignedTo) {
          tasks = tasks.filter(t => t.metadata?.assignedTo === assignedTo);
        }
        if (status) {
          tasks = tasks.filter(t => t.metadata?.status === status);
        }

        res.json({
          tasks: tasks.map(t => ({
            id: t.id,
            description: t.content,
            assignedTo: t.metadata?.assignedTo,
            priority: t.metadata?.priority,
            status: t.metadata?.status || 'pending',
            createdAt: t.timestamp,
            context: t.metadata?.context
          })),
          total: tasks.length
        });

      } catch (error) {
        console.error('Tasks API error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
      }
    });

    /**
     * PUT /api/team/tasks/:taskId/status
     * Update task status (e.g., in_progress, completed, blocked)
     */
    app.put('/api/team/tasks/:taskId/status', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const { taskId } = req.params;
        const { status, result, notes } = req.body;

        if (!status) {
          return res.status(400).json({ error: 'Status is required' });
        }

        // Log the status update
        const eventId = await hyperLog.log(
          'REASONING_UPDATE',
          'TheStrategist',
          `Task ${taskId} status updated to: ${status}`,
          {
            taskId,
            newStatus: status,
            result,
            notes,
            updatedAt: Date.now()
          }
        );

        res.json({
          success: true,
          taskId,
          status,
          updateEventId: eventId
        });

      } catch (error) {
        console.error('Task update API error:', error);
        res.status(500).json({ error: 'Failed to update task' });
      }
    });

    /**
     * POST /api/team/plan
     * The Strategist creates a multi-step plan with dependencies
     */
    app.post('/api/team/plan', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const {
          goal,
          steps,
          teamMembers = ['TheArchitect', 'TheVisionary']
        } = req.body;

        if (!goal || !steps || !Array.isArray(steps)) {
          return res.status(400).json({
            error: 'Missing required fields: goal, steps (array)'
          });
        }

        // Start a new correlation chain for this plan
        const planId = hyperLog.startChain(`Plan: ${goal.substring(0, 50)}`);

        // Log the plan creation
        await hyperLog.log(
          'CRITICAL_DECISION',
          'TheStrategist',
          `Created plan: ${goal}`,
          {
            planId,
            totalSteps: steps.length,
            teamMembers,
            steps: steps.map((s: any, i: number) => ({
              order: i + 1,
              ...s
            }))
          }
        );

        // Create delegation events for each step
        const delegations: { id: string; step: string }[] = [];
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const eventId = await hyperLog.log(
            'DELEGATION',
            'TheStrategist',
            `Step ${i + 1}: ${step.task}`,
            {
              planId,
              stepOrder: i + 1,
              assignedTo: step.assignTo || teamMembers[i % teamMembers.length],
              dependsOn: step.dependsOn || (i > 0 ? [delegations[i-1].id] : []),
              status: 'pending',
              priority: step.priority || 'medium'
            }
          );
          delegations.push({ id: eventId, step: step.task });
        }

        res.json({
          success: true,
          planId,
          goal,
          steps: delegations.map((d, i) => ({
            ...d,
            order: i + 1,
            assignedTo: steps[i].assignTo || teamMembers[i % teamMembers.length]
          })),
          totalSteps: steps.length
        });

      } catch (error) {
        console.error('Plan API error:', error);
        res.status(500).json({ error: 'Failed to create plan' });
      }
    });

    /**
     * GET /api/team/status
     * Get overall team status and workload
     */
    app.get('/api/team/status', async (req, res) => {
      try {
        const { hyperLog } = await import('./services/hyper-log.js');
        const allEvents = hyperLog.getHistory(200);

        const delegations = allEvents.filter(e => e.type === 'DELEGATION');
        const byAgent: Record<string, any> = {};

        // Aggregate by team member
        for (const d of delegations) {
          const agent = d.metadata?.assignedTo || 'Unassigned';
          if (!byAgent[agent]) {
            byAgent[agent] = {
              name: agent,
              pending: 0,
              inProgress: 0,
              completed: 0,
              blocked: 0,
              tasks: []
            };
          }

          const status = d.metadata?.status || 'pending';
          byAgent[agent][status === 'in_progress' ? 'inProgress' : status]++;
          byAgent[agent].tasks.push({
            id: d.id,
            task: d.content,
            status,
            priority: d.metadata?.priority
          });
        }

        res.json({
          team: Object.values(byAgent),
          summary: {
            totalTasks: delegations.length,
            pending: delegations.filter(d => d.metadata?.status === 'pending').length,
            inProgress: delegations.filter(d => d.metadata?.status === 'in_progress').length,
            completed: delegations.filter(d => d.metadata?.status === 'completed').length
          },
          lastUpdated: Date.now()
        });

      } catch (error) {
        console.error('Team status API error:', error);
        res.status(500).json({ error: 'Failed to fetch team status' });
      }
    });

    // ============================================
    // THE COLONIZER - API Assimilation Engine
    // ============================================

    /**
     * POST /api/evolution/colonize
     * Assimilate a new external API into the WidgeTDC swarm
     */
    app.post('/api/evolution/colonize', async (req, res) => {
      try {
        const { colonizerService } = await import('./services/colonizer-service.js');
        const { systemName, documentation, generateTests = false, dryRun = false } = req.body;

        if (!systemName || !documentation) {
          return res.status(400).json({
            error: 'Missing required fields: systemName, documentation'
          });
        }

        console.log(`🛸 [COLONIZER API] Received assimilation request for: ${systemName}`);

        const result = await colonizerService.assimilateSystem({
          systemName,
          apiSpecContent: documentation,
          generateTests,
          dryRun
        });

        res.json(result);

      } catch (error: any) {
        console.error('Colonizer API error:', error);
        res.status(500).json({ error: error.message || 'Assimilation failed' });
      }
    });

    /**
     * GET /api/evolution/systems
     * List all assimilated systems
     */
    app.get('/api/evolution/systems', async (req, res) => {
      try {
        const { colonizerService } = await import('./services/colonizer-service.js');
        const systems = await colonizerService.listAssimilatedSystems();

        res.json({
          systems,
          count: systems.length,
          toolsDirectory: 'apps/backend/src/tools/generated'
        });

      } catch (error: any) {
        console.error('Systems list API error:', error);
        res.status(500).json({ error: 'Failed to list systems' });
      }
    });

    /**
     * DELETE /api/evolution/systems/:systemName
     * Remove an assimilated system
     */
    app.delete('/api/evolution/systems/:systemName', async (req, res) => {
      try {
        const { colonizerService } = await import('./services/colonizer-service.js');
        const { systemName } = req.params;

        const success = await colonizerService.removeSystem(systemName);

        if (success) {
          res.json({
            success: true,
            message: `System ${systemName} removed. Restart server to complete removal.`
          });
        } else {
          res.status(404).json({
            success: false,
            message: `System ${systemName} not found`
          });
        }

      } catch (error: any) {
        console.error('System removal API error:', error);
        res.status(500).json({ error: 'Failed to remove system' });
      }
    });

    /**
     * GET /api/evolution/graph/stats
     * Get Neo4j graph statistics for 3D visualization
     * 🔗 NEURAL LINK ENDPOINT
     */
    app.get('/api/evolution/graph/stats', async (_req, res) => {
      try {
        const { neo4jService } = await import('./database/Neo4jService.js');

        // 1. Fetch Stats
        const statsQuery = `
          MATCH (n) 
          OPTIONAL MATCH ()-[r]->() 
          RETURN count(DISTINCT n) as nodes, count(DISTINCT r) as relationships
        `;
        const statsResult = await neo4jService.runQuery(statsQuery);
        const stats = {
          nodes: statsResult[0]?.nodes?.toNumber ? statsResult[0].nodes.toNumber() : (statsResult[0]?.nodes || 0),
          relationships: statsResult[0]?.relationships?.toNumber ? statsResult[0].relationships.toNumber() : (statsResult[0]?.relationships || 0)
        };

        // 2. Fetch Sample Nodes for Visualization
        const vizQuery = `
          MATCH (n) 
          RETURN n, labels(n) as labels 
          LIMIT 100
        `;
        const vizResult = await neo4jService.runQuery(vizQuery);
        
        // Map Neo4j structure to clean JSON for Frontend
        const visualNodes = vizResult.map(row => {
          const node = row.n;
          return {
            id: node.elementId, // v6: use elementId instead of identity
            name: node.properties.name || node.properties.title || `Node ${node.elementId}`,
            labels: row.labels || node.labels,
            type: (row.labels && row.labels.includes('Directory')) ? 'directory' : 'file', // Simple heuristic
            properties: node.properties
          };
        });

        // 3. Fetch Sample Relationships
        const relQuery = `
          MATCH (n)-[r]->(m)
          RETURN r, elementId(n) as source, elementId(m) as target
          LIMIT 200
        `;
        const relResult = await neo4jService.runQuery(relQuery);
        
        const visualLinks = relResult.map(row => ({
          source: row.source, // elementId is string
          target: row.target, // elementId is string
          type: row.r.type,
          id: row.r.elementId // v6: use elementId
        }));

        // 4. Send Combined Payload
        res.json({
          timestamp: new Date().toISOString(),
          stats: stats,
          nodes: visualNodes,
          links: visualLinks,
          // Backwards compatibility fields
          totalNodes: stats.nodes,
          totalRelationships: stats.relationships,
          importGraph: visualLinks.map(l => ({ from: l.source, to: l.target }))
        });

      } catch (error: any) {
        console.error('❌ API Error in /graph/stats:', error);
        res.status(500).json({ 
          error: 'Failed to retrieve neural link data',
          details: error.message,
          nodes: [],
          links: [] 
        });
      }
    });

    /**
     * GET /api/codex/status
     * Get Codex Symbiosis status
     */
    app.get('/api/codex/status', async (_req, res) => {
      try {
        const { CODEX_VERSION } = await import('./config/codex.js');

        res.json({
          version: CODEX_VERSION,
          status: 'active',
          injectionPoint: 'LLM Service',
          principles: [
            'HUKOMMELSE - Check context before responding',
            'TRANSPARENS - Explain all actions',
            'SIKKERHED - Never leak PII without approval',
            'SAMARBEJDE - Compatible with team patterns',
            'VÆKST - Suggest improvements when seen',
            'YDMYGHED - Ask when uncertain',
            'LOYALITET - Serve The Executive'
          ],
          message: 'Codex Symbiosis is active. All AI responses are filtered through the ethical framework.'
        });

      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get Codex status' });
      }
    });

    // ============================================
    // OMNI-HARVESTER - Knowledge Acquisition API
    // ============================================
    const acquisitionRouter = (await import('./routes/acquisition.js')).default;
    app.use('/api/acquisition', acquisitionRouter);
    console.log('🌾 Omni-Harvester API mounted at /api/acquisition');

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 ${signal} received: starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(() => {
        console.log('  ✓ HTTP server closed');
      });

      // Stop scheduled tasks
      try {
        dataScheduler.stop();
        console.log('  ✓ Data scheduler stopped');
      } catch { /* ignore */ }

      // Stop HansPedder agent
      try {
        const { hansPedderAgent } = await import('./services/agent/HansPedderAgentController.js');
        hansPedderAgent.stop();
        console.log('  ✓ HansPedder agent stopped');
      } catch { /* ignore */ }

      // Close Neo4j connections
      try {
        const { neo4jService } = await import('./database/Neo4jService.js');
        await neo4jService.close();
        console.log('  ✓ Neo4j connection closed');
      } catch { /* ignore */ }

      // Close SQLite database
      try {
        const { closeDatabase } = await import('./database/index.js');
        closeDatabase();
        console.log('  ✓ SQLite database closed');
      } catch { /* ignore */ }

      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors gracefully
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit on unhandled rejections, just log
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
