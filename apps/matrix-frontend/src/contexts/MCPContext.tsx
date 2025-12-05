/**
 * MCP Context - WebSocket connection to WidgetTDC Backend
 * Provides real-time communication with MCP server
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MCPMessage, MCPResponse, MCPTool, MCPConnection } from '../types/mcp';

interface MCPContextValue {
  connection: MCPConnection | null;
  tools: MCPTool[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Omit<MCPMessage, 'id' | 'timestamp'>) => Promise<MCPResponse>;
  callTool: (toolName: string, params?: Record<string, unknown>) => Promise<MCPResponse>;
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
  autoConnect?: boolean;
}

export const MCPProvider: React.FC<MCPProviderProps> = ({ 
  children, 
  defaultUrl = 'ws://localhost:3001/mcp',
  autoConnect = true 
}) => {
  const [connection, setConnection] = useState<MCPConnection | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pendingRequests] = useState(new Map<string, { resolve: (value: MCPResponse) => void; reject: (error: Error) => void }>());

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const connect = useCallback(async (url: string = defaultUrl): Promise<void> => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);

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
          setIsConnecting(false);
          setWs(websocket);
          console.log('✅ MCP Connected to', url);
          resolve();
        };

        websocket.onerror = (err) => {
          console.error('❌ MCP WebSocket error:', err);
          setIsConnected(false);
          setIsConnecting(false);
          setError('WebSocket connection error');
          reject(new Error('WebSocket error'));
        };

        websocket.onclose = () => {
          setIsConnected(false);
          setConnection(null);
          setWs(null);
          console.log('🔌 MCP Disconnected');
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as MCPResponse;
            const pending = pendingRequests.get(data.id);
            if (pending) {
              pending.resolve(data);
              pendingRequests.delete(data.id);
            }
          } catch (e) {
            console.error('Failed to parse MCP message:', e);
          }
        };
      } catch (err) {
        setIsConnecting(false);
        setError((err as Error).message);
        reject(err);
      }
    });
  }, [defaultUrl, isConnected, isConnecting, pendingRequests]);


  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setConnection(null);
    setIsConnected(false);
  }, [ws]);

  const sendMessage = useCallback(async (message: Omit<MCPMessage, 'id' | 'timestamp'>): Promise<MCPResponse> => {
    if (!ws || !isConnected) {
      throw new Error('Not connected to MCP server');
    }

    const fullMessage: MCPMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      pendingRequests.set(fullMessage.id, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(fullMessage.id)) {
          pendingRequests.delete(fullMessage.id);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      ws.send(JSON.stringify(fullMessage));
    });
  }, [ws, isConnected, pendingRequests]);

  const callTool = useCallback(async (toolName: string, params?: Record<string, unknown>): Promise<MCPResponse> => {
    return sendMessage({
      type: 'tool_call',
      tool: toolName,
      params,
    });
  }, [sendMessage]);

  const getTools = useCallback(async (): Promise<MCPTool[]> => {
    const response = await sendMessage({ type: 'query', params: { action: 'list_tools' } });
    if (response.success && Array.isArray(response.data)) {
      setTools(response.data as MCPTool[]);
      return response.data as MCPTool[];
    }
    return [];
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect().catch(console.error);
    }
    return () => disconnect();
  }, [autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: MCPContextValue = {
    connection,
    tools,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    callTool,
    getTools,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

export default MCPContext;
