import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });

import { knowledgeAcquisition } from '../services/KnowledgeAcquisitionService.js';
import { neo4jAdapter } from '../adapters/Neo4jAdapter.js';
import { getPgVectorStore } from '../platform/vector/PgVectorStoreAdapter.js';

async function main() {
    console.log('🚀 Starting ingestion of Target I01 (Nuuday Design Guide)...');

    try {
        // Initialize connections
        console.log('🔌 Connecting to databases...');
        const vectorStore = getPgVectorStore();
        await vectorStore.initialize();

        // Run ingestion
        const result = await knowledgeAcquisition.acquireSingleTarget('I01');

        if (result && result.success) {
            console.log('✅ Ingestion Successful!');
            console.log('-----------------------------------');
            console.log(`📄 Source ID: ${result.sourceId}`);
            console.log(`🧩 Chunks: ${result.chunks}`);
            console.log(`🏷️ Entities: ${result.entitiesExtracted}`);
            console.log(`🔢 Vectors: ${result.vectorsStored}`);
            console.log(`🕸️ Graph Nodes: ${result.graphNodesCreated}`);
            console.log(`⏱️ Duration: ${result.duration}ms`);
            console.log('-----------------------------------');
        } else {
            console.error('❌ Ingestion Failed');
            if (result) {
                console.error('Errors:', result.errors);
            } else {
                console.error('Target I01 not found in KNOWLEDGE_TARGETS.json');
            }
        }

    } catch (error) {
        console.error('💥 Fatal Error:', error);
    } finally {
        // Cleanup
        await neo4jAdapter.close();
        process.exit(0);
    }
}

main();
