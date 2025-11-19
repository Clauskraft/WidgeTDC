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

let toolsRegistered = false;

function ensureMcpToolsRegistered(): void {
  if (toolsRegistered) {
    return;
  }

  mcpRegistry.registerTool('cma.context', cmaContextHandler);
  mcpRegistry.registerTool('cma.ingest', cmaIngestHandler);
  mcpRegistry.registerTool('srag.query', sragQueryHandler);
  mcpRegistry.registerTool('evolution.report-run', evolutionReportHandler);
  mcpRegistry.registerTool('evolution.get-prompt', evolutionGetPromptHandler);
  mcpRegistry.registerTool('pal.event', palEventHandler);
  mcpRegistry.registerTool('pal.board-action', palBoardActionHandler);

  toolsRegistered = true;
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
