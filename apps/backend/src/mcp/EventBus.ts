import { EventEmitter } from 'events';
import { RedisEventBus, getRedisEventBus } from '../platform/events/RedisEventBus.js';

export type EventType =
    | 'system.alert'
    | 'security.alert'
    | 'agent.decision'
    | 'agent.log'
    | 'mcp.tool.executed'
    | 'autonomous.task.executed'
    | 'taskrecorder.suggestion.created'
    | 'taskrecorder.suggestion.approved'
    | 'taskrecorder.execution.started'
    | 'data:ingested';

export interface BaseEvent {
    type: EventType;
    timestamp: string;
    source: string;
    payload: any;
}

/**
 * Unified Event Bus Interface
 * Uses RedisEventBus in production for persistence and scalability
 * Falls back to in-memory EventEmitter in development
 */
class MCPEventBus extends EventEmitter {
    private redis?: RedisEventBus;
    private useRedis: boolean;

    constructor() {
        super();

        // Use Redis in production, in-memory in development
        this.useRedis = process.env.NODE_ENV === 'production' && !!process.env.REDIS_URL;

        if (this.useRedis) {
            this.redis = getRedisEventBus();
            console.log('🔴 Using Redis Event Bus (persistent)');
        } else {
            console.log('💾 Using In-Memory Event Bus (development)');
        }
    }

    async initialize(): Promise<void> {
        if (this.redis) {
            await this.redis.initialize();
        }
    }

    emitEvent(event: BaseEvent) {
        if (this.useRedis && this.redis) {
            // Emit via Redis
            this.redis.emit(event.type, event.payload).catch(err => {
                console.error('Redis emit failed, falling back to memory:', err);
                this.emit(event.type, event);
            });
        } else {
            // Emit in-memory
            this.emit(event.type, event);
            this.emit('*', event); // Catch-all
        }
    }

    // Direct emit for convenience (for non-BaseEvent objects)
    emit(type: EventType | '*', ...args: any[]): boolean {
        if (this.useRedis && this.redis && type !== '*') {
            // Emit via Redis (fire and forget)
            this.redis.emit(type as string, args[0]).catch(console.error);
        }
        return super.emit(type, ...args);
    }

    onEvent(type: EventType | '*', listener: (event: BaseEvent | any) => void) {
        if (this.useRedis && this.redis && type !== '*') {
            // Subscribe via Redis
            this.redis.onEvent(type as string, listener);
        }
        // Also subscribe in-memory for local events
        this.on(type, listener);
    }

    async shutdown(): Promise<void> {
        if (this.redis) {
            await this.redis.shutdown();
        }
    }
}

export const eventBus = new MCPEventBus();
