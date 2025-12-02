// @ts-nocheck - ioredis not yet installed
import { logger } from '../../utils/logger.js';
/**
 * Redis-based Event Bus for distributed event handling
 * Replaces in-memory EventEmitter for production resilience
 *
 * NOTE: Requires ioredis to be installed:
 * npm install ioredis
 */
export class RedisEventBus {
    constructor(redisUrl) {
        this.redis = null;
        this.subscriber = null;
        this.handlers = new Map();
        this.isInitialized = false;
        this.isAvailable = false;
        this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    }
    /**
     * Dynamically initialize Redis connection
     * Bug 4 Fix: Only attempt Redis connection when explicitly initialized
     */
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Dynamic import to avoid runtime error if ioredis not installed
            const Redis = (await import('ioredis')).default;
            this.redis = new Redis(this.redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });
            this.subscriber = new Redis(this.redisUrl);
            this.redis.on('error', (err) => {
                logger.error('Redis Publisher Error:', { error: err.message });
            });
            this.subscriber.on('error', (err) => {
                logger.error('Redis Subscriber Error:', { error: err.message });
            });
            this.subscriber.on('message', (channel, message) => {
                this.handleMessage(channel, message);
            });
            this.isAvailable = true;
            this.isInitialized = true;
            logger.info('🔴 RedisEventBus initialized');
        }
        catch (error) {
            logger.warn('⚠️  Redis not available, using in-memory fallback:', error.message);
            this.isAvailable = false;
            this.isInitialized = true; // Mark as initialized to prevent retries
        }
    }
    /**
     * Emit an event (Publish to Redis or in-memory)
     */
    async emit(eventType, payload) {
        const message = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });
        if (this.isAvailable && this.redis) {
            try {
                await this.redis.publish(`widgetdc:events:${eventType}`, message);
            }
            catch (error) {
                logger.error(`Failed to emit event ${eventType}:`, { error: error.message });
            }
        }
        else {
            // In-memory fallback: directly call handlers
            const handlers = this.handlers.get(eventType);
            if (handlers) {
                handlers.forEach(async (handler) => {
                    try {
                        await handler(payload);
                    }
                    catch (error) {
                        logger.error(`Event handler error for ${eventType}:`, { error: error.message });
                    }
                });
            }
        }
    }
    /**
     * Subscribe to an event (Subscribe to Redis channel or in-memory)
     */
    onEvent(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
            // Subscribe to Redis channel if available
            if (this.isAvailable && this.subscriber) {
                this.subscriber.subscribe(`widgetdc:events:${eventType}`).catch((err) => {
                    logger.error(`Failed to subscribe to ${eventType}:`, { error: err.message });
                });
            }
        }
        this.handlers.get(eventType).add(handler);
    }
    /**
     * Unsubscribe from an event
     */
    offEvent(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
                if (this.isAvailable && this.subscriber) {
                    this.subscriber.unsubscribe(`widgetdc:events:${eventType}`);
                }
            }
        }
    }
    /**
     * Handle incoming message from Redis
     */
    handleMessage(channel, message) {
        try {
            const { eventType, payload } = JSON.parse(message);
            const handlers = this.handlers.get(eventType);
            if (handlers) {
                handlers.forEach(async (handler) => {
                    try {
                        await handler(payload);
                    }
                    catch (error) {
                        logger.error(`Event handler error for ${eventType}:`, { error: error.message });
                    }
                });
            }
        }
        catch (error) {
            logger.error('Failed to parse Redis message:', { error: error.message, channel, message });
        }
    }
    /**
     * Check if Redis is available
     */
    isRedisAvailable() {
        return this.isAvailable;
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger.info('Shutting down RedisEventBus...');
        if (this.subscriber) {
            await this.subscriber.quit();
        }
        if (this.redis) {
            await this.redis.quit();
        }
    }
}
// Singleton instance
let eventBusInstance = null;
export function getRedisEventBus() {
    if (!eventBusInstance) {
        eventBusInstance = new RedisEventBus();
    }
    return eventBusInstance;
}
