/**
 * Prisma Database Adapter
 *
 * Production-grade database adapter using Prisma ORM.
 * As of Prisma 5.10.0+, ARM64 Windows is fully supported.
 */
import { logger } from '../../utils/logger.js';

// Type definitions
export type PrismaClient = any;

/**
 * Check if PostgreSQL is configured
 */
function hasPostgresConfig(): boolean {
    return !!process.env.DATABASE_URL;
}

/**
 * Database Adapter Interface
 * Generic interface for database operations
 */
export interface DatabaseAdapter {
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any>;
    transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
    isAvailable(): boolean;
}

/**
 * Stub adapter for when Prisma is unavailable
 * Returns graceful no-ops and uses SQLite as fallback
 */
class StubDatabaseAdapter implements DatabaseAdapter {
    private reason: string;

    constructor(reason: string) {
        this.reason = reason;
    }

    async initialize(): Promise<void> {
        logger.info(`ℹ️  PostgreSQL skipped: ${this.reason}`);
        logger.info('   System will use SQLite + Neo4j (fully functional)');
    }

    async disconnect(): Promise<void> {
        // No-op
    }

    async query(_sql: string, _params?: any[]): Promise<any> {
        throw new Error(`PostgreSQL not available: ${this.reason}. Use SQLite for local operations.`);
    }

    async transaction<T>(_fn: (tx: any) => Promise<T>): Promise<T> {
        throw new Error(`PostgreSQL not available: ${this.reason}. Use SQLite for local operations.`);
    }

    isAvailable(): boolean {
        return false;
    }

    getClient(): null {
        return null;
    }
}

/**
 * Prisma Database Adapter
 * Production-grade database adapter using Prisma ORM
 *
 * Only loads Prisma when:
 * 1. NOT on Windows ARM64 (no native binaries available)
 * 2. DATABASE_URL is configured
 */
class PrismaDatabaseAdapterImpl implements DatabaseAdapter {
    private prisma: any = null;
    private isInitialized = false;
    private loadError: string | null = null;

    constructor() {
        // Prisma loading is deferred to initialize()
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Dynamic import to defer binary loading
            const { PrismaClient } = await import('@prisma/client');

            this.prisma = new PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['info', 'warn', 'error']
                    : ['error'],
            });

            await this.prisma.$connect();
            logger.info('🗄️  Prisma Database connected to PostgreSQL');

            // Enable pgvector extension if available
            try {
                await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
                logger.info('🔢 pgvector extension enabled');
            } catch (_extError: any) {
                // Non-critical - pgvector might not be installed
            }

            this.isInitialized = true;
        } catch (error: any) {
            this.loadError = error.message;
            logger.warn('⚠️  Prisma/PostgreSQL initialization failed:', { error: error.message });
            logger.info('   Continuing with SQLite + Neo4j (fully functional)');
            // Don't throw - allow graceful fallback
        }
    }

    async disconnect(): Promise<void> {
        if (this.prisma && this.isInitialized) {
            await this.prisma.$disconnect();
            logger.info('🗄️  Prisma Database disconnected');
        }
    }

    async query(sql: string, params?: any[]): Promise<any> {
        if (!this.prisma || !this.isInitialized) {
            throw new Error('PostgreSQL not connected. Use SQLite for local operations.');
        }
        return this.prisma.$queryRawUnsafe(sql, ...(params || []));
    }

    async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
        if (!this.prisma || !this.isInitialized) {
            throw new Error('PostgreSQL not connected. Use SQLite for local operations.');
        }
        return this.prisma.$transaction(fn);
    }

    isAvailable(): boolean {
        return this.isInitialized && this.prisma !== null;
    }

    getClient(): any {
        return this.prisma;
    }
}

// Singleton instance
let dbInstance: DatabaseAdapter | null = null;

/**
 * Get the database adapter (singleton)
 *
 * Returns:
 * - StubAdapter if DATABASE_URL is not configured
 * - PrismaDatabaseAdapterImpl otherwise (supports all platforms including ARM64 Windows)
 */
export function getDatabaseAdapter(): DatabaseAdapter & { getClient(): any } {
    if (!dbInstance) {
        if (!hasPostgresConfig()) {
            dbInstance = new StubDatabaseAdapter('DATABASE_URL not configured');
        } else {
            dbInstance = new PrismaDatabaseAdapterImpl();
        }
    }
    return dbInstance as DatabaseAdapter & { getClient(): any };
}

// Export type alias for compatibility
export { PrismaDatabaseAdapterImpl as PrismaDatabaseAdapter };
