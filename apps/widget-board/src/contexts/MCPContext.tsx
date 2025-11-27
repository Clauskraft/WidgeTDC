import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mcpEventBus } from '../mcp/MCPEventBus';
import { MCPMessage, MCPResponse, MCPEvent, MCPConnection, MCPTool } from '../mcp/MCPTypes';

interface MCPContextValue {
  connection: MCPConnection | null;
  tools: MCPTool[];
  isConnected: boolean;
  
  // Actions
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Omit<MCPMessage, 'id' | 'timestamp'>) => Promise<MCPResponse>;
  getTools: () => Promise<MCPTool[]>;
}

const MCPContext = createContext<MCPContextValue | null>(null);

export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within MCPProvider');
  }
  return context;
};

interface MCPProviderProps {
  children: ReactNode;
  defaultUrl?: string;
}

export const MCPProvider: React.FC<MCPProviderProps> = ({ 
  children, 
  defaultUrl = 'ws://localhost:3001/mcp' 
}) => {
  const [connection, setConnection] = useState<MCPConnection | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = async (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const websocket = new WebSocket(url);
        
        websocket.onopen = () => {
          const newConnection: MCPConnection = {
            id: `conn-${Date.now()}`,
            url,
            connected: true,
            lastActivity: Date.now(),
          };
          
          setConnection(newConnection);
          setIsConnected(true);
          setWs(websocket);
          
          // Emit connected event
          mcpEventBus.emit({
            type: 'connected',
            data: newConnection,
            timestamp: Date.now(),
          });
          
          resolve();
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          
          mcpEventBus.emit({
            type: 'error',
            data: { error: 'WebSocket error' },
            timestamp: Date.now(),
          });
          
          reject(error);
        };

        websocket.onclose = () => {
          setIsConnected(false);
          setConnection(null);
          
          mcpEventBus.emit({
            type: 'disconnected',
            data: {},
            timestamp: Date.now(),
          });
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'response') {
              mcpEventBus.emit({
                type: 'response',
                data: data as MCPResponse,
                timestamp: Date.now(),
              });
            } else {
              mcpEventBus.emit({
                type: 'message',
                data: data as MCPMessage,
                timestamp: Date.now(),
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setConnection(null);
    setIsConnected(false);
  };

  const sendMessage = async (
    message: Omit<MCPMessage, 'id' | 'timestamp'>
  ): Promise<MCPResponse> => {
    return new Promise((resolve, reject) => {
      if (!ws || !isConnected) {
        reject(new Error('Not connected to MCP server'));
        return;
      }

      const fullMessage: MCPMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };

      // Set up response listener
      const unsubscribe = mcpEventBus.on('response', (event: MCPEvent) => {
        const response = event.data as MCPResponse;
        if (response.id === fullMessage.id) {
          unsubscribe();
          resolve(response);
        }
      });

      // Send message
      ws.send(JSON.stringify(fullMessage));

      // Emit message event
      mcpEventBus.emit({
        type: 'message',
        data: fullMessage,
        timestamp: Date.now(),
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Request timeout'));
      }, 30000);
    });
  };

  const getTools = async (): Promise<MCPTool[]> => {
    try {
      const response = await fetch('/api/mcp/tools');
      const tools = await response.json();
      setTools(tools);
      return tools;
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (defaultUrl) {
      connect(defaultUrl).catch(console.error);
    }
    
    return () => {
      disconnect();
    };
  }, [defaultUrl]);

  const value: MCPContextValue = {
    connection,
    tools,
    isConnected,
    connect,
    disconnect,
    sendMessage,
    getTools,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

export default MCPContext;
