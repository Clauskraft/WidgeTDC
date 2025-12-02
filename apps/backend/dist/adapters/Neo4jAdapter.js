/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    NEO4J ADAPTER - SYNAPTIC CORTEX                        ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Graph-Native connection layer for WidgeTDC knowledge graph               ║
 * ║                                                                           ║
 * ║  CODEX RULE #3: Self-Healing & Robustness                                 ║
 * ║  - Automatic reconnection on failure                                      ║
 * ║  - Circuit breaker pattern                                                ║
 * ║  - Health monitoring                                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
import neo4j from 'neo4j-driver';
// ═══════════════════════════════════════════════════════════════════════════
// Neo4j Adapter - Singleton Pattern
// ═══════════════════════════════════════════════════════════════════════════
class Neo4jAdapter {
    constructor() {
        this.driver = null;
        this.isConnected = false;
        this.lastHealthCheck = null;
        // Circuit breaker state
        this.failureCount = 0;
        this.failureThreshold = 5;
        this.lastFailureTime = 0;
        this.resetTimeoutMs = 60000;
        this.config = {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            user: process.env.NEO4J_USER || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'kodeord',
            database: process.env.NEO4J_DATABASE || 'neo4j'
        };
        this.connect();
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Singleton Access
    // ═══════════════════════════════════════════════════════════════════════
    static getInstance() {
        if (!Neo4jAdapter.instance) {
            Neo4jAdapter.instance = new Neo4jAdapter();
        }
        return Neo4jAdapter.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Connection Management
    // ═══════════════════════════════════════════════════════════════════════
    async connect() {
        try {
            console.log(`[Neo4jAdapter] 🧠 Establishing synaptic link to ${this.config.uri}...`);
            this.driver = neo4j.driver(this.config.uri, neo4j.auth.basic(this.config.user, this.config.password), {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 30000,
                connectionTimeout: 20000,
            });
            // Verify connectivity
            await this.driver.verifyConnectivity();
            this.isConnected = true;
            this.failureCount = 0;
            console.log('[Neo4jAdapter] ✅ Synaptic link ESTABLISHED. Cortex is online.');
            return true;
        }
        catch (error) {
            console.error('[Neo4jAdapter] ❌ CONNECTION FAILURE:', error.message);
            this.isConnected = false;
            this.failureCount++;
            this.lastFailureTime = Date.now();
            return false;
        }
    }
    async ensureConnection() {
        // Check circuit breaker
        if (this.failureCount >= this.failureThreshold) {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure < this.resetTimeoutMs) {
                throw new Error(`Neo4j Cortex circuit OPEN - ${Math.ceil((this.resetTimeoutMs - timeSinceFailure) / 1000)}s until retry`);
            }
            // Reset and try again
            this.failureCount = 0;
        }
        if (!this.driver || !this.isConnected) {
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Neo4j Cortex Unreachable - connection failed');
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Query Execution
    // ═══════════════════════════════════════════════════════════════════════
    async executeQuery(cypher, params = {}, options = {}) {
        await this.ensureConnection();
        const session = this.driver.session({
            database: options.database || this.config.database,
            defaultAccessMode: options.readOnly ? neo4j.session.READ : neo4j.session.WRITE
        });
        const startTime = Date.now();
        try {
            const result = await session.run(cypher, params);
            const latency = Date.now() - startTime;
            console.log(`[Neo4jAdapter] ⚡ Query executed in ${latency}ms (${result.records.length} records)`);
            return result.records.map((record) => this.recordToObject(record));
        }
        catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();
            console.error(`[Neo4jAdapter] ❌ Query failed: ${error.message}`);
            console.error(`[Neo4jAdapter] Cypher: ${cypher.substring(0, 100)}...`);
            throw error;
        }
        finally {
            await session.close();
        }
    }
    /**
     * Execute a read-only query (optimized for replicas)
     */
    async readQuery(cypher, params = {}) {
        return this.executeQuery(cypher, params, { readOnly: true });
    }
    /**
     * Execute a write query
     */
    async writeQuery(cypher, params = {}) {
        return this.executeQuery(cypher, params, { readOnly: false });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // High-Level Operations
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Search nodes by label and properties
     */
    async searchNodes(label, searchTerm, limit = 20) {
        const cypher = `
            MATCH (n:${label})
            WHERE n.name CONTAINS $searchTerm 
               OR n.title CONTAINS $searchTerm
               OR n.content CONTAINS $searchTerm
            RETURN n
            LIMIT $limit
        `;
        return this.readQuery(cypher, { searchTerm, limit: neo4j.int(limit) });
    }
    /**
     * Get node by ID
     */
    async getNodeById(nodeId) {
        const cypher = `
            MATCH (n)
            WHERE n.id = $nodeId OR elementId(n) = $nodeId
            RETURN n
            LIMIT 1
        `;
        const results = await this.readQuery(cypher, { nodeId });
        return results[0] || null;
    }
    /**
     * Get node relationships
     */
    async getNodeRelationships(nodeId, direction = 'both', limit = 50) {
        let pattern;
        switch (direction) {
            case 'in':
                pattern = '(n)<-[r]-(m)';
                break;
            case 'out':
                pattern = '(n)-[r]->(m)';
                break;
            default:
                pattern = '(n)-[r]-(m)';
        }
        const cypher = `
            MATCH ${pattern}
            WHERE n.id = $nodeId OR elementId(n) = $nodeId
            RETURN type(r) as relationship, m as node, r as details
            LIMIT $limit
        `;
        return this.readQuery(cypher, { nodeId, limit: neo4j.int(limit) });
    }
    /**
     * Create or merge a node
     */
    async createNode(label, properties) {
        const cypher = `
            MERGE (n:${label} {id: $id})
            SET n += $properties
            SET n.updatedAt = datetime()
            RETURN n
        `;
        const id = properties.id || this.generateId(label, properties);
        const results = await this.writeQuery(cypher, {
            id,
            properties: { ...properties, id }
        });
        return results[0];
    }
    /**
     * Create a relationship between nodes
     */
    async createRelationship(fromId, toId, relationshipType, properties = {}) {
        const cypher = `
            MATCH (a), (b)
            WHERE (a.id = $fromId OR elementId(a) = $fromId)
              AND (b.id = $toId OR elementId(b) = $toId)
            MERGE (a)-[r:${relationshipType}]->(b)
            SET r += $properties
            SET r.createdAt = datetime()
            RETURN a, r, b
        `;
        const results = await this.writeQuery(cypher, { fromId, toId, properties });
        return results[0];
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Health & Monitoring
    // ═══════════════════════════════════════════════════════════════════════
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.ensureConnection();
            // Get database stats
            const [statsResult] = await this.readQuery(`
                CALL apoc.meta.stats() YIELD nodeCount, relCount
                RETURN nodeCount, relCount
            `).catch(() => [{ nodeCount: -1, relCount: -1 }]);
            const latency = Date.now() - startTime;
            this.lastHealthCheck = {
                connected: true,
                latencyMs: latency,
                nodeCount: statsResult?.nodeCount,
                relationshipCount: statsResult?.relCount,
                lastCheck: new Date().toISOString()
            };
            return this.lastHealthCheck;
        }
        catch (error) {
            this.lastHealthCheck = {
                connected: false,
                lastCheck: new Date().toISOString()
            };
            return this.lastHealthCheck;
        }
    }
    getLastHealthStatus() {
        return this.lastHealthCheck;
    }
    isHealthy() {
        return this.isConnected && this.failureCount < this.failureThreshold;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Cleanup
    // ═══════════════════════════════════════════════════════════════════════
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.isConnected = false;
            console.log('[Neo4jAdapter] 🔌 Synaptic link severed.');
        }
    }
    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════
    recordToObject(record) {
        const obj = {};
        record.keys.forEach((key) => {
            const value = record.get(key);
            obj[key] = this.convertNeo4jValue(value);
        });
        return obj;
    }
    convertNeo4jValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        // Neo4j Integer
        if (neo4j.isInt(value)) {
            return value.toNumber();
        }
        // Neo4j Node
        if (value.labels && value.properties) {
            return {
                id: value.elementId || value.identity?.toString(),
                labels: value.labels,
                ...value.properties
            };
        }
        // Neo4j Relationship
        if (value.type && value.properties && value.start && value.end) {
            return {
                id: value.elementId || value.identity?.toString(),
                type: value.type,
                startNodeId: value.startNodeElementId || value.start?.toString(),
                endNodeId: value.endNodeElementId || value.end?.toString(),
                ...value.properties
            };
        }
        // Arrays
        if (Array.isArray(value)) {
            return value.map(v => this.convertNeo4jValue(v));
        }
        // Objects
        if (typeof value === 'object') {
            const converted = {};
            for (const key of Object.keys(value)) {
                converted[key] = this.convertNeo4jValue(value[key]);
            }
            return converted;
        }
        return value;
    }
    generateId(label, properties) {
        const crypto = require('crypto');
        const content = `${label}:${properties.name || properties.title || JSON.stringify(properties)}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════
export const neo4jAdapter = Neo4jAdapter.getInstance();
export { Neo4jAdapter };
