import neo4j, { Driver, Session } from 'neo4j-driver';

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

export class Neo4jService {
    private driver: Driver | null = null;
    private uri: string;
    private username: string;
    private password: string;

    constructor() {
        this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        this.username = process.env.NEO4J_USERNAME || 'neo4j';
        this.password = process.env.NEO4J_PASSWORD || 'password';
    }

    async connect(): Promise<void> {
        try {
            this.driver = neo4j.driver(
                this.uri,
                neo4j.auth.basic(this.username, this.password),
                {
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 60000,
                }
            );
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connected successfully', this.uri);
        } catch (error) {
            console.error('❌ Failed to connect to Neo4j', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('Neo4j disconnected');
        }
    }

    private getSession(): Session {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized. Call connect() first.');
        }
        return this.driver.session();
    }

    async createNode(labels: string[], properties: Record<string, any>): Promise<GraphNode> {
        const session = this.getSession();
        try {
            const labelsStr = labels.map(l => `:${l}`).join('');
            const result = await session.run(
                `CREATE (n${labelsStr} $properties) RETURN n`,
                { properties }
            );
            const node = result.records[0].get('n');
            return {
                id: node.identity.toString(),
                labels: node.labels,
                properties: node.properties,
            };
        } finally {
            await session.close();
        }
    }

    async createRelationship(
        startNodeId: string,
        endNodeId: string,
        type: string,
        properties: Record<string, any> = {}
    ): Promise<GraphRelationship> {
        const session = this.getSession();
        try {
            const result = await session.run(
                `MATCH (a), (b)
         WHERE id(a) = $startId AND id(b) = $endId
         CREATE (a)-[r:${type} $properties]->(b)
         RETURN r`,
                { startId: parseInt(startNodeId), endId: parseInt(endNodeId), properties }
            );
            const rel = result.records[0].get('r');
            return {
                id: rel.identity.toString(),
                type: rel.type,
                startNodeId: rel.start.toString(),
                endNodeId: rel.end.toString(),
                properties: rel.properties,
            };
        } finally {
            await session.close();
        }
    }

    async findNodes(label: string, properties: Record<string, any> = {}): Promise<GraphNode[]> {
        const session = this.getSession();
        try {
            const whereClause = Object.keys(properties).length > 0
                ? 'WHERE ' + Object.keys(properties).map(k => `n.${k} = $${k}`).join(' AND ')
                : '';
            const result = await session.run(
                `MATCH (n:${label}) ${whereClause} RETURN n`,
                properties
            );
            return result.records.map(record => {
                const node = record.get('n');
                return {
                    id: node.identity.toString(),
                    labels: node.labels,
                    properties: node.properties,
                };
            });
        } finally {
            await session.close();
        }
    }

    async runQuery(query: string, parameters: Record<string, any> = {}): Promise<any[]> {
        const session = this.getSession();
        try {
            const result = await session.run(query, parameters);
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }

    async getNodeById(nodeId: string): Promise<GraphNode | null> {
        const session = this.getSession();
        try {
            const result = await session.run(
                'MATCH (n) WHERE id(n) = $id RETURN n',
                { id: parseInt(nodeId) }
            );
            if (result.records.length === 0) return null;
            const node = result.records[0].get('n');
            return {
                id: node.identity.toString(),
                labels: node.labels,
                properties: node.properties,
            };
        } finally {
            await session.close();
        }
    }

    async deleteNode(nodeId: string): Promise<void> {
        const session = this.getSession();
        try {
            await session.run(
                'MATCH (n) WHERE id(n) = $id DETACH DELETE n',
                { id: parseInt(nodeId) }
            );
        } finally {
            await session.close();
        }
    }

    async getNodeRelationships(nodeId: string): Promise<GraphRelationship[]> {
        const session = this.getSession();
        try {
            const result = await session.run(
                `MATCH (n)-[r]-(m) 
         WHERE id(n) = $id 
         RETURN r, id(startNode(r)) as startId, id(endNode(r)) as endId`,
                { id: parseInt(nodeId) }
            );
            return result.records.map(record => {
                const rel = record.get('r');
                return {
                    id: rel.identity.toString(),
                    type: rel.type,
                    startNodeId: record.get('startId').toString(),
                    endNodeId: record.get('endId').toString(),
                    properties: rel.properties,
                };
            });
        } finally {
            await session.close();
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            if (!this.driver) return false;
            await this.driver.verifyConnectivity();
            return true;
        } catch (error) {
            console.error('Neo4j health check failed', error);
            return false;
        }
    }
}

export const neo4jService = new Neo4jService();
