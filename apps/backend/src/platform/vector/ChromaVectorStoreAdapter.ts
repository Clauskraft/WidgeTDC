/**
 * ChromaDB Vector Store Adapter
 * 
 * Persistent vector database adapter using ChromaDB for knowledge archive (vidensarkiv)
 * Integrates with HuggingFace embeddings for continuous learning and expansion
 */

import { ChromaClient } from 'chromadb';
import { HfInference } from '@huggingface/inference';
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
} from './types.js';

interface ChromaCollection {
  add: (params: {
    ids: string[];
    embeddings?: number[][];
    documents?: string[];
    metadatas?: any[];
  }) => Promise<void>;
  query: (params: {
    queryEmbeddings?: number[][];
    queryTexts?: string[];
    nResults: number;
    where?: any;
  }) => Promise<{
    ids: string[][];
    embeddings: number[][];
    documents: string[][];
    metadatas: any[][];
    distances: number[][];
  }>;
  get: (params?: { ids?: string[]; where?: any }) => Promise<{
    ids: string[][];
    embeddings: number[][];
    documents: string[][];
    metadatas: any[][];
  }>;
  delete: (params: { ids?: string[]; where?: any }) => Promise<void>;
  count: () => Promise<number>;
}

export class ChromaVectorStoreAdapter implements VectorStoreAdapter {
  private client: ChromaClient;
  private collection: ChromaCollection | null = null;
  private hfInference: HfInference;
  private embeddingModel: string = 'sentence-transformers/all-MiniLM-L6-v2';
  private collectionName: string = 'vidensarkiv';
  private initialized: boolean = false;

  constructor() {
    // Initialize ChromaDB client (embedded mode by default)
    const chromaPath = process.env.CHROMA_PATH || './chroma_db';
    const chromaHost = process.env.CHROMA_HOST;
    
    if (chromaHost) {
      this.client = new ChromaClient({
        path: chromaHost
      });
    } else {
      // Embedded mode - runs locally
      this.client = new ChromaClient({
        path: chromaPath
      });
    }

    // Initialize HuggingFace inference for embeddings
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    this.hfInference = new HfInference(hfApiKey);
    
    console.log('📚 [ChromaDB] Initialized with collection:', this.collectionName);
  }

  /**
   * Initialize collection (create if doesn't exist)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          description: 'WidgeTDC Knowledge Archive - Continuously expanding knowledge base',
          created: new Date().toISOString()
        }
      });

      this.initialized = true;
      console.log('✅ [ChromaDB] Collection initialized:', this.collectionName);
    } catch (error) {
      console.error('❌ [ChromaDB] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Generate embedding using HuggingFace
   */
  private async generateEmbedding(text: string): Promise<VectorEmbedding> {
    try {
      const response = await this.hfInference.featureExtraction({
        model: this.embeddingModel,
        inputs: text
      });

      // Response is array of numbers (embedding vector)
      if (Array.isArray(response) && typeof response[0] === 'number') {
        return response as VectorEmbedding;
      }
      
      // If response is nested array, flatten it
      if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0] as VectorEmbedding;
      }

