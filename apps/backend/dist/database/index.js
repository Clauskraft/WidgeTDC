/**
 * Database initialization using Prisma
 * Migrated from sql.js to Prisma for production-ready PostgreSQL support
 */
import { prisma } from './prisma.js';
let isInitialized = false;
/**
 * Initialize database connection via Prisma
 * No need for schema.sql - Prisma handles migrations
 */
export async function initializeDatabase() {
    if (isInitialized)
        return;
    try {
        // Test Prisma connection
        await prisma.$connect();
        console.log('✅ Prisma database connected successfully');
        isInitialized = true;
    }
    catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}
/**
 * Get database - throws if not initialized
 * @deprecated Use Prisma client directly instead of getDatabase()
 */
export function getDatabase() {
    if (!isInitialized) {
        throw new Error('Database not initialized! Call initializeDatabase() first.');
    }
    // Return a stub that throws - code should use Prisma directly
    return {
        prepare: () => {
            throw new Error('getDatabase() is deprecated. Use Prisma client directly.');
        },
        run: () => {
            throw new Error('getDatabase() is deprecated. Use Prisma client directly.');
        },
        close: () => {
            prisma.$disconnect();
        }
    };
}
export async function closeDatabase() {
    await prisma.$disconnect();
    isInitialized = false;
}
// Re-export prisma for convenience
export { prisma } from './prisma.js';
