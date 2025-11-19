import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { MCPMessage } from '@widget-tdc/mcp-types';
import { mcpRegistry } from './mcpRegistry.js';

export class MCPWebSocketServer {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<string, WebSocket>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/mcp/ws' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(7);
      this.clients.set(clientId, ws);

      console.log(`MCP WebSocket client connected: ${clientId}`);

      ws.on('message', async (data: Buffer) => {
        try {
          const rawMessage = data.toString();
          const message: MCPMessage = JSON.parse(rawMessage);

          const result = await mcpRegistry.route(message);

          ws.send(JSON.stringify({
            success: true,
            messageId: message.id,
            result,
          }));

          this.broadcast(message, clientId);
        } catch (error: unknown) {
          ws.send(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown MCP server error',
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`MCP WebSocket client disconnected: ${clientId}`);
      });

      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        availableTools: mcpRegistry.getRegisteredTools(),
      }));
    });
  }

  private broadcast(message: MCPMessage, excludeClientId?: string): void {
    const data = JSON.stringify({
      type: 'broadcast',
      message,
    });

    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public sendToAll(message: unknown): void {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
