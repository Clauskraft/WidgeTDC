/**
 * Neo4j Smoke Tests
 * Tests Neo4j connectivity and basic graph operations
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { neo4jService } from '../database/Neo4jService';
import { graphMemoryService } from '../memory/GraphMemoryService';

const shouldRunNeo4jTests = process.env.RUN_NEO4J_TESTS === 'true';
const describeNeo4j = shouldRunNeo4jTests ? describe : describe.skip;
let neo4jAvailable = false;

describeNeo4j('Neo4j Smoke Tests', () => {
    beforeAll(async () => {
        if (!shouldRunNeo4jTests) {
            neo4jAvailable = false;
            return;
        }
        try {
            await neo4jService.connect();
            neo4jAvailable = await neo4jService.healthCheck();
        } catch {
            neo4jAvailable = false;
            console.log('⚠️ Neo4j not available - Neo4j smoke tests will be skipped');
        }
    });

    afterAll(async () => {
        if (neo4jAvailable) {
            await neo4jService.disconnect();
        }
    });

    test('should connect and pass health check', async () => {
        const isHealthy = await neo4jService.healthCheck();
        expect(isHealthy).toBe(true);
    });

    test('should create and retrieve entity', async () => {

        const entity = await graphMemoryService.createEntity('Person', 'Test User', {
            email: 'test@example.com',
            role: 'tester',
        });
        expect(entity.id).toBeDefined();
        expect(entity.name).toBe('Test User');

        // Cleanup
        await graphMemoryService.deleteEntity(entity.id);
    });

    test('should create and manage relations', async () => {

        const entity1 = await graphMemoryService.createEntity('Person', 'Alice', {});
        const entity2 = await graphMemoryService.createEntity('Project', 'Project X', {});

        const relation = await graphMemoryService.createRelation(
            entity1.id,
            entity2.id,
            'WORKS_ON',
            { since: new Date().toISOString() }
        );
        expect(relation.id).toBeDefined();
        expect(relation.type).toBe('WORKS_ON');

        // Get related entities
        const related = await graphMemoryService.getRelatedEntities(entity1.id);
        expect(related.length).toBeGreaterThan(0);

        // Cleanup
        await graphMemoryService.deleteEntity(entity1.id);
        await graphMemoryService.deleteEntity(entity2.id);
    });

    test('should search entities', async () => {

        const entity = await graphMemoryService.createEntity('Person', 'Searchable User', {});

        const results = await graphMemoryService.searchEntities('Searchable');
        expect(results.length).toBeGreaterThan(0);

        // Cleanup
        await graphMemoryService.deleteEntity(entity.id);
    });

    test('should get graph statistics', async () => {

        const stats = await graphMemoryService.getStatistics();
        expect(stats).toBeDefined();
        expect(typeof stats.totalEntities).toBe('number');
    });
});

export { };
