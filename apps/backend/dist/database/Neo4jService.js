import neo4j from 'neo4j-driver';
export class Neo4jService {
    constructor() {
        this.driver = null;
        this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        // Support both NEO4J_USER and NEO4J_USERNAME for compatibility
        this.username = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j';
        this.password = process.env.NEO4J_PASSWORD || 'password';
    }
    async connect() {
        try {
            this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.username, this.password), {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 60000,
            });
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connected successfully', this.uri);
        }
        catch (error) {
            console.error('❌ Failed to connect to Neo4j', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('Neo4j disconnected');
        }
    }
    async close() {
        await this.disconnect();
    }
    getSession() {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized. Call connect() first.');
        }
        return this.driver.session();
    }
    async createNode(labels, properties) {
        const session = this.getSession();
        try {
            const labelsStr = labels.map(l => `:${l}`).join('');
            const result = await session.run(`CREATE (n${labelsStr} $properties) RETURN n`, { properties });
            const node = result.records[0].get('n');
            return {
                id: node.elementId,
                labels: node.labels,
                properties: node.properties,
            };
        }
        finally {
            await session.close();
        }
    }
    async createRelationship(startNodeId, endNodeId, type, properties = {}) {
        const session = this.getSession();
        try {
            // Use elementId lookup instead of id()
            const result = await session.run(`MATCH (a), (b)
         WHERE elementId(a) = $startId AND elementId(b) = $endId
         CREATE (a)-[r:${type} $properties]->(b)
         RETURN r`, { startId: startNodeId, endId: endNodeId, properties });
            const rel = result.records[0].get('r');
            return {
                id: rel.elementId,
                type: rel.type,
                startNodeId: rel.startNodeElementId,
                endNodeId: rel.endNodeElementId,
                properties: rel.properties,
            };
        }
        finally {
            await session.close();
        }
    }
    async findNodes(label, properties = {}) {
        const session = this.getSession();
        try {
            const whereClause = Object.keys(properties).length > 0
                ? 'WHERE ' + Object.keys(properties).map(k => `n.${k} = $${k}`).join(' AND ')
                : '';
            const result = await session.run(`MATCH (n:${label}) ${whereClause} RETURN n`, properties);
            return result.records.map(record => {
                const node = record.get('n');
                return {
                    id: node.elementId,
                    labels: node.labels,
                    properties: node.properties,
                };
            });
        }
        finally {
            await session.close();
        }
    }
    async runQuery(query, parameters = {}) {
        const session = this.getSession();
        try {
            const result = await session.run(query, parameters);
            return result.records.map(record => record.toObject());
        }
        finally {
            await session.close();
        }
    }
    async getNodeById(nodeId) {
        const session = this.getSession();
        try {
            const result = await session.run('MATCH (n) WHERE elementId(n) = $id RETURN n', { id: nodeId });
            if (result.records.length === 0)
                return null;
            const node = result.records[0].get('n');
            return {
                id: node.elementId,
                labels: node.labels,
                properties: node.properties,
            };
        }
        finally {
            await session.close();
        }
    }
    async deleteNode(nodeId) {
        const session = this.getSession();
        try {
            await session.run('MATCH (n) WHERE elementId(n) = $id DETACH DELETE n', { id: nodeId });
        }
        finally {
            await session.close();
        }
    }
    async getNodeRelationships(nodeId) {
        const session = this.getSession();
        try {
            const result = await session.run(`MATCH (n)-[r]-(m) 
         WHERE elementId(n) = $id 
         RETURN r`, { id: nodeId });
            return result.records.map(record => {
                const rel = record.get('r');
                return {
                    id: rel.elementId,
                    type: rel.type,
                    startNodeId: rel.startNodeElementId,
                    endNodeId: rel.endNodeElementId,
                    properties: rel.properties,
                };
            });
        }
        finally {
            await session.close();
        }
    }
    async healthCheck() {
        try {
            if (!this.driver)
                return false;
            await this.driver.verifyConnectivity();
            return true;
        }
        catch (error) {
            console.error('Neo4j health check failed', error);
            return false;
        }
    }
}
export const neo4jService = new Neo4jService();
