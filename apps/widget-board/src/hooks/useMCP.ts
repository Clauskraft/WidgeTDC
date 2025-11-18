import { useState, useCallback } from 'react';

export interface MCPMessage {
  id: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: any;
  createdAt: string;
}

export const useMCP = () => {
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(async (targetId: string, tool: string, payload: any = {}) => {
    const message: MCPMessage = {
      id: crypto.randomUUID(),
      sourceId: 'widget', // Or dynamic widget ID
      targetId,
      tool,
      payload,
      createdAt: new Date().toISOString(),
    };

    setIsLoading(true);
    try {
      const response = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error(`MCP error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MCP send failed:', error);
      throw error; // Re-throw for widget handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { send, isLoading };
};
