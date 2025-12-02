import { neo4jService } from '../database/Neo4jService';
import { logger } from '../utils/logger';
export class GraphMemoryService {
    /**
     * Create an entity in the knowledge graph
     */
    async createEntity(type, name, properties = {}) {
        const now = new Date();
        const nodeProps = {
            type,
            name,
            ...properties,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };
        const node = await neo4jService.createNode(['Entity', type], nodeProps);
        return {
            id: node.id,
            type,
            name,
            properties: node.properties,
            createdAt: now,
            updatedAt: now,
        };
    }
    /**
     * Create a relation between two entities
     */
    async createRelation(sourceId, targetId, type, properties = {}) {
        const now = new Date();
        const relProps = {
            ...properties,
            createdAt: now.toISOString(),
        };
        const rel = await neo4jService.createRelationship(sourceId, targetId, type, relProps);
        return {
            id: rel.id,
            type,
            sourceId: rel.startNodeId,
            targetId: rel.endNodeId,
            properties: rel.properties,
            createdAt: now,
        };
    }
    /**
     * Find entities by type
     */
    async findEntitiesByType(type) {
        const nodes = await neo4jService.findNodes('Entity', { type });
        return nodes.map(node => ({
            id: node.id,
            type: node.properties.type,
            name: node.properties.name,
            properties: node.properties,
            createdAt: new Date(node.properties.createdAt),
            updatedAt: new Date(node.properties.updatedAt),
        }));
    }
    /**
     * Get entity with its relations
     */
    async getEntityWithRelations(entityId) {
        const node = await neo4jService.getNodeById(entityId);
        if (!node) {
            return { entity: null, relations: [] };
        }
        const entity = {
            id: node.id,
            type: node.properties.type,
            name: node.properties.name,
            properties: node.properties,
            createdAt: new Date(node.properties.createdAt),
            updatedAt: new Date(node.properties.updatedAt),
        };
        const rels = await neo4jService.getNodeRelationships(entityId);
        const relations = rels.map(rel => ({
            id: rel.id,
            type: rel.type,
            sourceId: rel.startNodeId,
            targetId: rel.endNodeId,
            properties: rel.properties,
            createdAt: new Date(rel.properties.createdAt),
        }));
        return { entity, relations };
    }
    /**
     * Search entities by name (fuzzy)
     */
    async searchEntities(query, limit = 10) {
        const results = await neo4jService.runQuery(`MATCH (n:Entity)
       WHERE toLower(n.name) CONTAINS toLower($query)
       RETURN n
       LIMIT $limit`, { query, limit });
        return results.map(record => {
            const node = record.n;
            return {
                id: node.identity.toString(),
                type: node.properties.type,
                name: node.properties.name,
                properties: node.properties,
                createdAt: new Date(node.properties.createdAt),
                updatedAt: new Date(node.properties.updatedAt),
            };
        });
    }
    /**
     * Get related entities (1-hop neighbors)
     */
    async getRelatedEntities(entityId, relationType) {
        const relationFilter = relationType ? `[r:${relationType}]` : '[r]';
        const results = await neo4jService.runQuery(`MATCH (n:Entity)-${relationFilter}-(m:Entity)
       WHERE id(n) = $id
       RETURN DISTINCT m`, { id: parseInt(entityId) });
        return results.map(record => {
            const node = record.m;
            return {
                id: node.identity.toString(),
                type: node.properties.type,
                name: node.properties.name,
                properties: node.properties,
                createdAt: new Date(node.properties.createdAt),
                updatedAt: new Date(node.properties.updatedAt),
            };
        });
    }
    /**
     * Find path between two entities
     */
    async findPath(sourceId, targetId, maxDepth = 5) {
        const results = await neo4jService.runQuery(`MATCH path = shortestPath((source:Entity)-[*..${maxDepth}]-(target:Entity))
       WHERE id(source) = $sourceId AND id(target) = $targetId
       RETURN nodes(path) as nodes, relationships(path) as rels`, { sourceId: parseInt(sourceId), targetId: parseInt(targetId) });
        if (results.length === 0) {
            return null;
        }
        const record = results[0];
        const path = record.nodes.map((node) => ({
            id: node.identity.toString(),
            type: node.properties.type,
            name: node.properties.name,
            properties: node.properties,
            createdAt: new Date(node.properties.createdAt),
            updatedAt: new Date(node.properties.updatedAt),
        }));
        const relations = record.rels.map((rel) => ({
            id: rel.identity.toString(),
            type: rel.type,
            sourceId: rel.start.toString(),
            targetId: rel.end.toString(),
            properties: rel.properties,
            createdAt: new Date(rel.properties.createdAt),
        }));
        return { path, relations };
    }
    /**
     * Delete entity and its relations
     */
    async deleteEntity(entityId) {
        await neo4jService.deleteNode(entityId);
        logger.info('Entity deleted from graph', { entityId });
    }
    /**
     * Update entity properties
     */
    async updateEntity(entityId, properties) {
        const now = new Date();
        const updateProps = {
            ...properties,
            updatedAt: now.toISOString(),
        };
        const results = await neo4jService.runQuery(`MATCH (n:Entity)
       WHERE id(n) = $id
       SET n += $properties
       RETURN n`, { id: parseInt(entityId), properties: updateProps });
        if (results.length === 0) {
            return null;
        }
        const node = results[0].n;
        return {
            id: node.identity.toString(),
            type: node.properties.type,
            name: node.properties.name,
            properties: node.properties,
            createdAt: new Date(node.properties.createdAt),
            updatedAt: now,
        };
    }
    /**
     * Get graph statistics
     */
    async getStatistics() {
        const [entityCount, relationCount, entityTypes, relationTypes] = await Promise.all([
            neo4jService.runQuery('MATCH (n:Entity) RETURN count(n) as count'),
            neo4jService.runQuery('MATCH ()-[r]->() RETURN count(r) as count'),
            neo4jService.runQuery('MATCH (n:Entity) RETURN n.type as type, count(*) as count'),
            neo4jService.runQuery('MATCH ()-[r]->() RETURN type(r) as type, count(*) as count'),
        ]);
        return {
            totalEntities: entityCount[0]?.count?.toNumber() || 0,
            totalRelations: relationCount[0]?.count?.toNumber() || 0,
            entityTypes: entityTypes.reduce((acc, record) => {
                acc[record.type] = record.count.toNumber();
                return acc;
            }, {}),
            relationTypes: relationTypes.reduce((acc, record) => {
                acc[record.type] = record.count.toNumber();
                return acc;
            }, {}),
        };
    }
}
export const graphMemoryService = new GraphMemoryService();
