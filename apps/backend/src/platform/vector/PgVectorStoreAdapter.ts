import { getDatabaseAdapter } from '../../platform/db/PrismaDatabaseAdapter.js';
import { logger } from '../../utils/logger.js';

interface VectorRecord {
    id: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    namespace?: string;
}

interface VectorQuery {
    vector?: number[];
    limit?: number;
    filter?: Record<string, any>;
    namespace?: string;
}

interface VectorSearchResult {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    similarity: number;
}

/**
 * PgVector Store Adapter
 * Replaces ChromaDB with PostgreSQL pgvector extension
 */
export class PgVectorStoreAdapter {
    private db = getDatabaseAdapter();
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await this.db.initialize();

        logger.info('🧠 PgVector Store initialized');
        this.isInitialized = true;
    }

    /**
     * Upsert a vector document
     */
    async upsert(record: VectorRecord): Promise<void> {
        const prisma = this.db.getClient();

        const embeddingStr = record.embedding
            ? `[${record.embedding.join(',')}]`
            : null;

        await prisma.$executeRawUnsafe(`
      INSERT INTO vector_documents (id, content, embedding, metadata, namespace, "userId", "orgId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4::jsonb, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE SET 
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        "updatedAt" = NOW()
    `,
            record.id,
            record.content,
            embeddingStr,
            JSON.stringify(record.metadata || {}),
            record.namespace || 'default',
            record.metadata?.userId || 'system',
            record.metadata?.orgId || 'default'
        );
    }

    /**
     * Batch upsert vector documents
     */
    async batchUpsert(options: { records: VectorRecord[]; namespace?: string }): Promise<void> {
        for (const record of options.records) {
            await this.upsert({
                ...record,
                namespace: options.namespace || record.namespace,
            });
        }

        logger.info(`📦 Batch upserted ${options.records.length} vectors`);
    }

    /**
     * Search for similar vectors using cosine similarity
     */
    async search(query: VectorQuery): Promise<VectorSearchResult[]> {
        if (!query.vector) {
            throw new Error('Vector is required for similarity search');
        }

        const prisma = this.db.getClient();
        const vectorStr = `[${query.vector.join(',')}]`;
        const limit = query.limit || 10;
        const namespace = query.namespace || 'default';

        const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id,
        content,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM vector_documents
      WHERE namespace = $2
        AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, vectorStr, namespace, limit);

        return results.map(r => ({
            id: r.id,
            content: r.content,
            metadata: r.metadata,
            similarity: parseFloat(r.similarity),
        }));
    }

    /**
     * Delete a vector document
     */
    async delete(id: string): Promise<void> {
        const prisma = this.db.getClient();
        await prisma.vectorDocument.delete({ where: { id } });
    }

    /**
     * Delete all vectors in a namespace
     */
    async deleteNamespace(namespace: string): Promise<void> {
        const prisma = this.db.getClient();
        await prisma.vectorDocument.deleteMany({ where: { namespace } });
        logger.info(`🗑️  Deleted namespace: ${namespace}`);
    }

    /**
     * Get statistics
     */
    async getStatistics(): Promise<{ totalRecords: number; namespaces: string[] }> {
        const prisma = this.db.getClient();

        const totalRecords = await prisma.vectorDocument.count();
        const namespaces = await prisma.vectorDocument.findMany({
            select: { namespace: true },
            distinct: ['namespace'],
        });

        return {
            totalRecords,
            namespaces: namespaces.map(n => n.namespace),
        };
    }
}

// Singleton instance
let vectorStoreInstance: PgVectorStoreAdapter | null = null;

export function getPgVectorStore(): PgVectorStoreAdapter {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new PgVectorStoreAdapter();
    }
    return vectorStoreInstance;
}
