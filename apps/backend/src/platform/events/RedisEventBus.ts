// @ts-nocheck - ioredis not yet installed
// import Redis from 'ioredis';
import { logger } from '../../utils/logger.js';

// Placeholder type until ioredis is installed
type Redis = any;

export interface EventHandler {
    (event: any): void | Promise<void>;
}

/**
 * Redis-based Event Bus for distributed event handling
 * Replaces in-memory EventEmitter for production resilience
 */
export class RedisEventBus {
    private redis: Redis;
    private subscriber: Redis;
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private isInitialized = false;

    constructor(redisUrl?: string) {
        const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

        this.redis = new Redis(url, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.subscriber = new Redis(url);

        this.redis.on('error', (err) => {
            logger.error('Redis Publisher Error:', { error: err.message });
        });

        this.subscriber.on('error', (err) => {
            logger.error('Redis Subscriber Error:', { error: err.message });
        });
    }

    /**
     * Initialize the event bus (setup subscriptions)
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        this.subscriber.on('message', (channel, message) => {
            this.handleMessage(channel, message);
        });

        this.isInitialized = true;
        logger.info('🔴 RedisEventBus initialized');
    }

    /**
     * Emit an event (Publish to Redis)
     */
    async emit(eventType: string, payload: any): Promise<void> {
        try {
            const message = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });
            await this.redis.publish(`widgetdc:events:${eventType}`, message);
        } catch (error: any) {
            logger.error(`Failed to emit event ${eventType}:`, { error: error.message });
        }
    }

    /**
     * Subscribe to an event (Subscribe to Redis channel)
     */
    onEvent(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
            // Subscribe to Redis channel
            this.subscriber.subscribe(`widgetdc:events:${eventType}`).catch((err) => {
                logger.error(`Failed to subscribe to ${eventType}:`, { error: err.message });
            });
        }

        this.handlers.get(eventType)!.add(handler);
    }

    /**
     * Unsubscribe from an event
     */
    offEvent(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
                this.subscriber.unsubscribe(`widgetdc:events:${eventType}`);
            }
        }
    }

    /**
     * Handle incoming message from Redis
     */
    private handleMessage(channel: string, message: string): void {
        try {
            const { eventType, payload } = JSON.parse(message);
            const handlers = this.handlers.get(eventType);

            if (handlers) {
                handlers.forEach(async (handler) => {
                    try {
                        await handler(payload);
                    } catch (error: any) {
                        logger.error(`Event handler error for ${eventType}:`, { error: error.message });
                    }
                });
            }
        } catch (error: any) {
            logger.error('Failed to parse Redis message:', { error: error.message, channel, message });
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        logger.info('Shutting down RedisEventBus...');
        await this.subscriber.quit();
        await this.redis.quit();
    }
}

// Singleton instance
let eventBusInstance: RedisEventBus | null = null;

export function getRedisEventBus(): RedisEventBus {
    if (!eventBusInstance) {
        eventBusInstance = new RedisEventBus();
    }
    return eventBusInstance;
}
