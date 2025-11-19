/**
 * Vector Store Types
 * 
 * Vendor-neutral vector store abstraction for semantic search,
 * embeddings, and similarity-based retrieval. Foundation for
 * Phase 4 intelligent document search and knowledge graphs.
 */

/**
 * Vector embedding (array of floats)
 */
export type VectorEmbedding = number[];

/**
 * Unique identifier for vector records
 */
export type VectorRecordId = string;

/**
 * Namespace for organizing vector collections
 */
export type VectorNamespace = string;

/**
 * Metadata for vector records (for filtering)
 */
export type VectorMetadata = Record<string, string | number | boolean | string[]>;

/**
 * Vector record containing embedding and metadata
 */
export interface VectorRecord {
  /** Unique record identifier */
  id: VectorRecordId;
  
  /** Vector embedding */
  embedding: VectorEmbedding;
  
  /** Optional text content */
  content?: string;
  
  /** Metadata for filtering */
  metadata: VectorMetadata;
  
  /** Namespace for isolation */
  namespace?: VectorNamespace;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Similarity metric for vector search
 */
export type SimilarityMetric = 'cosine' | 'euclidean' | 'dot-product';

/**
 * Metadata filter operator
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';

/**
 * Metadata filter condition
 */
export interface MetadataFilter {
  /** Field name */
  field: string;
  
  /** Filter operator */
  operator: FilterOperator;
  
  /** Filter value */
  value: string | number | boolean | string[];
}

/**
 * Vector search query
 */
export interface VectorQuery {
  /** Query vector embedding */
  embedding: VectorEmbedding;
  
  /** Number of results to return */
  topK: number;
  
  /** Similarity metric to use */
  metric?: SimilarityMetric;
  
  /** Namespace filter */
  namespace?: VectorNamespace;
  
  /** Metadata filters (AND logic) */
  filters?: MetadataFilter[];
  
  /** Minimum similarity score threshold (0-1) */
  minScore?: number;
  
  /** Optional keyword query for hybrid search */
  keywords?: string;
  
  /** Keyword boost weight (0-1, default 0.5) */
  keywordWeight?: number;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  /** Matching record */
  record: VectorRecord;
  
  /** Similarity score (0-1, higher is more similar) */
  score: number;
  
  /** Optional explanation of match */
  explanation?: {
    vectorScore: number;
    keywordScore?: number;
    metadataMatches?: string[];
  };
}

/**
 * Batch upsert operation
 */
export interface VectorBatchUpsert {
  /** Records to upsert */
  records: Omit<VectorRecord, 'createdAt' | 'updatedAt'>[];
  
  /** Namespace for all records */
  namespace?: VectorNamespace;
}

/**
 * Batch delete operation
 */
export interface VectorBatchDelete {
  /** Record IDs to delete */
  ids: VectorRecordId[];
  
  /** Namespace filter */
  namespace?: VectorNamespace;
}

/**
 * Vector store statistics
 */
export interface VectorStoreStatistics {
  /** Total number of records */
  totalRecords: number;
  
  /** Records by namespace */
  byNamespace: Record<VectorNamespace, number>;
  
  /** Vector dimension */
  vectorDimension?: number;
  
  /** Storage size estimate (bytes) */
  estimatedSize: number;
}

/**
 * Vector Store Adapter interface
 * 
 * Vendor-neutral interface for vector storage and similarity search.
 * Implementations can use Pinecone, Weaviate, Qdrant, or in-memory storage.
 */
export interface VectorStoreAdapter {
  /**
   * Upsert a vector record (insert or update)
   * @param record Vector record to upsert
   * @returns The upserted record with timestamps
   */
  upsert(record: Omit<VectorRecord, 'createdAt' | 'updatedAt'>): Promise<VectorRecord>;
  
  /**
   * Batch upsert multiple records
   * @param operation Batch upsert operation
   * @returns Array of upserted records
   */
  batchUpsert(operation: VectorBatchUpsert): Promise<VectorRecord[]>;
  
  /**
   * Search for similar vectors
   * @param query Search query
   * @returns Array of search results sorted by similarity
   */
  search(query: VectorQuery): Promise<VectorSearchResult[]>;
  
  /**
   * Get a record by ID
   * @param id Record ID
   * @param namespace Optional namespace
   * @returns Record or undefined if not found
   */
  getById(id: VectorRecordId, namespace?: VectorNamespace): Promise<VectorRecord | undefined>;
  
  /**
   * Delete a record by ID
   * @param id Record ID
   * @param namespace Optional namespace
   * @returns Whether deletion was successful
   */
  deleteById(id: VectorRecordId, namespace?: VectorNamespace): Promise<boolean>;
  
  /**
   * Batch delete multiple records
   * @param operation Batch delete operation
   * @returns Number of records deleted
   */
  batchDelete(operation: VectorBatchDelete): Promise<number>;
  
  /**
   * Delete all records in a namespace
   * @param namespace Namespace to clear
   * @returns Number of records deleted
   */
  deleteNamespace(namespace: VectorNamespace): Promise<number>;
  
  /**
   * List all namespaces
   * @returns Array of namespace identifiers
   */
  listNamespaces(): Promise<VectorNamespace[]>;
  
  /**
   * Get vector store statistics
   * @returns Statistics summary
   */
  getStatistics(): Promise<VectorStoreStatistics>;
  
  /**
   * Check if the adapter is healthy
   * @returns Whether the adapter is operational
   */
  healthCheck(): Promise<boolean>;
}
