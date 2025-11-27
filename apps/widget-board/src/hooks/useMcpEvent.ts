import { useEffect, useCallback, useRef } from 'react';
import { mcpEventBus } from '../mcp/MCPEventBus';
import { MCPEvent, MCPEventHandler } from '../mcp/MCPTypes';

/**
 * Hook for subscribing to MCP events
 * Automatically unsubscribes on unmount
 */
export function useMcpEvent(
  eventType: string | null,
  handler: MCPEventHandler,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  
  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!eventType) return;

    const wrappedHandler: MCPEventHandler = (event: MCPEvent) => {
      handlerRef.current(event);
    };

    // Subscribe to event
    const unsubscribe = mcpEventBus.on(eventType, wrappedHandler);

    // Cleanup on unmount or when eventType changes
    return () => {
      unsubscribe();
    };
  }, [eventType, ...deps]);
}

/**
 * Hook for subscribing to all MCP events
 */
export function useMcpEventAll(
  handler: MCPEventHandler,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  
  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler: MCPEventHandler = (event: MCPEvent) => {
      handlerRef.current(event);
    };

    // Subscribe to all events
    const unsubscribe = mcpEventBus.onAll(wrappedHandler);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [...deps]);
}

/**
 * Hook that returns a function to emit MCP events
 */
export function useMcpEmit() {
  return useCallback((event: MCPEvent) => {
    mcpEventBus.emit(event);
  }, []);
}

/**
 * Hook that returns MCP event bus stats for debugging
 */
export function useMcpStats() {
  return useCallback((eventType?: string) => {
    return mcpEventBus.getSubscriberCount(eventType);
  }, []);
}

export default useMcpEvent;
