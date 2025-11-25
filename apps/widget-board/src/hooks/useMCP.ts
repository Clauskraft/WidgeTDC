import { useState, useCallback } from 'react';

export interface MCPMessage {
  id: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: any;
  createdAt: string;
}

export interface SendMCPOptions {
  sourceId?: string;
  routePath?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  messageId?: string;
}

export const useMCP = () => {
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(
    async (targetId: string, tool: string, payload: any = {}, options?: SendMCPOptions) => {
      const message: MCPMessage = {
        id: options?.messageId ?? crypto.randomUUID(),
        sourceId: options?.sourceId ?? 'widget', // Or dynamic widget ID
        targetId,
        tool,
        payload,
        createdAt: new Date().toISOString(),
      };

      setIsLoading(true);
      try {
        // Use relative path to leverage Vite proxy in dev and same-origin in prod
        let route = options?.routePath ?? '/api/mcp/route';

        // In test environment (Vitest/JSDOM), relative URLs might fail if origin is not set
        // We can check if we are in a test environment or if window.location.origin is available
        if (typeof window !== 'undefined' && window.location.origin === 'null') {
          // Fallback for JSDOM if origin is null
          route = `http://localhost:3000${route}`;
        }

        const response = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
          },
          body: JSON.stringify(message),
          signal: options?.signal,
        });
        if (!response.ok) throw new Error(`MCP error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('MCP send failed:', error);
        throw error; // Re-throw for widget handling
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { send, isLoading };
};
