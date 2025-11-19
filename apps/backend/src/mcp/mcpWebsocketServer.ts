import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { MCPMessage } from '@widget-tdc/mcp-types';
import { mcpRegistry } from './mcpRegistry.js';
import { exec } from 'child_process';

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
          const rawMessage = data.toString();

          // Handle NEXUS commands
          if (rawMessage.startsWith('NEXUS_COMMAND:')) {
            const commandCode = rawMessage.replace('NEXUS_COMMAND:', '');
            const result = this.executeNexusCommand(commandCode);

            // Send result back as NEXUS_RESPONSE
            ws.send(JSON.stringify({
              event: 'NEXUS_RESPONSE',
              data: result
            }));
            return;
          }

          const message: MCPMessage = JSON.parse(rawMessage);

          // Route the message
          const result = await mcpRegistry.route(message);

          // Send response back to client
          ws.send(JSON.stringify({
            success: true,
            messageId: message.id,
            result,
          }));

          // Broadcast to other clients if needed
          this.broadcast(message, clientId);
        } catch (error: any) {
          ws.send(JSON.stringify({
            success: false,
            error: error.message,
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`MCP WebSocket client disconnected: ${clientId}`);
      });

      // Send welcome message
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

  public sendToAll(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private executeNexusCommand(commandIntent: string): string {
    console.log(`⚡ NEXUS EXECUTING: ${commandIntent}`);

    // Simple translation of "AI Intent" to system commands
    if (commandIntent.includes('KILL_CHROME')) {
        exec('taskkill /F /IM chrome.exe', (error, stdout, stderr) => {
            if (error) console.log('Error killing Chrome:', error);
        });
        return "Target neutralized: Google Chrome processes terminated.";
    }
    if (commandIntent.includes('OPEN_STEAM')) {
        exec('start steam://', (error, stdout, stderr) => {
            if (error) console.log('Error opening Steam:', error);
        });
        return "Launching entertainment subsystem...";
    }
    if (commandIntent.includes('FLUSH_DNS')) {
        exec('ipconfig /flushdns', (error, stdout, stderr) => {
            if (error) console.log('Error flushing DNS:', error);
        });
        return "Network cache cleared.";
    }
    if (commandIntent.includes('KILL_NODE')) {
        exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
            if (error) console.log('Error killing Node processes:', error);
        });
        return "All Node.js processes terminated.";
    }
    if (commandIntent.includes('RESTART_EXPLORER')) {
        exec('taskkill /F /IM explorer.exe && start explorer.exe', (error, stdout, stderr) => {
            if (error) console.log('Error restarting Explorer:', error);
        });
        return "Windows Explorer restarted.";
    }

    return `Command '${commandIntent}' not recognized in safety protocols.`;
  }
}
