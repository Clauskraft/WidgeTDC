/**
 * Graph Ingestion Runner
 * Executes the GraphIngestor to populate Neo4j
 */

import { ingestRepository } from './services/GraphIngestor.js';

async function runIngestion() {
    console.log('🚀 Starting WidgeTDC Repository Ingestion...\n');

    const result = await ingestRepository({
        rootPath: 'C:/Users/claus/Projects/WidgeTDC/WidgeTDC',
        repositoryName: 'WidgeTDC',
        maxDepth: 10
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 INGESTION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Success: ${result.success}`);
    console.log(`Repository ID: ${result.repositoryId}`);
    console.log(`\nStats:`);
    console.log(`  - Directories: ${result.stats.directoriesCreated}`);
    console.log(`  - Files: ${result.stats.filesCreated}`);
    console.log(`  - Relationships: ${result.stats.relationshipsCreated}`);
    console.log(`  - Total Nodes: ${result.stats.totalNodes}`);
    console.log(`  - Duration: ${result.stats.duration}ms`);
    
    if (result.errors.length > 0) {
        console.log(`\n⚠️ Errors (${result.errors.length}):`);
        result.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    }

    console.log('\n✅ Ingestion finished. Query with: MATCH (n) RETURN labels(n), count(*)');
    process.exit(0);
}

runIngestion().catch(err => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
});
