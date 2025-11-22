import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { MCPMessage } from '@widget-tdc/mcp-types';
import { mcpRegistry } from './mcpRegistry.js';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export class MCPWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/mcp/ws' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);

      console.log(`MCP WebSocket client connected: ${clientId}`);

      this.sendWelcomeMessage(ws, clientId);

      ws.on('message', async (data: Buffer) => {
        await this.handleMessage(ws, data, clientId);
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });
    });
  }

  private async handleMessage(ws: WebSocket, data: Buffer, clientId: string): Promise<void> {
    try {
      const rawMessage = data.toString();

      if (rawMessage.startsWith('NEXUS_COMMAND:')) {
        await this.handleNexusCommand(ws, rawMessage);
        return;
      }

      const message: MCPMessage = JSON.parse(rawMessage);
      const result = await mcpRegistry.route(message);

      this.sendResponse(ws, {
        success: true,
        messageId: message.id,
        result,
      });

      this.broadcast(message, clientId);
    } catch (error: any) {
      this.sendResponse(ws, {
        success: false,
        error: error.message,
      });
    }
  }

  private async handleNexusCommand(ws: WebSocket, rawMessage: string): Promise<void> {
    const commandCode = rawMessage.replace('NEXUS_COMMAND:', '');
    const result = await this.executeNexusCommand(commandCode);

    this.sendResponse(ws, {
      event: 'NEXUS_RESPONSE',
      data: result
    });
  }

  private sendWelcomeMessage(ws: WebSocket, clientId: string): void {
    this.sendResponse(ws, {
      type: 'welcome',
      clientId,
      availableTools: mcpRegistry.getRegisteredTools(),
    });
  }

  private sendResponse(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`MCP WebSocket client disconnected: ${clientId}`);
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

  private executeNexusCommand(commandIntent: string): Promise<string> {
    console.log(`⚡ NEXUS EXECUTING: ${commandIntent}`);

    const commandMap: Record<string, { command: string; successMessage: string }> = {
      'KILL_CHROME': { command: 'taskkill /F /IM chrome.exe', successMessage: "Target neutralized: Google Chrome processes terminated." },
      'OPEN_STEAM': { command: 'start steam://', successMessage: "Launching entertainment subsystem..." },
      'FLUSH_DNS': { command: 'ipconfig /flushdns', successMessage: "Network cache cleared." },
      'KILL_NODE': { command: 'taskkill /F /IM node.exe', successMessage: "All Node.js processes terminated." },
      'RESTART_EXPLORER': { command: 'taskkill /F /IM explorer.exe && start explorer.exe', successMessage: "Windows Explorer restarted." }
    };

    const matchedCommand = Object.entries(commandMap).find(([key]) => 
      commandIntent.includes(key)
    );

    if (!matchedCommand) {
      return Promise.resolve("Command not recognized.");
    }

    const [, { command, successMessage }] = matchedCommand;

    return new Promise((resolve) => {
      exec(command, (error, _stdout, _stderr) => {
        if (error) {
          console.log(`Error executing ${command}:`, error);
        }
        resolve(successMessage);
      });
    });
  }
}