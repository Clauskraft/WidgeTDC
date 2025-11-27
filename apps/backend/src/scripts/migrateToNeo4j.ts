import { getDatabase } from '../database/index.js';
import { neo4jService } from '../database/Neo4jService';
import { graphMemoryService } from '../memory/GraphMemoryService';

/**
 * Migrate memory_entities and memory_relations from SQLite to Neo4j
 */
export async function migrateMemoryToNeo4j() {
    console.log('🔄 Starting migration from SQLite to Neo4j...');

    const db = getDatabase();

    try {
        // Connect to Neo4j
        await neo4jService.connect();

        // Step 1: Migrate memory_entities to Neo4j nodes
        console.log('📦 Migrating memory_entities...');
        const entities = db.prepare('SELECT * FROM memory_entities').all() as any[];

        const entityIdMap = new Map<number, string>(); // SQLite ID -> Neo4j ID

        for (const entity of entities) {
            const neo4jNode = await graphMemoryService.createEntity(
                entity.entity_type,
                entity.content.substring(0, 100), // Use first 100 chars as name
                {
                    orgId: entity.org_id,
                    userId: entity.user_id,
                    content: entity.content,
                    importance: entity.importance,
                    createdAt: entity.created_at,
                }
            );

            entityIdMap.set(entity.id, neo4jNode.id);

            // Migrate tags
            const tags = db.prepare('SELECT tag FROM memory_tags WHERE entity_id = ?').all(entity.id) as any[];
            for (const tagRow of tags) {
                // Add tag as property or create separate Tag nodes
                await neo4jService.runQuery(
                    `MATCH (n) WHERE id(n) = $id 
           SET n.tags = CASE WHEN n.tags IS NULL THEN [$tag] ELSE n.tags + $tag END`,
                    { id: parseInt(neo4jNode.id), tag: tagRow.tag }
                );
            }
        }

        console.log(`✅ Migrated ${entities.length} entities`);

        // Step 2: Migrate memory_relations to Neo4j relationships
        console.log('🔗 Migrating memory_relations...');
        const relations = db.prepare('SELECT * FROM memory_relations').all() as any[];

        for (const relation of relations) {
            const sourceNeo4jId = entityIdMap.get(relation.source_id);
            const targetNeo4jId = entityIdMap.get(relation.target_id);

            if (sourceNeo4jId && targetNeo4jId) {
                await graphMemoryService.createRelation(
                    sourceNeo4jId,
                    targetNeo4jId,
                    relation.relation_type,
                    {
                        orgId: relation.org_id,
                        createdAt: relation.created_at,
                    }
                );
            } else {
                console.warn(`⚠️  Skipping relation ${relation.id}: missing source or target`);
            }
        }

        console.log(`✅ Migrated ${relations.length} relations`);

        // Step 3: Verify migration
        const stats = await graphMemoryService.getStatistics();
        console.log('📊 Migration Statistics:', stats);

        console.log('🎉 Migration completed successfully!');

        return {
            entitiesMigrated: entities.length,
            relationsMigrated: relations.length,
            stats,
        };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await neo4jService.disconnect();
    }
}

/**
 * Rollback migration - delete all migrated data from Neo4j
 */
export async function rollbackMigration() {
    console.log('🔄 Rolling back migration...');

    try {
        await neo4jService.connect();

        // Delete all nodes and relationships
        await neo4jService.runQuery('MATCH (n) DETACH DELETE n');

        console.log('✅ Rollback completed');
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    } finally {
        await neo4jService.disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    migrateMemoryToNeo4j()
        .then(result => {
            console.log('Migration result:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration error:', error);
            process.exit(1);
        });
}
