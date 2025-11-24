// @ts-nocheck - Prisma client not yet installed
// import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

// PrismaClient type placeholder - will be replaced when @prisma/client is installed
export type PrismaClient = any;

/**
 * Database Adapter Interface
 * Generic interface for database operations
 */
export interface DatabaseAdapter {
    initialize(): Promise<void>;
    disconnect(): Promise<void>;

    // Generic query methods
    query(sql: string, params?: any[]): Promise<any>;
    transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}

/**
 * Prisma Database Adapter
 * Production-grade database adapter using Prisma ORM
 * 
 * NOTE: Requires @prisma/client to be installed:
 * npm install @prisma/client
 * npx prisma generate
 */
export class PrismaDatabaseAdapter implements DatabaseAdapter {
    private prisma: any; // PrismaClient - will be typed when installed
    private isInitialized = false;

    constructor() {
        // Prisma client initialization - uncomment when @prisma/client is installed
        // this.prisma = new PrismaClient({
        //     log: process.env.NODE_ENV === 'development'
        //         ? ['query', 'info', 'warn', 'error']
        //         : ['error'],
        // });
        this.prisma = null;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Bug 3 Fix: Check if Prisma client is available before connecting
        if (!this.prisma) {
            logger.warn('⚠️  Prisma client not initialized. Install @prisma/client and run npx prisma generate');
            logger.info('   Continuing without PostgreSQL - using SQLite fallback');
            return; // Gracefully skip if Prisma not available
        }

        try {
            await this.prisma.$connect();
            logger.info('🗄️  Prisma Database connected');

            // Enable pgvector extension
            await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;

            this.isInitialized = true;
        } catch (error: any) {
            logger.error('Failed to initialize Prisma:', { error: error.message });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
        logger.info('🗄️  Prisma Database disconnected');
    }

    async query(sql: string, params?: any[]): Promise<any> {
        return this.prisma.$queryRawUnsafe(sql, ...(params || []));
    }

    async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
        return this.prisma.$transaction(fn);
    }

    /**
     * Get Prisma client for direct access
     */
    getClient(): PrismaClient {
        return this.prisma;
    }
}

// Singleton instance
let dbInstance: PrismaDatabaseAdapter | null = null;

export function getDatabaseAdapter(): PrismaDatabaseAdapter {
    if (!dbInstance) {
        dbInstance = new PrismaDatabaseAdapter();
    }
    return dbInstance;
}
