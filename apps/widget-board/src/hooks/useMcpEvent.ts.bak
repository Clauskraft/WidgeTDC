import { useEffect, useCallback, useRef } from 'react';
import { mcpEventBus } from '../../mcp/MCPEventBus';
import { MCPEvent, MCPEventHandler } from '../../mcp/MCPTypes';

export function useMcpEvent(
  eventType: string | null,
  handler: MCPEventHandler,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!eventType) return;
    const wrappedHandler: MCPEventHandler = (event: MCPEvent) => {
      handlerRef.current(event);
    };
    const unsubscribe = mcpEventBus.on(eventType, wrappedHandler);
    return () => {
      unsubscribe();
    };
  }, [eventType, ...deps]);
}

export function useMcpEventAll(
  handler: MCPEventHandler,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler: MCPEventHandler = (event: MCPEvent) => {
      handlerRef.current(event);
    };
    const unsubscribe = mcpEventBus.onAll(wrappedHandler);
    return () => {
      unsubscribe();
    };
  }, [...deps]);
}

export function useMcpEmit() {
  return useCallback((event: MCPEvent) => {
    mcpEventBus.emit(event);
  }, []);
}

export default useMcpEvent;
