/**
 * Unified Vector Store Factory
 *
 * Selects the appropriate vector store backend based on VECTOR_PROVIDER env var.
 * Defaults to Neo4j (recommended for this project as Railway PostgreSQL lacks pgvector).
 *
 * Supported providers:
 * - 'neo4j' (default) - Uses Neo4j's native vector indexing
 * - 'pgvector' - Uses PostgreSQL with pgvector extension
 * - 'chroma' - Legacy ChromaDB compatibility layer (wraps pgvector)
 */

import { logger } from '../../utils/logger.js';

// Common interface for all vector stores
export interface VectorRecord {
    id: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    namespace?: string;
}

export interface VectorQuery {
    vector?: number[];
    text?: string;
    limit?: number;
    filter?: Record<string, any>;
    namespace?: string;
}

export interface VectorSearchResult {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    similarity: number;
}

export interface VectorStoreStatistics {
    totalRecords: number;
    namespaces: string[];
    perNamespace: Record<string, number>;
    initialized: boolean;
    backend: 'neo4j' | 'pgvector' | 'chroma';
}

export interface IVectorStore {
    initialize(): Promise<void>;
    upsert(record: VectorRecord): Promise<void>;
    batchUpsert(options: { records: VectorRecord[]; namespace?: string }): Promise<void>;
    search(query: VectorQuery): Promise<VectorSearchResult[]>;
    getStatistics(): Promise<VectorStoreStatistics>;
}

type VectorProvider = 'neo4j' | 'pgvector' | 'chroma';

let cachedVectorStore: IVectorStore | null = null;
let cachedProvider: VectorProvider | null = null;

/**
 * Get the configured vector store provider
 */
export function getVectorProvider(): VectorProvider {
    const provider = (process.env.VECTOR_PROVIDER || 'neo4j').toLowerCase() as VectorProvider;

    if (!['neo4j', 'pgvector', 'chroma'].includes(provider)) {
        logger.warn(`Unknown VECTOR_PROVIDER "${provider}", defaulting to neo4j`);
        return 'neo4j';
    }

    return provider;
}

/**
 * Get the unified vector store instance
 *
 * Uses singleton pattern - returns same instance for same provider
 */
export async function getVectorStore(): Promise<IVectorStore> {
    const provider = getVectorProvider();

    // Return cached instance if provider hasn't changed
    if (cachedVectorStore && cachedProvider === provider) {
        return cachedVectorStore;
    }

    logger.info(`🔌 Initializing vector store: ${provider}`);

    switch (provider) {
        case 'neo4j': {
            const { getNeo4jVectorStore } = await import('./Neo4jVectorStoreAdapter.js');
            const store = getNeo4jVectorStore();
            await store.initialize();
            cachedVectorStore = store as IVectorStore;
            break;
        }
        case 'pgvector': {
            const { getPgVectorStore } = await import('./PgVectorStoreAdapter.js');
            const store = getPgVectorStore();
            await store.initialize();
            cachedVectorStore = store as unknown as IVectorStore;
            break;
        }
        case 'chroma': {
            const { getChromaVectorStore } = await import('./ChromaVectorStoreAdapter.js');
            const store = getChromaVectorStore();
            await store.initialize();
            cachedVectorStore = store as unknown as IVectorStore;
            break;
        }
    }

    cachedProvider = provider;
    logger.info(`✅ Vector store initialized: ${provider}`);

    return cachedVectorStore!;
}

/**
 * Get vector store synchronously (must be initialized first)
 *
 * @throws Error if not initialized
 */
export function getVectorStoreSync(): IVectorStore {
    if (!cachedVectorStore) {
        throw new Error('Vector store not initialized. Call getVectorStore() first.');
    }
    return cachedVectorStore;
}

// Re-export individual adapters for direct access if needed
export { getNeo4jVectorStore, Neo4jVectorStoreAdapter } from './Neo4jVectorStoreAdapter.js';
export { getPgVectorStore, PgVectorStoreAdapter } from './PgVectorStoreAdapter.js';
export { getChromaVectorStore, ChromaVectorStoreAdapter } from './ChromaVectorStoreAdapter.js';
