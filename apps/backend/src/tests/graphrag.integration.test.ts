import { neo4jService } from '../database/Neo4jService';
import { graphMemoryService } from '../memory/GraphMemoryService';

describe('GraphRAG Integration Tests', () => {
    beforeAll(async () => {
        await neo4jService.connect();
    });

    afterAll(async () => {
        // Cleanup test data
        await neo4jService.runQuery('MATCH (n:TestEntity) DETACH DELETE n');
        await neo4jService.disconnect();
    });

    test('should create entity and retrieve it', async () => {
        const entity = await graphMemoryService.createEntity(
            'TestEntity',
            'Test Person',
            { role: 'developer', team: 'backend' }
        );

        expect(entity.id).toBeDefined();
        expect(entity.name).toBe('Test Person');
        expect(entity.type).toBe('TestEntity');

        const retrieved = await neo4jService.getNodeById(entity.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.properties.role).toBe('developer');
    });

    test('should create relation between entities', async () => {
        const person = await graphMemoryService.createEntity('TestEntity', 'Alice', {});
        const project = await graphMemoryService.createEntity('TestEntity', 'Project X', {});

        const relation = await graphMemoryService.createRelation(
            person.id,
            project.id,
            'WORKS_ON',
            { since: '2025-01-01' }
        );

        expect(relation.id).toBeDefined();
        expect(relation.type).toBe('WORKS_ON');
        expect(relation.sourceId).toBe(person.id);
        expect(relation.targetId).toBe(project.id);
    });

    test('should search entities by name', async () => {
        await graphMemoryService.createEntity('TestEntity', 'Bob Smith', { role: 'designer' });
        await graphMemoryService.createEntity('TestEntity', 'Bob Jones', { role: 'developer' });

        const results = await graphMemoryService.searchEntities('Bob');

        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.some(e => e.name.includes('Bob'))).toBe(true);
    });

    test('should get related entities', async () => {
        const alice = await graphMemoryService.createEntity('TestEntity', 'Alice', {});
        const bob = await graphMemoryService.createEntity('TestEntity', 'Bob', {});
        const charlie = await graphMemoryService.createEntity('TestEntity', 'Charlie', {});

        await graphMemoryService.createRelation(alice.id, bob.id, 'KNOWS');
        await graphMemoryService.createRelation(alice.id, charlie.id, 'KNOWS');

        const related = await graphMemoryService.getRelatedEntities(alice.id);

        expect(related.length).toBe(2);
        expect(related.some(e => e.name === 'Bob')).toBe(true);
        expect(related.some(e => e.name === 'Charlie')).toBe(true);
    });

    test('should find path between entities', async () => {
        const a = await graphMemoryService.createEntity('TestEntity', 'A', {});
        const b = await graphMemoryService.createEntity('TestEntity', 'B', {});
        const c = await graphMemoryService.createEntity('TestEntity', 'C', {});

        await graphMemoryService.createRelation(a.id, b.id, 'CONNECTS');
        await graphMemoryService.createRelation(b.id, c.id, 'CONNECTS');

        const path = await graphMemoryService.findPath(a.id, c.id);

        expect(path).toBeDefined();
        expect(path?.path.length).toBe(3); // A -> B -> C
        expect(path?.relations.length).toBe(2);
    });

    test('should get graph statistics', async () => {
        const stats = await graphMemoryService.getStatistics();

        expect(stats.totalEntities).toBeGreaterThan(0);
        expect(stats.entityTypes).toBeDefined();
        expect(stats.relationTypes).toBeDefined();
    });

    test('should update entity properties', async () => {
        const entity = await graphMemoryService.createEntity('TestEntity', 'Test', { version: 1 });

        const updated = await graphMemoryService.updateEntity(entity.id, { version: 2, status: 'active' });

        expect(updated).toBeDefined();
        expect(updated?.properties.version).toBe(2);
        expect(updated?.properties.status).toBe('active');
    });

    test('should delete entity and its relations', async () => {
        const entity = await graphMemoryService.createEntity('TestEntity', 'ToDelete', {});
        const other = await graphMemoryService.createEntity('TestEntity', 'Other', {});

        await graphMemoryService.createRelation(entity.id, other.id, 'TEMP');

        await graphMemoryService.deleteEntity(entity.id);

        const retrieved = await neo4jService.getNodeById(entity.id);
        expect(retrieved).toBeNull();
    });
});

export { };
