/**
 * Prisma Database Adapter
 *
 * Production-grade database adapter using Prisma ORM.
 * As of Prisma 5.10.0+, ARM64 Windows is fully supported.
 */
import { logger } from '../../utils/logger.js';
/**
 * Check if PostgreSQL is configured
 */
function hasPostgresConfig() {
    return !!process.env.DATABASE_URL;
}
/**
 * Stub adapter for when Prisma is unavailable
 * Returns graceful no-ops and uses SQLite as fallback
 */
class StubDatabaseAdapter {
    constructor(reason) {
        this.reason = reason;
    }
    async initialize() {
        logger.info(`ℹ️  PostgreSQL skipped: ${this.reason}`);
        logger.info('   System will use SQLite + Neo4j (fully functional)');
    }
    async disconnect() {
        // No-op
    }
    async query(_sql, _params) {
        throw new Error(`PostgreSQL not available: ${this.reason}. Use SQLite for local operations.`);
    }
    async transaction(_fn) {
        throw new Error(`PostgreSQL not available: ${this.reason}. Use SQLite for local operations.`);
    }
    isAvailable() {
        return false;
    }
    getClient() {
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
class PrismaDatabaseAdapterImpl {
    constructor() {
        this.prisma = null;
        this.isInitialized = false;
        this.loadError = null;
        // Prisma loading is deferred to initialize()
    }
    async initialize() {
        if (this.isInitialized)
            return;
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
            // Enable pgvector extension if available (optional - we use Neo4j for vectors now)
            try {
                await this.prisma.$executeRaw `CREATE EXTENSION IF NOT EXISTS vector`;
                logger.info('🔢 pgvector extension enabled');
            }
            catch (_extError) {
                // Non-critical - Railway PostgreSQL doesn't have pgvector
                // We use Neo4j as primary vector store instead
                logger.info('ℹ️  pgvector not available (using Neo4j for vector operations)');
            }
            this.isInitialized = true;
        }
        catch (error) {
            this.loadError = error.message;
            logger.warn('⚠️  Prisma/PostgreSQL initialization failed:', { error: error.message });
            logger.info('   Continuing with SQLite + Neo4j (fully functional)');
            // Don't throw - allow graceful fallback
        }
    }
    async disconnect() {
        if (this.prisma && this.isInitialized) {
            await this.prisma.$disconnect();
            logger.info('🗄️  Prisma Database disconnected');
        }
    }
    async query(sql, params) {
        if (!this.prisma || !this.isInitialized) {
            throw new Error('PostgreSQL not connected. Use SQLite for local operations.');
        }
        return this.prisma.$queryRawUnsafe(sql, ...(params || []));
    }
    async transaction(fn) {
        if (!this.prisma || !this.isInitialized) {
            throw new Error('PostgreSQL not connected. Use SQLite for local operations.');
        }
        return this.prisma.$transaction(fn);
    }
    isAvailable() {
        return this.isInitialized && this.prisma !== null;
    }
    getClient() {
        return this.prisma;
    }
}
// Singleton instance
let dbInstance = null;
/**
 * Get the database adapter (singleton)
 *
 * Returns:
 * - StubAdapter if DATABASE_URL is not configured
 * - PrismaDatabaseAdapterImpl otherwise (supports all platforms including ARM64 Windows)
 */
export function getDatabaseAdapter() {
    if (!dbInstance) {
        if (!hasPostgresConfig()) {
            dbInstance = new StubDatabaseAdapter('DATABASE_URL not configured');
        }
        else {
            dbInstance = new PrismaDatabaseAdapterImpl();
        }
    }
    return dbInstance;
}
// Export type alias for compatibility
export { PrismaDatabaseAdapterImpl as PrismaDatabaseAdapter };
