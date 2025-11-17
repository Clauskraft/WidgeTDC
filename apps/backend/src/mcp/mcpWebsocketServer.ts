import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { MCPMessage } from '@widget-tdc/mcp-types';
import { mcpRegistry } from './mcpRegistry.js';

export class MCPWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

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
          const message: MCPMessage = JSON.parse(data.toString());

          // Route the message
          const result = await mcpRegistry.route(message);

          // Send response back to client
          ws.send(
            JSON.stringify({
              success: true,
              messageId: message.id,
              result,
            })
          );

          // Broadcast to other clients if needed
          this.broadcast(message, clientId);
        } catch (error: any) {
          ws.send(
            JSON.stringify({
              success: false,
              error: error.message,
            })
          );
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`MCP WebSocket client disconnected: ${clientId}`);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'welcome',
          clientId,
          availableTools: mcpRegistry.getRegisteredTools(),
        })
      );
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

  public sendToAll(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
