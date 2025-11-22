type McpEventCallback = (payload?: any) => void;

/**
 * The core of the Meta-Communication Protocol.
 * A simple, type-safe event bus for cross-widget communication.
 */
export class MCPEventBus {
    private subscribers: Map<string, Set<McpEventCallback>>;

    constructor() {
        this.subscribers = new Map();
    }

    /**
     * Subscribes a callback to a specific event.
     * @param eventName The name of the event to subscribe to (e.g., 'EmailSelected').
     * @param callback The function to execute when the event is published.
     * @returns A function to unsubscribe.
     */
    subscribe(eventName: string, callback: McpEventCallback): () => void {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }
        this.subscribers.get(eventName)!.add(callback);

        return () => this.subscribers.get(eventName)?.delete(callback);
    }

    /**
     * Publishes an event to all subscribers.
     * @param eventName The name of the event to publish.
     * @param payload The data to send with the event.
     */
    publish(eventName: string, payload?: any): void {
        this.subscribers.get(eventName)?.forEach((callback) => callback(payload));
    }
}