      throw new Error('Unexpected embedding format');
    } catch (error) {
      console.error('[ChromaDB] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Convert ChromaDB metadata filter to ChromaDB where clause
   */
  private convertFilters(filters?: MetadataFilter[]): any {
    if (!filters || filters.length === 0) return undefined;

    const where: any = {};

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = { $eq: filter.value };
          break;
        case 'ne':
          where[filter.field] = { $ne: filter.value };
          break;
        case 'gt':
          where[filter.field] = { $gt: filter.value };
          break;
        case 'gte':
          where[filter.field] = { $gte: filter.value };
          break;
        case 'lt':
          where[filter.field] = { $lt: filter.value };
          break;
        case 'lte':
          where[filter.field] = { $lte: filter.value };
          break;
        case 'in':
          where[filter.field] = { $in: filter.value as string[] };
          break;
        case 'nin':
          where[filter.field] = { $nin: filter.value as string[] };
          break;
        case 'contains':
          where[filter.field] = { $contains: filter.value };
          break;
      }
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }

  /**
   * Upsert a vector record
   */
  async upsert(record: Omit<VectorRecord, 'createdAt' | 'updatedAt'>): Promise<VectorRecord> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    // Generate embedding if not provided
    let embedding = record.embedding;
    if (!embedding && record.content) {
      embedding = await this.generateEmbedding(record.content);
    }

    if (!embedding) {
      throw new Error('Embedding required - provide embedding or content');
    }

    // Prepare metadata with namespace
    const metadata: any = {
      ...record.metadata,
      namespace: record.namespace || 'default',
      updatedAt: new Date().toISOString()
    };

    // Check if record exists to preserve createdAt
    const existing = await this.getById(record.id, record.namespace);
    if (existing) {
      metadata.createdAt = existing.createdAt.toISOString();
    } else {
      metadata.createdAt = new Date().toISOString();
    }

    // Upsert to ChromaDB
    await this.collection.add({
      ids: [record.id],
      embeddings: [embedding],
      documents: record.content ? [record.content] : undefined,
      metadatas: [metadata]
    });

    return {
      id: record.id,
      embedding,
      content: record.content,
      metadata,
      namespace: record.namespace,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Batch upsert multiple records
   */
  async batchUpsert(operation: VectorBatchUpsert): Promise<VectorRecord[]> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const results: VectorRecord[] = [];
    const batchSize = 100; // ChromaDB batch limit

    for (let i = 0; i < operation.records.length; i += batchSize) {
      const batch = operation.records.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const embeddings: VectorEmbedding[] = [];
      const documents: string[] = [];
      const ids: string[] = [];
      const metadatas: any[] = [];

      for (const record of batch) {
        ids.push(record.id);
        
        let embedding = record.embedding;
        if (!embedding && record.content) {
          embedding = await this.generateEmbedding(record.content);
        }
        if (!embedding) {
          throw new Error(`Embedding required for record ${record.id}`);
        }
        embeddings.push(embedding);

        if (record.content) {
          documents.push(record.content);
        }

        const metadata: any = {
          ...record.metadata,
          namespace: record.namespace || operation.namespace || 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        metadatas.push(metadata);
      }

      // Upsert batch
      await this.collection.add({
        ids,
        embeddings,
        documents: documents.length > 0 ? documents : undefined,
        metadatas
      });

      // Create result records
      for (let j = 0; j < batch.length; j++) {
        results.push({
          id: ids[j],
          embedding: embeddings[j],
          content: batch[j].content,
          metadata: metadatas[j],
          namespace: batch[j].namespace || operation.namespace,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    console.log(`✅ [ChromaDB] Batch upserted ${results.length} records`);
    return results;
  }

  /**
   * Search for similar vectors
   */
  async search(query: VectorQuery): Promise<VectorSearchResult[]> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    // Generate query embedding if not provided
    let queryEmbedding = query.embedding;
    if (!queryEmbedding && query.keywords) {
      queryEmbedding = await this.generateEmbedding(query.keywords);
    }

    if (!queryEmbedding) {
      throw new Error('Query embedding or keywords required');
    }

    // Convert filters
    let where = this.convertFilters(query.filters);
    
    // Add namespace filter if specified
    if (query.namespace) {
      const namespaceFilter = { namespace: { $eq: query.namespace } };
      if (where) {
        where.$and = where.$and || [];
        where.$and.push(namespaceFilter);
      } else {
        // Create new where object with namespace filter
        where = namespaceFilter;
      }
    }

    // Query ChromaDB
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: query.topK,
      where: where || undefined
    });

    // Convert to VectorSearchResult format
    const searchResults: VectorSearchResult[] = [];

    // Handle ChromaDB result structure (embeddings can be nested)
    const ids = results.ids[0] || [];
    const distances = results.distances[0] || [];
    const metadatas = results.metadatas[0] || [];
    const documents = results.documents[0] || [];
    const embeddings = Array.isArray(results.embeddings[0]) ? results.embeddings[0] : (results.embeddings[0] ? [results.embeddings[0]] : []);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const distance = distances[i];
      const metadata = metadatas[i];
      const document = documents[i];
      const embedding = Array.isArray(embeddings[i]) ? embeddings[i] : [];

      // Convert distance to similarity score (ChromaDB uses distance, we want similarity)
      // Cosine distance: 0 = identical, 2 = opposite
      // Similarity: 1 - (distance / 2)
      const similarity = query.metric === 'cosine' 
        ? Math.max(0, 1 - (distance / 2))
        : 1 - Math.min(1, distance);

      // Apply minimum score threshold
      if (query.minScore && similarity < query.minScore) {
        continue;
      }

      // Hybrid search: combine with keyword score if provided
      let finalScore = similarity;
      if (query.keywords && document) {
        const keywordScore = this.computeKeywordScore(document, query.keywords);
        const keywordWeight = query.keywordWeight ?? 0.3;
        finalScore = (1 - keywordWeight) * similarity + keywordWeight * keywordScore;
      }

      searchResults.push({
        record: {
          id,
          embedding: embedding || [],
          content: document,
          metadata: metadata || {},
          namespace: metadata?.namespace as string,
          createdAt: metadata?.createdAt ? new Date(metadata.createdAt) : new Date(),
          updatedAt: metadata?.updatedAt ? new Date(metadata.updatedAt) : new Date()
        },
        score: finalScore,
        explanation: {
          vectorScore: similarity,
          keywordScore: query.keywords && document ? this.computeKeywordScore(document, query.keywords) : undefined
        }
      });
    }

    // Sort by score descending
    searchResults.sort((a, b) => b.score - a.score);

    return searchResults;
  }

  /**
   * Compute keyword score for hybrid search
   */
  private computeKeywordScore(text: string, keywords: string): number {
    const textLower = text.toLowerCase();
    const keywordsLower = keywords.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const keyword of keywordsLower) {
      if (keyword.length > 2 && textLower.includes(keyword)) {
        matches++;
      }
    }
    
    return matches / keywordsLower.length;
  }

  /**
   * Get record by ID
   */
  async getById(id: VectorRecordId, namespace?: VectorNamespace): Promise<VectorRecord | undefined> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const where: any = {};
    if (namespace) {
      where.namespace = { $eq: namespace };
    }

    const results = await this.collection.get({
      ids: [id],
      where: Object.keys(where).length > 0 ? where : undefined
    });

    if (results.ids.length === 0 || results.ids[0].length === 0) {
      return undefined;
    }

    const idx = 0;
    const metadata = results.metadatas[0]?.[idx] || {};
    const document = results.documents[0]?.[idx];
    const embedding = results.embeddings[0]?.[idx] || [];

    return {
      id: results.ids[0][idx],
      embedding,
      content: document,
      metadata,
      namespace: metadata.namespace as string,
      createdAt: metadata.createdAt ? new Date(metadata.createdAt) : new Date(),
      updatedAt: metadata.updatedAt ? new Date(metadata.updatedAt) : new Date()
    };
  }

  /**
   * Delete record by ID
   */
  async deleteById(id: VectorRecordId, namespace?: VectorNamespace): Promise<boolean> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const where: any = {};
    if (namespace) {
      where.namespace = { $eq: namespace };
    }

    await this.collection.delete({
      ids: [id],
      where: Object.keys(where).length > 0 ? where : undefined
    });

    return true;
  }

  /**
   * Batch delete multiple records
   */
  async batchDelete(operation: VectorBatchDelete): Promise<number> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const where: any = {};
    if (operation.namespace) {
      where.namespace = { $eq: operation.namespace };
    }

    await this.collection.delete({
      ids: operation.ids,
      where: Object.keys(where).length > 0 ? where : undefined
    });

    return operation.ids.length;
  }

  /**
   * Delete all records in namespace
   */
  async deleteNamespace(namespace: VectorNamespace): Promise<number> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    // Count records in the namespace before deletion
    const namespaceRecords = await this.collection.get({
      where: {
        namespace: { $eq: namespace }
      }
    });
    const count = namespaceRecords.ids[0]?.length || 0;
    
    // Delete records in the namespace
    await this.collection.delete({
      where: {
        namespace: { $eq: namespace }
      }
    });

    return count;
  }

  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<VectorNamespace[]> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    // ChromaDB doesn't have native namespace listing, so we query distinct namespaces
    const all = await this.collection.get({});
    const namespaces = new Set<VectorNamespace>();

    if (all.metadatas && all.metadatas.length > 0) {
      for (const metadataArray of all.metadatas) {
        for (const metadata of metadataArray) {
          if (metadata.namespace) {
            namespaces.add(metadata.namespace as string);
          }
        }
      }
    }

    return Array.from(namespaces);
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<VectorStoreStatistics> {
    await this.initialize();

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const totalRecords = await this.collection.count();
    const namespaces = await this.listNamespaces();
    
    const byNamespace: Record<VectorNamespace, number> = {};
    for (const ns of namespaces) {
      const nsRecords = await this.collection.get({
        where: { namespace: { $eq: ns } }
      });
      byNamespace[ns] = nsRecords.ids[0]?.length || 0;
    }

    return {
      totalRecords,
      byNamespace,
      vectorDimension: 384, // all-MiniLM-L6-v2 dimension
      estimatedSize: totalRecords * 384 * 4 // 4 bytes per float32
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.collection) return false;
      await this.collection.count();
      return true;
    } catch (error) {
      console.error('[ChromaDB] Health check failed:', error);
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

