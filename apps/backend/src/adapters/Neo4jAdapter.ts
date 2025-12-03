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

import neo4j, { Driver, Session, QueryResult, Record as Neo4jRecord } from 'neo4j-driver';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface Neo4jConfig {
    uri: string;
    user: string;
    password: string;
    database?: string;
}

export interface QueryOptions {
    timeout?: number;
    database?: string;
    readOnly?: boolean;
}

export interface HealthStatus {
    connected: boolean;
    latencyMs?: number;
    nodeCount?: number;
    relationshipCount?: number;
    lastCheck: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Neo4j Adapter - Singleton Pattern
// ═══════════════════════════════════════════════════════════════════════════

class Neo4jAdapter {
    private static instance: Neo4jAdapter;
    private driver: Driver | null = null;
    private _isConnected: boolean = false;
    private lastHealthCheck: HealthStatus | null = null;

    // Public getter for connection status
    public get connected(): boolean {
        return this._isConnected;
    }

    // Circuit breaker state
    private failureCount: number = 0;
    private readonly failureThreshold: number = 5;
    private lastFailureTime: number = 0;
    private readonly resetTimeoutMs: number = 60000;

    // Connection config
    private config: Neo4jConfig;

    private constructor() {
        this.config = {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            user: process.env.NEO4J_USER || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'password',
            database: process.env.NEO4J_DATABASE || 'neo4j'
        };

        this.connect();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Singleton Access
    // ═══════════════════════════════════════════════════════════════════════

    public static getInstance(): Neo4jAdapter {
        if (!Neo4jAdapter.instance) {
            Neo4jAdapter.instance = new Neo4jAdapter();
        }
        return Neo4jAdapter.instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Connection Management
    // ═══════════════════════════════════════════════════════════════════════

    private async connect(): Promise<boolean> {
        try {
            console.error(`[Neo4jAdapter] 🧠 Establishing synaptic link to ${this.config.uri}...`);

            this.driver = neo4j.driver(
                this.config.uri,
                neo4j.auth.basic(this.config.user, this.config.password),
                {
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 30000,
                    connectionTimeout: 20000,
                }
            );

            // Verify connectivity
            await this.driver.verifyConnectivity();
            this._isConnected = true;
            this.failureCount = 0;

            console.error('[Neo4jAdapter] ✅ Synaptic link ESTABLISHED. Cortex is online.');
            return true;

        } catch (error: any) {
            console.error('[Neo4jAdapter] ❌ CONNECTION FAILURE:', error.message);
            this._isConnected = false;
            this.failureCount++;
            this.lastFailureTime = Date.now();
            return false;
        }
    }

    private async ensureConnection(): Promise<void> {
        // Check circuit breaker
        if (this.failureCount >= this.failureThreshold) {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure < this.resetTimeoutMs) {
                throw new Error(`Neo4j Cortex circuit OPEN - ${Math.ceil((this.resetTimeoutMs - timeSinceFailure) / 1000)}s until retry`);
            }
            // Reset and try again
            this.failureCount = 0;
        }

        if (!this.driver || !this._isConnected) {
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Neo4j Cortex Unreachable - connection failed');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Query Execution
    // ═══════════════════════════════════════════════════════════════════════

    public async executeQuery(
        cypher: string,
        params: Record<string, any> = {},
        options: QueryOptions = {}
    ): Promise<any[]> {
        await this.ensureConnection();

        const session: Session = this.driver!.session({
            database: options.database || this.config.database,
            defaultAccessMode: options.readOnly ? neo4j.session.READ : neo4j.session.WRITE
        });

        const startTime = Date.now();

        try {
            const result: QueryResult = await session.run(cypher, params);
            const latency = Date.now() - startTime;

            console.error(`[Neo4jAdapter] ⚡ Query executed in ${latency}ms (${result.records.length} records)`);

            return result.records.map((record: Neo4jRecord) => this.recordToObject(record));

        } catch (error: any) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            console.error(`[Neo4jAdapter] ❌ Query failed: ${error.message}`);
            console.error(`[Neo4jAdapter] Cypher: ${cypher.substring(0, 100)}...`);

            throw error;

        } finally {
            await session.close();
        }
    }

    /**
     * Execute a read-only query (optimized for replicas)
     */
    public async readQuery(
        cypher: string,
        params: Record<string, any> = {}
    ): Promise<any[]> {
        return this.executeQuery(cypher, params, { readOnly: true });
    }

    /**
     * Execute a write query
     */
    public async writeQuery(
        cypher: string,
        params: Record<string, any> = {}
    ): Promise<any[]> {
        return this.executeQuery(cypher, params, { readOnly: false });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // High-Level Operations
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Search nodes by label and properties
     */
    public async searchNodes(
        label: string,
        searchTerm: string,
        limit: number = 20
    ): Promise<any[]> {
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
    public async getNodeById(nodeId: string): Promise<any | null> {
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
    public async getNodeRelationships(
        nodeId: string,
        direction: 'in' | 'out' | 'both' = 'both',
        limit: number = 50
    ): Promise<any[]> {
        let pattern: string;
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
    public async createNode(
        label: string,
        properties: Record<string, any>
    ): Promise<any> {
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
    public async createRelationship(
        fromId: string,
        toId: string,
        relationshipType: string,
        properties: Record<string, any> = {}
    ): Promise<any> {
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

    /**
     * Delete a node by ID
     */
    public async deleteNode(nodeId: string): Promise<boolean> {
        const cypher = `
            MATCH (n)
            WHERE n.id = $nodeId OR elementId(n) = $nodeId
            DETACH DELETE n
            RETURN count(n) as deleted
        `;

        const results = await this.writeQuery(cypher, { nodeId });
        return (results[0]?.deleted || 0) > 0;
    }

    /**
     * Alias for executeQuery - for compatibility
     */
    public async runQuery(
        cypher: string,
        params: Record<string, any> = {}
    ): Promise<any[]> {
        return this.executeQuery(cypher, params);
    }

    /**
     * Alias for executeQuery - for compatibility
     */
    public async query(
        cypher: string,
        params: Record<string, any> = {}
    ): Promise<any[]> {
        return this.executeQuery(cypher, params);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Health & Monitoring
    // ═══════════════════════════════════════════════════════════════════════

    public async healthCheck(): Promise<HealthStatus> {
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

        } catch (error: any) {
            this.lastHealthCheck = {
                connected: false,
                lastCheck: new Date().toISOString()
            };
            return this.lastHealthCheck;
        }
    }

    public getLastHealthStatus(): HealthStatus | null {
        return this.lastHealthCheck;
    }

    public isHealthy(): boolean {
        return this._isConnected && this.failureCount < this.failureThreshold;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Cleanup
    // ═══════════════════════════════════════════════════════════════════════

    public async close(): Promise<void> {
        if (this.driver) {
            await this.driver.close();
            this._isConnected = false;
            console.error('[Neo4jAdapter] 🔌 Synaptic link severed.');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    private recordToObject(record: Neo4jRecord): any {
        const obj: any = {};
        record.keys.forEach((key) => {
            const value = record.get(key);
            obj[key] = this.convertNeo4jValue(value);
        });
        return obj;
    }

    private convertNeo4jValue(value: any): any {
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
            const converted: any = {};
            for (const key of Object.keys(value)) {
                converted[key] = this.convertNeo4jValue(value[key]);
            }
            return converted;
        }

        return value;
    }

    private generateId(label: string, properties: Record<string, any>): string {
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
