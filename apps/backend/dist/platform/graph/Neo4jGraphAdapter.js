/**
 * Neo4j Graph Database Adapter
 *
 * Provides explicit graph storage and querying capabilities using Neo4j.
 * Replaces implicit graph patterns with explicit nodes and relationships.
 */
import neo4j, { isNode, isRelationship, isPath } from 'neo4j-driver';
export class Neo4jGraphAdapter {
    constructor() {
        this.driver = null;
        this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        // Support both NEO4J_USER and NEO4J_USERNAME for compatibility
        this.username = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j';
        this.password = process.env.NEO4J_PASSWORD || 'password';
        this.database = process.env.NEO4J_DATABASE || 'neo4j';
    }
    /**
     * Initialize Neo4j connection
     */
    async initialize() {
        try {
            this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.username, this.password), {
                maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
            });
            // Verify connectivity
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connection established');
        }
        catch (error) {
            console.error('❌ Failed to connect to Neo4j:', error);
            throw error;
        }
    }
    /**
     * Close Neo4j connection
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('✅ Neo4j connection closed');
        }
    }
    /**
     * Get a session for executing queries
     */
    getSession() {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized. Call initialize() first.');
        }
        return this.driver.session({ database: this.database });
    }
    /**
     * Create or update a node
     */
    async upsertNode(node) {
        const session = this.getSession();
        try {
            const labels = node.labels.join(':');
            const props = Object.entries(node.properties)
                .map(([key, value]) => `${key}: $${key}`)
                .join(', ');
            const query = `
                MERGE (n:${labels} {id: $id})
                SET n += {${props}}
                RETURN n
            `;
            const result = await session.run(query, {
                id: node.id,
                ...node.properties
            });
            const record = result.records[0];
            const createdNode = record.get('n');
            return {
                id: createdNode.properties.id,
                labels: createdNode.labels,
                properties: createdNode.properties
            };
        }
        finally {
            await session.close();
        }
    }
    /**
     * Create or update a relationship
     */
    async upsertRelationship(rel) {
        const session = this.getSession();
        try {
            const props = Object.entries(rel.properties)
                .map(([key, value]) => `${key}: $${key}`)
                .join(', ');
            const query = `
                MATCH (a {id: $startNodeId})
                MATCH (b {id: $endNodeId})
                MERGE (a)-[r:${rel.type} {id: $id}]->(b)
                SET r += {${props}}
                RETURN r, a.id as startId, b.id as endId
            `;
            const result = await session.run(query, {
                id: rel.id,
                startNodeId: rel.startNodeId,
                endNodeId: rel.endNodeId,
                ...rel.properties
            });
            const record = result.records[0];
            const createdRel = record.get('r');
            return {
                id: createdRel.properties.id,
                type: rel.type,
                startNodeId: record.get('startId'),
                endNodeId: record.get('endId'),
                properties: createdRel.properties
            };
        }
        finally {
            await session.close();
        }
    }
    /**
     * Execute a Cypher query
     */
    async query(cypher, parameters) {
        const session = this.getSession();
        try {
            const result = await session.run(cypher, parameters || {});
            const nodes = [];
            const relationships = [];
            const paths = [];
            const records = [];
            (result.records || []).forEach((record) => {
                const recordObj = {};
                record.keys.forEach((key) => {
                    const value = record.get(key);
                    recordObj[key] = value;
                    if (isNode(value)) {
                        nodes.push({
                            id: value.properties.id || value.identity.toString(),
                            labels: value.labels,
                            properties: value.properties
                        });
                    }
                    else if (isRelationship(value)) {
                        relationships.push({
                            id: value.properties.id || value.identity.toString(),
                            type: value.type,
                            startNodeId: value.start.toString(),
                            endNodeId: value.end.toString(),
                            properties: value.properties
                        });
                    }
                    else if (isPath(value)) {
                        paths.push({
                            start: value.start.properties,
                            end: value.end.properties,
                            length: value.length,
                            segments: value.segments.map((seg) => ({
                                start: seg.start.properties,
                                end: seg.end.properties,
                                relationship: seg.relationship.type
                            }))
                        });
                    }
                });
                records.push(recordObj);
            });
            return { nodes, relationships, paths, records };
        }
        finally {
            await session.close();
        }
    }
    /**
     * Find nodes by label and properties
     */
    async findNodes(labels, where, options) {
        const labelStr = labels.join(':');
        let query = `MATCH (n:${labelStr})`;
        if (where && Object.keys(where).length > 0) {
            const conditions = Object.entries(where)
                .map(([key, value]) => `n.${key} = $${key}`)
                .join(' AND ');
            query += ` WHERE ${conditions}`;
        }
        if (options?.orderBy) {
            query += ` ORDER BY ${options.orderBy}`;
        }
        if (options?.skip) {
            query += ` SKIP ${options.skip}`;
        }
        if (options?.limit) {
            query += ` LIMIT ${options.limit}`;
        }
        query += ' RETURN n';
        const result = await this.query(query, where);
        return result.nodes;
    }
    /**
     * Find relationships between nodes
     */
    async findRelationships(startNodeId, endNodeId, relationshipType) {
        let query = `MATCH (a {id: $startNodeId})`;
        if (relationshipType) {
            query += `-[r:${relationshipType}]`;
        }
        else {
            query += `-[r]`;
        }
        if (endNodeId) {
            query += `->(b {id: $endNodeId})`;
        }
        else {
            query += `->(b)`;
        }
        query += ' RETURN r, a.id as startId, b.id as endId';
        const params = { startNodeId };
        if (endNodeId) {
            params.endNodeId = endNodeId;
        }
        const result = await this.query(query, params);
        return result.relationships;
    }
    /**
     * Delete a node and its relationships
     */
    async deleteNode(nodeId) {
        const session = this.getSession();
        try {
            await session.run('MATCH (n {id: $id}) DETACH DELETE n', { id: nodeId });
        }
        finally {
            await session.close();
        }
    }
    /**
     * Delete a relationship
     */
    async deleteRelationship(relationshipId) {
        const session = this.getSession();
        try {
            await session.run('MATCH ()-[r {id: $id}]-() DELETE r', { id: relationshipId });
        }
        finally {
            await session.close();
        }
    }
    /**
     * Get shortest path between two nodes
     */
    async shortestPath(startNodeId, endNodeId, relationshipType) {
        const relFilter = relationshipType ? `:${relationshipType}` : '';
        const query = `
            MATCH (a {id: $startNodeId}), (b {id: $endNodeId}),
                  path = shortestPath((a)-[${relFilter}*]-(b))
            RETURN path
            LIMIT 1
        `;
        const result = await this.query(query, { startNodeId, endNodeId });
        return result.paths;
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.driver) {
                return false;
            }
            await this.driver.verifyConnectivity();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get statistics
     */
    async getStatistics() {
        const session = this.getSession();
        try {
            // Get node count
            const nodeResult = await session.run('MATCH (n) RETURN count(n) as count');
            const nodeCount = nodeResult.records[0].get('count').toNumber();
            // Get relationship count
            const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
            const relationshipCount = relResult.records[0].get('count').toNumber();
            // Get label counts
            const labelResult = await session.run(`
                CALL db.labels() YIELD label
                CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {}) YIELD value
                RETURN label, value.count as count
            `);
            const labelCounts = {};
            labelResult.records.forEach(record => {
                labelCounts[record.get('label')] = record.get('count').toNumber();
            });
            return { nodeCount, relationshipCount, labelCounts };
        }
        catch (error) {
            // Fallback if APOC is not available
            const labelResult = await session.run(`
                MATCH (n)
                RETURN DISTINCT labels(n) as labels, count(n) as count
            `);
            const labelCounts = {};
            let nodeCount = 0;
            let relationshipCount = 0;
            (labelResult.records || []).forEach(record => {
                const labels = record.get('labels');
                const count = record.get('count').toNumber();
                labels.forEach((label) => {
                    labelCounts[label] = (labelCounts[label] || 0) + count;
                    nodeCount += count;
                });
            });
            return {
                nodeCount: nodeCount,
                relationshipCount: relationshipCount,
                labelCounts
            };
        }
        finally {
            await session.close();
        }
    }
}
// Singleton instance
let neo4jAdapterInstance = null;
export function getNeo4jGraphAdapter() {
    if (!neo4jAdapterInstance) {
        neo4jAdapterInstance = new Neo4jGraphAdapter();
    }
    return neo4jAdapterInstance;
}
