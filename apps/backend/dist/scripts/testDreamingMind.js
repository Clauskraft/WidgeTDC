/**
 * Test script for The Dreaming Mind (Level 3 HyperLog)
 *
 * Creates thoughts WITH embeddings and tests semantic search
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from '@xenova/transformers';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
// Embedding model
let embedder = null;
async function getEmbedding(text) {
    if (!embedder) {
        console.log('🔄 Loading embedding model (first time)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
        console.log('✅ Embedding model ready');
    }
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
async function testDreamingMind() {
    console.log('🧠 The Dreaming Mind - Level 3 Test');
    console.log('====================================');
    console.log(`Connecting to: ${NEO4J_URI}`);
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j Aura\n');
    const session = driver.session();
    const correlationId = uuidv4();
    try {
        // 1. Create Vector Index
        console.log('📇 Creating vector index...');
        try {
            await session.run(`
                CREATE VECTOR INDEX hyper_thought_vectors IF NOT EXISTS
                FOR (e:HyperEvent) ON (e.embedding)
                OPTIONS {indexConfig: {
                    \`vector.dimensions\`: 384,
                    \`vector.similarity_function\`: 'cosine'
                }}
            `);
            console.log('✅ Vector index ready (384D cosine)\n');
        }
        catch (e) {
            if (e.message.includes('already exists')) {
                console.log('✅ Vector index already exists\n');
            }
            else {
                console.warn('⚠️  Vector index issue:', e.message);
            }
        }
        // 2. Create thoughts WITH embeddings
        console.log('🧠 Creating thoughts with embeddings...\n');
        const thoughts = [
            { type: 'USER_INTENT', agent: 'GraphRAG', content: 'Analyze network security threats from firewall logs' },
            { type: 'THOUGHT', agent: 'GraphRAG', content: 'I should search for blocked connection attempts and failed authentications' },
            { type: 'DATA_RETRIEVAL', agent: 'GraphRAG', content: 'Found 47 blocked SSH attempts from IP 192.168.1.105 in the last hour' },
            { type: 'INSIGHT', agent: 'GraphRAG', content: 'This IP appears to be conducting a brute force attack against our SSH servers' },
            { type: 'THOUGHT', agent: 'ThreatHunter', content: 'Need to check if this IP has been flagged in threat intelligence databases' },
            { type: 'DATA_RETRIEVAL', agent: 'ThreatHunter', content: 'IP 192.168.1.105 is associated with known botnet infrastructure' },
            { type: 'CRITICAL_DECISION', agent: 'ThreatHunter', content: 'Recommending immediate IP block and security team notification' },
            { type: 'USER_INTENT', agent: 'Analyst', content: 'Generate a compliance report for GDPR data processing activities' },
            { type: 'THOUGHT', agent: 'Analyst', content: 'I need to gather all data processing records and retention policies' },
            { type: 'INSIGHT', agent: 'Analyst', content: 'Several data processing activities are missing proper consent documentation' },
        ];
        let prevId = null;
        for (const thought of thoughts) {
            const eventId = uuidv4();
            const timestamp = Date.now();
            // Generate embedding
            const embedding = await getEmbedding(thought.content);
            console.log(`  ✓ ${thought.type}: ${thought.content.substring(0, 45)}... [${embedding.length}D vector]`);
            // Store in Neo4j with embedding
            await session.run(`
                CREATE (e:HyperEvent {
                    id: $id,
                    type: $type,
                    agent: $agent,
                    content: $content,
                    timestamp: $timestamp,
                    correlationId: $correlationId,
                    embedding: $embedding,
                    metadata: '{}'
                })
            `, {
                id: eventId,
                type: thought.type,
                agent: thought.agent,
                content: thought.content,
                timestamp,
                correlationId,
                embedding
            });
            // Create causal chain
            if (prevId) {
                await session.run(`
                    MATCH (prev:HyperEvent {id: $prevId})
                    MATCH (curr:HyperEvent {id: $currId})
                    CREATE (prev)-[:LED_TO]->(curr)
                `, { prevId, currId: eventId });
            }
            prevId = eventId;
            await new Promise(r => setTimeout(r, 100));
        }
        console.log('\n✅ All thoughts created with embeddings\n');
        // 3. Wait for index to populate
        console.log('⏳ Waiting for vector index to populate...');
        await new Promise(r => setTimeout(r, 3000));
        // 4. Test semantic search - "Dream Mode"
        console.log('\n🌙 DREAM MODE: Testing semantic search\n');
        const searchQueries = [
            'cybersecurity attack detection',
            'GDPR compliance issues',
            'network intrusion',
        ];
        for (const query of searchQueries) {
            console.log(`\n🔍 Searching: "${query}"`);
            const queryVector = await getEmbedding(query);
            const result = await session.run(`
                CALL db.index.vector.queryNodes('hyper_thought_vectors', 3, $queryVector)
                YIELD node, score
                RETURN node.content AS content, node.agent AS agent, node.type AS type, score
                ORDER BY score DESC
            `, { queryVector });
            if (result.records.length === 0) {
                console.log('   No results found');
            }
            else {
                result.records.forEach((r, i) => {
                    const score = r.get('score').toFixed(3);
                    const content = r.get('content').substring(0, 60);
                    const agent = r.get('agent');
                    console.log(`   ${i + 1}. [${score}] (${agent}) ${content}...`);
                });
            }
        }
        // 5. Verify embeddings stored
        console.log('\n\n📊 Verification:');
        const countResult = await session.run(`
            MATCH (e:HyperEvent)
            WHERE e.embedding IS NOT NULL
            RETURN count(e) as count, avg(size(e.embedding)) as avgDim
        `);
        const count = countResult.records[0].get('count').toNumber();
        const avgDim = countResult.records[0].get('avgDim');
        console.log(`  Thoughts with embeddings: ${count}`);
        console.log(`  Average embedding dimension: ${avgDim}`);
        const totalResult = await session.run('MATCH (e:HyperEvent) RETURN count(e) as total');
        console.log(`  Total HyperEvents: ${totalResult.records[0].get('total').toNumber()}`);
        console.log('\n✅ The Dreaming Mind is ACTIVE!');
        console.log('\n📋 Neo4j Browser query to visualize:');
        console.log('   MATCH (e:HyperEvent) WHERE e.embedding IS NOT NULL RETURN e.content, size(e.embedding) LIMIT 10');
    }
    finally {
        await session.close();
        await driver.close();
    }
}
testDreamingMind()
    .then(() => process.exit(0))
    .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
