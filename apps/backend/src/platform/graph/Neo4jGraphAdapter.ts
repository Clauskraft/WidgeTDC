/**
 * Neo4j Graph Database Adapter
 * 
 * Provides explicit graph storage and querying capabilities using Neo4j.
 * Replaces implicit graph patterns with explicit nodes and relationships.
 */

import neo4j, { Driver, Session, Result } from 'neo4j-driver';

export interface GraphNode {
    id: string;
    labels: string[];
    properties: Record<string, any>;
}

export interface GraphRelationship {
    id: string;
    type: string;
    startNodeId: string;
    endNodeId: string;
    properties: Record<string, any>;
}

export interface GraphQueryResult {
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    paths: any[];
}

export interface GraphQueryOptions {
    limit?: number;
    skip?: number;
    where?: Record<string, any>;
    orderBy?: string;
}

export class Neo4jGraphAdapter {
    private driver: Driver | null = null;
    private uri: string;
    private username: string;
    private password: string;
    private database: string;

    constructor() {
        this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        this.username = process.env.NEO4J_USERNAME || 'neo4j';
        this.password = process.env.NEO4J_PASSWORD || 'password';
        this.database = process.env.NEO4J_DATABASE || 'neo4j';
    }

    /**
     * Initialize Neo4j connection
     */
    async initialize(): Promise<void> {
        try {
            this.driver = neo4j.driver(
                this.uri,
                neo4j.auth.basic(this.username, this.password),
                {
                    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
                }
            );

            // Verify connectivity
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connection established');
        } catch (error) {
            console.error('❌ Failed to connect to Neo4j:', error);
            throw error;
        }
    }

    /**
     * Close Neo4j connection
     */
    async close(): Promise<void> {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('✅ Neo4j connection closed');
        }
    }

    /**
     * Get a session for executing queries
     */
    private getSession(): Session {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized. Call initialize() first.');
        }
        return this.driver.session({ database: this.database });
    }

    /**
     * Create or update a node
     */
    async upsertNode(node: GraphNode): Promise<GraphNode> {
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
        } finally {
            await session.close();
        }
    }

    /**
     * Create or update a relationship
     */
    async upsertRelationship(rel: GraphRelationship): Promise<GraphRelationship> {
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
        } finally {
            await session.close();
        }
    }

    /**
     * Execute a Cypher query
     */
    async query(cypher: string, parameters?: Record<string, any>): Promise<GraphQueryResult> {
        const session = this.getSession();
        try {
            const result: Result = await session.run(cypher, parameters || {});
            
            const nodes: GraphNode[] = [];
            const relationships: GraphRelationship[] = [];
            const paths: any[] = [];

            (result.records || []).forEach(record => {
                record.keys.forEach(key => {
                    const value = record.get(key);
                    
                    if (neo4j.isNode(value)) {
                        nodes.push({
                            id: value.properties.id || value.identity.toString(),
                            labels: value.labels,
                            properties: value.properties
                        });
                    } else if (neo4j.isRelationship(value)) {
                        relationships.push({
                            id: value.properties.id || value.identity.toString(),
                            type: value.type,
                            startNodeId: value.start.toString(),
                            endNodeId: value.end.toString(),
                            properties: value.properties
                        });
                    } else if (neo4j.isPath(value)) {
                        paths.push({
                            start: value.start.properties,
                            end: value.end.properties,
                            length: value.length,
                            segments: value.segments.map((seg: any) => ({
                                start: seg.start.properties,
                                end: seg.end.properties,
                                relationship: seg.relationship.type
                            }))
                        });
                    }
                });
            });

            return { nodes, relationships, paths };
        } finally {
            await session.close();
        }
    }

    /**
     * Find nodes by label and properties
     */
    async findNodes(
        labels: string[],
        where?: Record<string, any>,
        options?: GraphQueryOptions
    ): Promise<GraphNode[]> {
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
    async findRelationships(
        startNodeId: string,
        endNodeId?: string,
        relationshipType?: string
    ): Promise<GraphRelationship[]> {
        let query = `MATCH (a {id: $startNodeId})`;
        
        if (relationshipType) {
            query += `-[r:${relationshipType}]`;
        } else {
            query += `-[r]`;
        }

        if (endNodeId) {
            query += `->(b {id: $endNodeId})`;
        } else {
            query += `->(b)`;
        }

        query += ' RETURN r, a.id as startId, b.id as endId';

        const params: Record<string, any> = { startNodeId };
        if (endNodeId) {
            params.endNodeId = endNodeId;
        }

        const result = await this.query(query, params);
        return result.relationships;
    }

    /**
     * Delete a node and its relationships
     */
    async deleteNode(nodeId: string): Promise<void> {
        const session = this.getSession();
        try {
            await session.run(
                'MATCH (n {id: $id}) DETACH DELETE n',
                { id: nodeId }
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Delete a relationship
     */
    async deleteRelationship(relationshipId: string): Promise<void> {
        const session = this.getSession();
        try {
            await session.run(
                'MATCH ()-[r {id: $id}]-() DELETE r',
                { id: relationshipId }
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Get shortest path between two nodes
     */
    async shortestPath(
        startNodeId: string,
        endNodeId: string,
        relationshipType?: string
    ): Promise<any[]> {
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
    async healthCheck(): Promise<boolean> {
        try {
            if (!this.driver) {
                return false;
            }
            await this.driver.verifyConnectivity();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get statistics
     */
    async getStatistics(): Promise<{
        nodeCount: number;
        relationshipCount: number;
        labelCounts: Record<string, number>;
    }> {
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

            const labelCounts: Record<string, number> = {};
            labelResult.records.forEach(record => {
                labelCounts[record.get('label')] = record.get('count').toNumber();
            });

            return { nodeCount, relationshipCount, labelCounts };
        } catch (error) {
            // Fallback if APOC is not available
            const labelResult = await session.run(`
                MATCH (n)
                RETURN DISTINCT labels(n) as labels, count(n) as count
            `);
            
            const labelCounts: Record<string, number> = {};
            let nodeCount = 0;
            let relationshipCount = 0;

            (labelResult.records || []).forEach(record => {
                const labels = record.get('labels');
                const count = record.get('count').toNumber();
                labels.forEach((label: string) => {
                    labelCounts[label] = (labelCounts[label] || 0) + count;
                    nodeCount += count;
                });
            });

            return {
                nodeCount: nodeCount,
                relationshipCount: relationshipCount,
                labelCounts
            };
        } finally {
            await session.close();
        }
    }
}

// Singleton instance
let neo4jAdapterInstance: Neo4jGraphAdapter | null = null;

export function getNeo4jGraphAdapter(): Neo4jGraphAdapter {
    if (!neo4jAdapterInstance) {
        neo4jAdapterInstance = new Neo4jGraphAdapter();
    }
    return neo4jAdapterInstance;
}

