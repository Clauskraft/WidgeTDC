/**
 * Vector Store Types
 * 
 * Common types for vector store adapters (ChromaDB, Pinecone, etc.)
 */

export type VectorRecordId = string;
export type VectorNamespace = string;
export type VectorEmbedding = number[];

export interface VectorRecord {
  id: VectorRecordId;
  content: string;
  embedding?: VectorEmbedding;
  metadata: Record<string, any>;
  namespace?: VectorNamespace;
}

export interface VectorQuery {
  keywords?: string;
  embedding?: VectorEmbedding;
  topK?: number;
  namespace?: VectorNamespace;
  filters?: MetadataFilter;
  minScore?: number;
  metric?: 'cosine' | 'euclidean' | 'dot';
}

export interface VectorSearchResult {
  id: VectorRecordId;
  content: string;
  score: number;
  metadata: Record<string, any>;
  embedding?: VectorEmbedding;
}

export interface MetadataFilter {
  [key: string]: any;
}

export interface VectorBatchUpsert {
  records: VectorRecord[];
  namespace?: VectorNamespace;
}

export interface VectorBatchDelete {
  ids: VectorRecordId[];
  namespace?: VectorNamespace;
}

export interface VectorStoreStatistics {
  totalRecords: number;
  namespaces: Record<VectorNamespace, number>;
  dimensions?: number;
}

export interface VectorStoreAdapter {
  initialize(): Promise<void>;
  upsert(record: VectorRecord): Promise<VectorRecordId>;
  batchUpsert(batch: VectorBatchUpsert): Promise<VectorRecordId[]>;
  search(query: VectorQuery): Promise<VectorSearchResult[]>;
  getById(id: VectorRecordId, namespace?: VectorNamespace): Promise<VectorRecord | null>;
  deleteById(id: VectorRecordId, namespace?: VectorNamespace): Promise<boolean>;
  batchDelete(batch: VectorBatchDelete): Promise<number>;
  deleteNamespace(namespace: VectorNamespace): Promise<number>;
  listNamespaces(): Promise<VectorNamespace[]>;
  getStatistics(): Promise<VectorStoreStatistics>;
  healthCheck(): Promise<boolean>;
}

