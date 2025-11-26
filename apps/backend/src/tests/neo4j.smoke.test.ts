import { neo4jService } from '../database/Neo4jService';
import { graphMemoryService } from '../memory/GraphMemoryService';

/**
 * Test Neo4j connectivity and basic operations
 */
async function testNeo4jConnectivity() {
    console.log('🧪 Testing Neo4j connectivity...');

    try {
        // Connect to Neo4j
        await neo4jService.connect();
        console.log('✅ Neo4j connection established');

        // Health check
        const isHealthy = await neo4jService.healthCheck();
        if (!isHealthy) {
            throw new Error('Neo4j health check failed');
        }
        console.log('✅ Neo4j health check passed');

        // Create test entity
        const entity = await graphMemoryService.createEntity('Person', 'Test User', {
            email: 'test@example.com',
            role: 'tester',
        });
        console.log('✅ Created test entity', entity.id);

        // Create another entity
        const entity2 = await graphMemoryService.createEntity('Project', 'Test Project', {
            description: 'A test project',
        });
        console.log('✅ Created second test entity', entity2.id);

        // Create relation
        const relation = await graphMemoryService.createRelation(
            entity.id,
            entity2.id,
            'WORKS_ON',
            { since: new Date().toISOString() }
        );
        console.log('✅ Created test relation', relation.id);

        // Search entities
        const searchResults = await graphMemoryService.searchEntities('test');
        console.log('✅ Search test passed', searchResults.length, 'results');

        // Get related entities
        const related = await graphMemoryService.getRelatedEntities(entity.id);
        console.log('✅ Related entities test passed', related.length, 'related');

        // Get statistics
        const stats = await graphMemoryService.getStatistics();
        console.log('✅ Statistics test passed', stats);

        // Cleanup
        await graphMemoryService.deleteEntity(entity.id);
        await graphMemoryService.deleteEntity(entity2.id);
        console.log('✅ Cleanup completed');

        console.log('🎉 All Neo4j tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Neo4j test failed', error);
        return false;
    } finally {
        await neo4jService.disconnect();
    }
}

// Run if executed directly
testNeo4jConnectivity()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test execution failed', error);
        process.exit(1);
    });

export { testNeo4jConnectivity };
