/**
 * In-Memory Vector Store Adapter
 * 
 * Development implementation of VectorStoreAdapter with cosine similarity search,
 * metadata filtering, and optional keyword boosting for hybrid search.
 */

import type {
  VectorStoreAdapter,
  VectorRecord,
  VectorRecordId,
  VectorNamespace,
  VectorQuery,
  VectorSearchResult,
  VectorBatchUpsert,
  VectorBatchDelete,
  VectorStoreStatistics,
  MetadataFilter,
  VectorEmbedding,
} from './types';

/**
 * In-memory implementation of VectorStoreAdapter
 */
export class InMemoryVectorStoreAdapter implements VectorStoreAdapter {
  private records: Map<string, VectorRecord> = new Map();

  /**
   * Generate storage key from ID and namespace
   */
  private getKey(id: VectorRecordId, namespace?: VectorNamespace): string {
    return namespace ? `${namespace}::${id}` : id;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: VectorEmbedding, b: VectorEmbedding): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Compute Euclidean distance between two vectors
   */
  private euclideanDistance(a: VectorEmbedding, b: VectorEmbedding): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Compute dot product between two vectors
   */
  private dotProduct(a: VectorEmbedding, b: VectorEmbedding): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Compute similarity score based on metric
   */
  private computeSimilarity(
    query: VectorEmbedding,
    candidate: VectorEmbedding,
    metric: 'cosine' | 'euclidean' | 'dot-product' = 'cosine'
  ): number {
    switch (metric) {
      case 'cosine':
        return this.cosineSimilarity(query, candidate);
      case 'euclidean':
        // Convert distance to similarity score (0-1)
        const distance = this.euclideanDistance(query, candidate);
        return 1 / (1 + distance);
      case 'dot-product':
        return this.dotProduct(query, candidate);
      default:
        return this.cosineSimilarity(query, candidate);
    }
  }

  /**
   * Simple keyword matching score (BM25-like)
   */
  private computeKeywordScore(content: string, keywords: string): number {
    const contentLower = content.toLowerCase();
    const keywordTokens = keywords.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const token of keywordTokens) {
      if (contentLower.includes(token)) {
        matches++;
      }
    }

    return keywordTokens.length > 0 ? matches / keywordTokens.length : 0;
  }

  /**
   * Check if record matches metadata filters
   */
  private matchesFilters(record: VectorRecord, filters: MetadataFilter[]): boolean {
    for (const filter of filters) {
      const value = record.metadata[filter.field];
      
      switch (filter.operator) {
        case 'eq':
          if (value !== filter.value) return false;
          break;
        case 'ne':
          if (value === filter.value) return false;
          break;
        case 'gt':
          if (typeof value !== 'number' || value <= (filter.value as number)) return false;
          break;
        case 'gte':
          if (typeof value !== 'number' || value < (filter.value as number)) return false;
          break;
        case 'lt':
          if (typeof value !== 'number' || value >= (filter.value as number)) return false;
          break;
        case 'lte':
          if (typeof value !== 'number' || value > (filter.value as number)) return false;
          break;
        case 'in':
          if (!Array.isArray(filter.value) || !filter.value.includes(value as any)) return false;
          break;
        case 'nin':
          if (!Array.isArray(filter.value) || filter.value.includes(value as any)) return false;
          break;
        case 'contains':
          if (typeof value !== 'string' || !value.includes(filter.value as string)) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  async upsert(record: Omit<VectorRecord, 'createdAt' | 'updatedAt'>): Promise<VectorRecord> {
    const key = this.getKey(record.id, record.namespace);
    const existing = this.records.get(key);
    
    const now = new Date();
    const completeRecord: VectorRecord = {
      ...record,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.records.set(key, completeRecord);
    return completeRecord;
  }

  async batchUpsert(operation: VectorBatchUpsert): Promise<VectorRecord[]> {
    const results: VectorRecord[] = [];
    
    for (const record of operation.records) {
      const recordWithNamespace = {
        ...record,
        namespace: record.namespace || operation.namespace,
      };
      const result = await this.upsert(recordWithNamespace);
      results.push(result);
    }

    return results;
  }

  async search(query: VectorQuery): Promise<VectorSearchResult[]> {
    const metric = query.metric || 'cosine';
    const results: VectorSearchResult[] = [];

    // Filter records by namespace
    let candidates = Array.from(this.records.values());
    if (query.namespace) {
      candidates = candidates.filter(r => r.namespace === query.namespace);
    }

    // Apply metadata filters
    if (query.filters && query.filters.length > 0) {
      candidates = candidates.filter(r => this.matchesFilters(r, query.filters!));
    }

    // Compute scores
    for (const candidate of candidates) {
      const vectorScore = this.computeSimilarity(query.embedding, candidate.embedding, metric);
      
      let finalScore = vectorScore;
      let keywordScore: number | undefined;

      // Hybrid search with keywords
      if (query.keywords && candidate.content) {
        keywordScore = this.computeKeywordScore(candidate.content, query.keywords);
        const keywordWeight = query.keywordWeight ?? 0.5;
        finalScore = (1 - keywordWeight) * vectorScore + keywordWeight * keywordScore;
      }

      // Apply minimum score threshold
      if (query.minScore && finalScore < query.minScore) {
        continue;
      }

      results.push({
        record: candidate,
        score: finalScore,
        explanation: query.keywords ? {
          vectorScore,
          keywordScore,
        } : { vectorScore },
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, query.topK);
  }

  async getById(id: VectorRecordId, namespace?: VectorNamespace): Promise<VectorRecord | undefined> {
    const key = this.getKey(id, namespace);
    return this.records.get(key);
  }

  async deleteById(id: VectorRecordId, namespace?: VectorNamespace): Promise<boolean> {
    const key = this.getKey(id, namespace);
    return this.records.delete(key);
  }

  async batchDelete(operation: VectorBatchDelete): Promise<number> {
    let deleted = 0;
    
    for (const id of operation.ids) {
      const success = await this.deleteById(id, operation.namespace);
      if (success) deleted++;
    }

    return deleted;
  }

  async deleteNamespace(namespace: VectorNamespace): Promise<number> {
    let deleted = 0;
    
    for (const [key, record] of this.records.entries()) {
      if (record.namespace === namespace) {
        this.records.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  async listNamespaces(): Promise<VectorNamespace[]> {
    const namespaces = new Set<VectorNamespace>();
    
    for (const record of this.records.values()) {
      if (record.namespace) {
        namespaces.add(record.namespace);
      }
    }

    return Array.from(namespaces);
  }

  async getStatistics(): Promise<VectorStoreStatistics> {
    const byNamespace: Record<VectorNamespace, number> = {};
    let vectorDimension: number | undefined;
    
    for (const record of this.records.values()) {
      if (record.namespace) {
        byNamespace[record.namespace] = (byNamespace[record.namespace] || 0) + 1;
      }
      if (!vectorDimension && record.embedding.length > 0) {
        vectorDimension = record.embedding.length;
      }
    }

    // Rough estimate of storage size
    const estimatedSize = this.records.size * 1024; // 1KB per record estimate

    return {
      totalRecords: this.records.size,
      byNamespace,
      vectorDimension,
      estimatedSize,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
