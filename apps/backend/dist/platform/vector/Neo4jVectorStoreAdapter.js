import { getNeo4jGraphAdapter } from '../../platform/graph/Neo4jGraphAdapter.js';
import { logger } from '../../utils/logger.js';
import { getEmbeddingService } from '../../services/embeddings/EmbeddingService.js';
/**
 * Sanitize metadata for Neo4j - only primitive types allowed
 * Converts Date to ISO string, nested objects/arrays to JSON strings
 */
function sanitizeForNeo4j(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            continue; // Skip null/undefined
        }
        else if (value instanceof Date) {
            result[key] = value.toISOString();
        }
        else if (value instanceof Map) {
            result[key] = JSON.stringify(Object.fromEntries(value));
        }
        else if (Array.isArray(value)) {
            // Neo4j supports arrays of primitives
            if (value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
                result[key] = value;
            }
            else {
                result[key] = JSON.stringify(value);
            }
        }
        else if (typeof value === 'object') {
            result[key] = JSON.stringify(value);
        }
        else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            result[key] = value;
        }
        else {
            result[key] = String(value);
        }
    }
    return result;
}
/**
 * Neo4j Vector Store Adapter
 * Uses Neo4j's native vector indexing capabilities.
 */
export class Neo4jVectorStoreAdapter {
    constructor() {
        this.graphAdapter = getNeo4jGraphAdapter();
        this.embeddings = getEmbeddingService();
        this.isInitialized = false;
        this.indexName = 'vector_index';
        this.dimension = 384; // Default for all-MiniLM-L6-v2
    }
    async initialize() {
        if (this.isInitialized)
            return;
        await this.graphAdapter.initialize();
        await this.embeddings.initialize();
        this.dimension = this.embeddings.getDimensions();
        // Create vector index if it doesn't exist
        // Note: This requires Neo4j 5.11+
        try {
            await this.graphAdapter.query(`
                CREATE VECTOR INDEX ${this.indexName} IF NOT EXISTS
                FOR (n:VectorDocument)
                ON (n.embedding)
                OPTIONS {indexConfig: {
                    ` + "`vector.dimensions`" + `: ${this.dimension},
                    ` + "`vector.similarity_function`" + `: 'cosine'
                }}
            `);
            // Create constraint for ID
            await this.graphAdapter.query(`
                CREATE CONSTRAINT vector_document_id IF NOT EXISTS
                FOR (n:VectorDocument) REQUIRE n.id IS UNIQUE
            `);
            logger.info(`🧠 Neo4j Vector Store initialized (${this.indexName}, ${this.dimension}D)`);
            this.isInitialized = true;
        }
        catch (error) {
            logger.error('❌ Failed to initialize Neo4j vector index:', error);
            throw error;
        }
    }
    /**
     * Upsert a vector document
     */
    async upsert(record) {
        if (!this.isInitialized)
            await this.initialize();
        // Auto-generate embedding if not provided
        let embedding = record.embedding;
        if (!embedding && record.content) {
            embedding = await this.embeddings.generateEmbedding(record.content);
        }
        if (!embedding) {
            throw new Error('Content or embedding required');
        }
        const cypher = `
            MERGE (n:VectorDocument {id: $id})
            SET n.content = $content,
                n.embedding = $embedding,
                n.namespace = $namespace,
                n.updatedAt = datetime()
            SET n += $metadata
        `;
        await this.graphAdapter.query(cypher, {
            id: record.id,
            content: record.content,
            embedding: embedding,
            namespace: record.namespace || 'default',
            metadata: sanitizeForNeo4j(record.metadata || {})
        });
    }
    /**
     * Batch upsert vector documents
     */
    async batchUpsert(options) {
        if (!this.isInitialized)
            await this.initialize();
        // Process in batches of 50 to avoid large transactions
        const batchSize = 50;
        for (let i = 0; i < options.records.length; i += batchSize) {
            const batch = options.records.slice(i, i + batchSize);
            // Generate embeddings in parallel for the batch if needed
            const recordsWithEmbeddings = await Promise.all(batch.map(async (r) => {
                if (!r.embedding && r.content) {
                    return { ...r, embedding: await this.embeddings.generateEmbedding(r.content) };
                }
                return r;
            }));
            const cypher = `
                UNWIND $batch as row
                MERGE (n:VectorDocument {id: row.id})
                SET n.content = row.content,
                    n.embedding = row.embedding,
                    n.namespace = $namespace,
                    n.updatedAt = datetime()
                SET n += row.metadata
            `;
            await this.graphAdapter.query(cypher, {
                batch: recordsWithEmbeddings.map(r => ({
                    id: r.id,
                    content: r.content,
                    embedding: r.embedding,
                    metadata: sanitizeForNeo4j(r.metadata || {})
                })),
                namespace: options.namespace || 'default'
            });
        }
        logger.info(`📦 Batch upserted ${options.records.length} vectors to Neo4j`);
    }
    /**
     * Search for similar vectors
     */
    async search(query) {
        if (!this.isInitialized)
            await this.initialize();
        let searchVector = query.vector;
        if (!searchVector && query.text) {
            searchVector = await this.embeddings.generateEmbedding(query.text);
        }
        if (!searchVector) {
            throw new Error('Either vector or text is required');
        }
        const limit = query.limit || 10;
        const namespace = query.namespace || 'default';
        // Using Neo4j vector index query
        // Note: We filter by namespace AFTER the vector search if using db.index.vector.queryNodes
        // Ideally, we would use pre-filtering but that requires more complex cypher or newer Neo4j features
        const cypher = `
            CALL db.index.vector.queryNodes($indexName, $k, $embedding)
            YIELD node, score
            WHERE node.namespace = $namespace
            RETURN node.id as id, node.content as content, node as metadata, score
        `;
        // We request more results than limit to account for filtering
        const k = limit * 5;
        const result = await this.graphAdapter.query(cypher, {
            indexName: this.indexName,
            k: k,
            embedding: searchVector,
            namespace: namespace
        });
        // Map records to results
        return result.records.map((record) => {
            // record is an object where keys are the return values from Cypher
            // We returned: id, content, metadata, score
            // Note: metadata was returned as 'node', which contains properties
            const properties = record.metadata?.properties || {};
            // Clean up internal properties if needed
            delete properties.embedding;
            return {
                id: record.id,
                content: record.content,
                metadata: properties,
                similarity: record.score
            };
        });
    }
    // Helper to be implemented after updating adapter
    async searchRaw(query) {
        return this.search(query);
    }
    /**
     * Get statistics
     */
    async getStatistics() {
        if (!this.isInitialized)
            await this.initialize();
        const cypher = `
            MATCH (n:VectorDocument)
            RETURN n.namespace as namespace, count(n) as count
        `;
        const result = await this.graphAdapter.query(cypher);
        const perNamespace = {};
        let totalRecords = 0;
        result.records.forEach((record) => {
            const namespace = record.namespace || 'default';
            const count = record.count.toNumber(); // Neo4j int
            perNamespace[namespace] = count;
            totalRecords += count;
        });
        return {
            totalRecords,
            namespaces: Object.keys(perNamespace),
            perNamespace,
            initialized: this.isInitialized,
            backend: 'neo4j'
        };
    }
}
// Singleton instance
let neo4jVectorStoreInstance = null;
export function getNeo4jVectorStore() {
    if (!neo4jVectorStoreInstance) {
        neo4jVectorStoreInstance = new Neo4jVectorStoreAdapter();
    }
    return neo4jVectorStoreInstance;
}
