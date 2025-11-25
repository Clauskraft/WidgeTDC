import { getDatabaseAdapter } from '../../platform/db/PrismaDatabaseAdapter.js';
import { getDatabase } from '../../database/index.js';
import { logger } from '../../utils/logger.js';
import { getEmbeddingService } from '../../services/embeddings/EmbeddingService.js';

interface VectorRecord {
    id: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    namespace?: string;
}

interface VectorQuery {
    vector?: number[];
    text?: string;
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
 * PgVector Store Adapter with Automatic Embedding Generation
 * Supports PostgreSQL (pgvector) and SQLite (fallback)
 */
export class PgVectorStoreAdapter {
    private dbAdapter = getDatabaseAdapter();
    private embeddings = getEmbeddingService();
    private isInitialized = false;
    private useSQLite = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await this.dbAdapter.initialize();
        await this.embeddings.initialize();

        // Check if Prisma is available
        const prisma = this.dbAdapter.getClient();
        if (!prisma) {
            this.useSQLite = true;
            logger.warn('⚠️  Prisma not available. Using SQLite fallback for Vector Store (slow search).');
            // Ensure SQLite DB is initialized
            try {
                getDatabase();
            } catch (e) {
                // If not initialized, it should have been by the main index.ts, but let's be safe
                logger.error('SQLite database not initialized for vector store fallback.');
            }
        }

        logger.info(`🧠 Vector Store initialized (${this.embeddings.getProviderName()}, ${this.embeddings.getDimensions()}D) [Mode: ${this.useSQLite ? 'SQLite' : 'Postgres'}]`);
        this.isInitialized = true;
    }

    /**
     * Upsert a vector document (auto-generates embeddings)
     */
    async upsert(record: VectorRecord): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        // Auto-generate embedding if not provided
        let embedding = record.embedding;
        if (!embedding && record.content) {
            embedding = await this.embeddings.generateEmbedding(record.content);
            logger.debug(`Generated embedding for "${record.content.substring(0, 50)}..."`);
        }

        if (this.useSQLite) {
            const db = getDatabase() as any;
            // Use raw sql.js prepare/run
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO vector_documents (id, content, embedding, metadata, namespace, "updatedAt")
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run([
                record.id,
                record.content,
                JSON.stringify(embedding || []),
                JSON.stringify(record.metadata || {}),
                record.namespace || 'default'
            ]);
            stmt.free();
        } else {
            const prisma = this.dbAdapter.getClient();
            const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

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
    }

    /**
     * Batch upsert vector documents
     */
    async batchUpsert(options: { records: VectorRecord[]; namespace?: string }): Promise<void> {
        if (!this.isInitialized) await this.initialize();
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
        if (!this.isInitialized) await this.initialize();
        let searchVector = query.vector;

        // Generate embedding from text if no vector provided
        if (!searchVector && query.text) {
            searchVector = await this.embeddings.generateEmbedding(query.text);
        }

        if (!searchVector) {
            throw new Error('Either vector or text is required for similarity search');
        }

        const limit = query.limit || 10;
        const namespace = query.namespace || 'default';

        if (this.useSQLite) {
            const db = getDatabase() as any;
            const stmt = db.prepare(`SELECT id, content, embedding, metadata FROM vector_documents WHERE namespace = ?`);
            stmt.bind([namespace]);

            const rows: any[] = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();

            const results = rows.map(row => {
                const embedding = JSON.parse(row.embedding || '[]');
                const similarity = this.cosineSimilarity(searchVector!, embedding);
                return {
                    id: row.id,
                    content: row.content,
                    metadata: JSON.parse(row.metadata || '{}'),
                    similarity
                };
            });

            // Sort by similarity desc and take top N
            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

        } else {
            const prisma = this.dbAdapter.getClient();
            const vectorStr = `[${searchVector.join(',')}]`;

            const results: any[] = await prisma.$queryRawUnsafe(`
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
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length || vecA.length === 0) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Delete a vector document
     */
    async delete(id: string): Promise<void> {
        if (!this.isInitialized) await this.initialize();
        if (this.useSQLite) {
            const db = getDatabase() as any;
            const stmt = db.prepare('DELETE FROM vector_documents WHERE id = ?');
            stmt.run([id]);
            stmt.free();
        } else {
            const prisma = this.dbAdapter.getClient();
            await prisma.vectorDocument.delete({ where: { id } });
        }
    }

    /**
     * Delete all vectors in a namespace
     */
    async deleteNamespace(namespace: string): Promise<void> {
        if (!this.isInitialized) await this.initialize();
        if (this.useSQLite) {
            const db = getDatabase() as any;
            const stmt = db.prepare('DELETE FROM vector_documents WHERE namespace = ?');
            stmt.run([namespace]);
            stmt.free();
        } else {
            const prisma = this.dbAdapter.getClient();
            await prisma.vectorDocument.deleteMany({ where: { namespace } });
        }
        logger.info(`🗑️  Deleted namespace: ${namespace}`);
    }

    /**
     * Get statistics
     */
    async getStatistics(): Promise<{ totalRecords: number; namespaces: string[] }> {
        if (!this.isInitialized) await this.initialize();
        if (this.useSQLite) {
            const db = getDatabase() as any;

            const countStmt = db.prepare('SELECT COUNT(*) as count FROM vector_documents');
            let countResult: any = { count: 0 };
            if (countStmt.step()) {
                countResult = countStmt.getAsObject();
            }
            countStmt.free();

            const nsStmt = db.prepare('SELECT DISTINCT namespace FROM vector_documents');
            const nsResult: any[] = [];
            while (nsStmt.step()) {
                nsResult.push(nsStmt.getAsObject());
            }
            nsStmt.free();

            return {
                totalRecords: countResult.count,
                namespaces: nsResult.map(r => r.namespace),
            };
        } else {
            const prisma = this.dbAdapter.getClient();
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
}

// Singleton instance
let vectorStoreInstance: PgVectorStoreAdapter | null = null;

export function getPgVectorStore(): PgVectorStoreAdapter {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new PgVectorStoreAdapter();
    }
    return vectorStoreInstance;
}
