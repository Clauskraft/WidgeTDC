import { MCPEvent, MCPEventHandler } from './MCPTypes';

/**
 * Simple EventBus implementation for MCP events
 * Allows widgets to subscribe to and emit MCP events
 */
class MCPEventBus {
  private handlers: Map<string, Set<MCPEventHandler>> = new Map();
  private globalHandlers: Set<MCPEventHandler> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on(eventType: string, handler: MCPEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(handler: MCPEventHandler): () => void {
    this.globalHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: MCPEvent): void {
    // Call type-specific handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in MCP event handler:', error);
        }
      });
    }

    // Call global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in global MCP event handler:', error);
      }
    });
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size || 0;
    }
    let total = this.globalHandlers.size;
    this.handlers.forEach(set => total += set.size);
    return total;
  }
}

// Export singleton instance
export const mcpEventBus = new MCPEventBus();
export default mcpEventBus;
