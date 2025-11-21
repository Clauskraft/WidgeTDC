import { useEffect } from 'react';
import { useMCP } from './MCPContext';

/**
 * A custom hook for widgets to easily subscribe to MCP events.
 * It automatically handles subscribing on mount and unsubscribing on unmount.
 *
 * @param eventName The event to listen for.
 * @param callback The function to execute when the event is published.
 */
export const useMcpEvent = (
    eventName: string,
    callback: (payload?: any) => void
) => {
    const mcp = useMCP();

    useEffect(() => {
        const unsubscribe = mcp.subscribe(eventName, callback);
        return () => unsubscribe();
    }, [mcp, eventName, callback]);
};