// @ts-nocheck - ioredis not yet installed
import { logger } from '../../utils/logger.js';

// Placeholder type until ioredis is installed
type RedisClient = any;

export interface EventHandler {
    (event: any): void | Promise<void>;
}

/**
 * Redis-based Event Bus for distributed event handling
 * Replaces in-memory EventEmitter for production resilience
 * 
 * NOTE: Requires ioredis to be installed:
 * npm install ioredis
 */
export class RedisEventBus {
    private redis: RedisClient | null = null;
    private subscriber: RedisClient | null = null;
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private isInitialized = false;
    private isAvailable = false;
    private redisUrl: string;

    constructor(redisUrl?: string) {
        this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    }

    /**
     * Dynamically initialize Redis connection
     * Bug 4 Fix: Only attempt Redis connection when explicitly initialized
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Dynamic import to avoid runtime error if ioredis not installed
            const Redis = (await import('ioredis')).default;
            
            this.redis = new Redis(this.redisUrl, {
                retryStrategy: (times: number) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });

            this.subscriber = new Redis(this.redisUrl);

            this.redis.on('error', (err: any) => {
                logger.error('Redis Publisher Error:', { error: err.message });
            });

            this.subscriber.on('error', (err: any) => {
                logger.error('Redis Subscriber Error:', { error: err.message });
            });

            this.subscriber.on('message', (channel: string, message: string) => {
                this.handleMessage(channel, message);
            });

            this.isAvailable = true;
            this.isInitialized = true;
            logger.info('🔴 RedisEventBus initialized');
        } catch (error: any) {
            logger.warn('⚠️  Redis not available, using in-memory fallback:', error.message);
            this.isAvailable = false;
            this.isInitialized = true; // Mark as initialized to prevent retries
        }
    }

    /**
     * Emit an event (Publish to Redis or in-memory)
     */
    async emit(eventType: string, payload: any): Promise<void> {
        const message = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });

        if (this.isAvailable && this.redis) {
            try {
                await this.redis.publish(`widgetdc:events:${eventType}`, message);
            } catch (error: any) {
                logger.error(`Failed to emit event ${eventType}:`, { error: error.message });
            }
        } else {
            // In-memory fallback: directly call handlers
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
        }
    }

    /**
     * Subscribe to an event (Subscribe to Redis channel or in-memory)
     */
    onEvent(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
            
            // Subscribe to Redis channel if available
            if (this.isAvailable && this.subscriber) {
                this.subscriber.subscribe(`widgetdc:events:${eventType}`).catch((err: any) => {
                    logger.error(`Failed to subscribe to ${eventType}:`, { error: err.message });
                });
            }
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
                if (this.isAvailable && this.subscriber) {
                    this.subscriber.unsubscribe(`widgetdc:events:${eventType}`);
                }
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
     * Check if Redis is available
     */
    isRedisAvailable(): boolean {
        return this.isAvailable;
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
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
let eventBusInstance: RedisEventBus | null = null;

export function getRedisEventBus(): RedisEventBus {
    if (!eventBusInstance) {
        eventBusInstance = new RedisEventBus();
    }
    return eventBusInstance;
}
