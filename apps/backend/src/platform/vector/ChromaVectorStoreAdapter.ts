import { getPgVectorStore, PgVectorStoreAdapter } from './PgVectorStoreAdapter.js';

/**
 * Compatibility Adapter for ChromaDB → PgVector Migration
 * Provides the old ChromaDB API while using PgVector underneath
 * This allows existing code to work without changes
 */
export class ChromaVectorStoreAdapter {
  private pgVector: PgVectorStoreAdapter;

  constructor() {
    this.pgVector = getPgVectorStore();
  }

  async initialize(): Promise<void> {
    await this.pgVector.initialize();
  }

  async upsert(record: any): Promise<void> {
    await this.pgVector.upsert(record);
  }

  async batchUpsert(records: any[]): Promise<void> {
    await this.pgVector.batchUpsert({ records });
  }

  async search(options: any): Promise<any[]> {
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

  async getById(id: string, namespace?: string): Promise<any | null> {
    // PgVector doesn't have getById, so we need to query by id
    // For now, return null
    // TODO: Implement id-based lookup
    console.warn('getById not yet implemented for PgVector');
    return null;
  }

  async delete(id: string): Promise<void> {
    await this.pgVector.delete(id);
  }

  async deleteNamespace(namespace: string): Promise<void> {
    await this.pgVector.deleteNamespace(namespace);
  }

  async listNamespaces(): Promise<string[]> {
    const stats = await this.pgVector.getStatistics();
    return stats.namespaces;
  }

  async getStatistics(): Promise<any> {
    const stats = await this.pgVector.getStatistics();
    return {
      totalRecords: stats.totalRecords,
      byNamespace: {}, // TODO: Implement per-namespace stats
      estimatedSize: stats.totalRecords * 1000, // Rough estimate
      vectorDimension: 768 // HuggingFace default
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pgVector.getStatistics();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let chromaAdapterInstance: ChromaVectorStoreAdapter | null = null;

export function getChromaVectorStore(): ChromaVectorStoreAdapter {
  if (!chromaAdapterInstance) {
    chromaAdapterInstance = new ChromaVectorStoreAdapter();
  }
  return chromaAdapterInstance;
}
