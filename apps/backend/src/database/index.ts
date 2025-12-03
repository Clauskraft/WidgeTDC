/**
 * Database initialization using Prisma
 * Migrated from sql.js to Prisma for production-ready PostgreSQL support
 */

import { prisma } from './prisma.js';

// Legacy interface for backward compatibility
export interface DatabaseStatement<P = any[], R = any> {
  all: (...params: P extends any[] ? P : any[]) => R[];
  get: (...params: P extends any[] ? P : any[]) => R | undefined;
  run: (...params: P extends any[] ? P : any[]) => { changes: number; lastInsertRowid: number | bigint };
  free: () => void;
}

export interface Database {
  prepare: <P = any[], R = any>(sql: string) => DatabaseStatement<P, R>;
  run: (sql: string, params?: any[]) => { changes: number; lastInsertRowid: number | bigint };
  close: () => void;
}

let isInitialized = false;

/**
 * Initialize database connection via Prisma
 * No need for schema.sql - Prisma handles migrations
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;

  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Prisma database connected successfully');
    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Get database - throws if not initialized
 * @deprecated Use Prisma client directly instead of getDatabase()
 */
export function getDatabase(): Database {
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

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
  isInitialized = false;
}

// Re-export prisma for convenience
export { prisma } from './prisma.js';
