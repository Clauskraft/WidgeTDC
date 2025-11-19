import express from 'express';
import cors from 'cors';
import { getDatabase } from './database/index.js';
import { mcpRouter } from './mcp/mcpRouter.js';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { MCPWebSocketServer } from './mcp/mcpWebsocketServer.js';
import {
  cmaContextHandler,
  cmaIngestHandler,
  sragQueryHandler,
  evolutionReportHandler,
  evolutionGetPromptHandler,
  palEventHandler,
  palBoardActionHandler,
} from './mcp/toolHandlers.js';
import { memoryRouter } from './services/memory/memoryController.js';
import { sragRouter } from './services/srag/sragController.js';
import { evolutionRouter } from './services/evolution/evolutionController.js';
import { palRouter } from './services/pal/palController.js';
import { scRouter } from './services/sc/scController.js';

// Remove toolsRegistered flag; use per-tool registration checks

function ensureMcpToolsRegistered(): void {
  const tools: Array<[string, Parameters<typeof mcpRegistry.registerTool>[1]]> = [
    ['cma.context', cmaContextHandler],
    ['cma.ingest', cmaIngestHandler],
    ['srag.query', sragQueryHandler],
    ['evolution.report-run', evolutionReportHandler],
    ['evolution.get-prompt', evolutionGetPromptHandler],
    ['pal.event', palEventHandler],
    ['pal.board-action', palBoardActionHandler],
  ];

  for (const [toolName, handler] of tools) {
    if (mcpRegistry.hasTool(toolName)) {
      continue;
    }
    mcpRegistry.registerTool(toolName, handler);
  }
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  getDatabase();
  ensureMcpToolsRegistered();

  app.use('/api/mcp', mcpRouter);
  app.use('/api/memory', memoryRouter);
  app.use('/api/srag', sragRouter);
  app.use('/api/evolution', evolutionRouter);
  app.use('/api/pal', palRouter);
  app.use('/api/commands/sc', scRouter);

  return app;
}

export function createMcpWebSocketServer(server: Parameters<typeof MCPWebSocketServer>[0]) {
  return new MCPWebSocketServer(server);
}
