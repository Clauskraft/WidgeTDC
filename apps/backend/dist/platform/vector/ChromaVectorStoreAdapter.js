import { getPgVectorStore } from './PgVectorStoreAdapter.js';
/**
 * Compatibility Adapter for ChromaDB → PgVector Migration
 * Provides the old ChromaDB API while using PgVector underneath
 * This allows existing code to work without changes
 */
export class ChromaVectorStoreAdapter {
    constructor() {
        this.pgVector = getPgVectorStore();
    }
    async initialize() {
        await this.pgVector.initialize();
    }
    async upsert(record) {
        await this.pgVector.upsert(record);
    }
    async batchUpsert(records) {
        await this.pgVector.batchUpsert({ records });
    }
    async search(options) {
        // Handle text-based queries (semantic search)
        if (options.query && typeof options.query === 'string') {
            const results = await this.pgVector.search({
                text: options.query,
                limit: options.limit || options.topK || 10,
                namespace: options.namespace,
                filter: options.filter
            });
            // Convert to old format
            return results.map(r => ({
                id: r.id,
                content: r.content,
                metadata: r.metadata,
                score: r.similarity,
                record: { content: r.content, metadata: r.metadata }
            }));
        }
        // Handle vector-based queries
        if (options.vector || options.embedding) {
            const results = await this.pgVector.search({
                vector: options.vector || options.embedding,
                limit: options.limit || options.topK || 10,
                namespace: options.namespace,
                filter: options.filter
            });
            // Convert to old format
            return results.map(r => ({
                id: r.id,
                content: r.content,
                metadata: r.metadata,
                score: r.similarity, // Map similarity to score
                record: { content: r.content, metadata: r.metadata }
            }));
        }
        return [];
    }
    async getById(id, namespace) {
        // PgVector doesn't have getById, so we need to query by id
        // For now, return null
        // TODO: Implement id-based lookup
        console.warn('getById not yet implemented for PgVector');
        return null;
    }
    async delete(id) {
        await this.pgVector.delete(id);
    }
    async deleteNamespace(namespace) {
        await this.pgVector.deleteNamespace(namespace);
    }
    async listNamespaces() {
        const stats = await this.pgVector.getStatistics();
        return stats.namespaces;
    }
    async getStatistics() {
        const stats = await this.pgVector.getStatistics();
        return {
            totalRecords: stats.totalRecords,
            byNamespace: {}, // TODO: Implement per-namespace stats
            estimatedSize: stats.totalRecords * 1000, // Rough estimate
            vectorDimension: 768 // HuggingFace default
        };
    }
    async healthCheck() {
        try {
            await this.pgVector.getStatistics();
            return true;
        }
        catch {
            return false;
        }
    }
}
// Singleton instance
let chromaAdapterInstance = null;
export function getChromaVectorStore() {
    if (!chromaAdapterInstance) {
        chromaAdapterInstance = new ChromaVectorStoreAdapter();
    }
    return chromaAdapterInstance;
}
