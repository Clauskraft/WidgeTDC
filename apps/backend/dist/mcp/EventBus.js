import { EventEmitter } from 'events';
import { getRedisEventBus } from '../platform/events/RedisEventBus.js';
/**
 * Unified Event Bus Interface
 * Uses RedisEventBus in production for persistence and scalability
 * Falls back to in-memory EventEmitter in development
 */
class MCPEventBus extends EventEmitter {
    constructor() {
        super();
        // Use Redis in production, in-memory in development
        this.useRedis = process.env.NODE_ENV === 'production' && !!process.env.REDIS_URL;
        if (this.useRedis) {
            this.redis = getRedisEventBus();
            console.log('🔴 Using Redis Event Bus (persistent)');
        }
        else {
            console.log('💾 Using In-Memory Event Bus (development)');
        }
    }
    async initialize() {
        if (this.redis) {
            await this.redis.initialize();
        }
    }
    emitEvent(event) {
        if (this.useRedis && this.redis) {
            // Emit via Redis
            this.redis.emit(event.type, event.payload).catch(err => {
                console.error('Redis emit failed, falling back to memory:', err);
                this.emit(event.type, event);
            });
        }
        else {
            // Emit in-memory
            this.emit(event.type, event);
            this.emit('*', event); // Catch-all
        }
    }
    // Direct emit for convenience (for non-BaseEvent objects)
    emit(type, ...args) {
        if (this.useRedis && this.redis && type !== '*') {
            // Emit via Redis (fire and forget)
            this.redis.emit(type, args[0]).catch(console.error);
        }
        return super.emit(type, ...args);
    }
    onEvent(type, listener) {
        if (this.useRedis && this.redis && type !== '*') {
            // Subscribe via Redis
            this.redis.onEvent(type, listener);
        }
        // Also subscribe in-memory for local events
        this.on(type, listener);
    }
    async shutdown() {
        if (this.redis) {
            await this.redis.shutdown();
        }
    }
}
export const eventBus = new MCPEventBus();
