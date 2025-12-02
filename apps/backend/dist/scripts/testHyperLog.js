/**
 * Test script for HyperLog - creates a sample thought chain in Neo4j
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
async function createTestChain() {
    console.log('🧠 HyperLog Test - Creating Thought Stream Chain');
    console.log('================================================');
    console.log(`Connecting to: ${NEO4J_URI}`);
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j Aura');
    const session = driver.session();
    const correlationId = uuidv4();
    try {
        // Create indexes first
        console.log('\n📇 Creating indexes...');
        await session.run(`CREATE INDEX hyper_event_id IF NOT EXISTS FOR (e:HyperEvent) ON (e.id)`);
        await session.run(`CREATE INDEX hyper_event_timestamp IF NOT EXISTS FOR (e:HyperEvent) ON (e.timestamp)`);
        // Define the thought chain
        const events = [
            { type: 'USER_INTENT', agent: 'GraphRAG', content: 'User requested: Analyze recent firewall logs for threats' },
            { type: 'THOUGHT', agent: 'GraphRAG', content: 'I need to search the vector store for relevant log entries' },
            { type: 'TOOL_SELECTION', agent: 'GraphRAG', content: 'Selecting vidensarkiv.search - best for semantic search over logs' },
            { type: 'TOOL_EXECUTION', agent: 'GraphRAG', content: 'Executed vidensarkiv.search with query: "firewall blocked suspicious"' },
            { type: 'DATA_RETRIEVAL', agent: 'GraphRAG', content: 'Retrieved 23 relevant log entries from last 24 hours' },
            { type: 'THOUGHT', agent: 'GraphRAG', content: 'Analyzing patterns in the retrieved data...' },
            { type: 'REASONING_UPDATE', agent: 'GraphRAG', content: 'Detected unusual spike: 150+ blocked attempts from same IP range' },
            { type: 'HYPOTHESIS', agent: 'GraphRAG', content: 'This pattern matches brute force attack signature with 94% confidence' },
            { type: 'TOOL_SELECTION', agent: 'GraphRAG', content: 'Selecting threat.hunt to correlate with known attack patterns' },
            { type: 'TOOL_EXECUTION', agent: 'GraphRAG', content: 'Cross-referenced with ThreatIntel database' },
            { type: 'INSIGHT', agent: 'GraphRAG', content: 'CONFIRMED: Coordinated brute force attack from botnet. Recommend immediate IP block.' },
            { type: 'CRITICAL_DECISION', agent: 'GraphRAG', content: 'Flagging for human review before automated response' }
        ];
        console.log('\n🔗 Creating thought chain...');
        let prevId = null;
        for (const evt of events) {
            const eventId = uuidv4();
            const timestamp = Date.now();
            // Create the event node
            await session.run(`
                CREATE (e:HyperEvent {
                    id: $id,
                    type: $type,
                    agent: $agent,
                    content: $content,
                    timestamp: $timestamp,
                    correlationId: $correlationId,
                    metadata: '{}'
                })
            `, {
                id: eventId,
                type: evt.type,
                agent: evt.agent,
                content: evt.content,
                timestamp,
                correlationId
            });
            // Create LED_TO relationship
            if (prevId) {
                await session.run(`
                    MATCH (prev:HyperEvent {id: $prevId})
                    MATCH (curr:HyperEvent {id: $currId})
                    CREATE (prev)-[:LED_TO]->(curr)
                `, { prevId, currId: eventId });
            }
            // Link to Agent if exists
            await session.run(`
                MATCH (a:Agent {name: $agentName})
                MATCH (e:HyperEvent {id: $eventId})
                MERGE (a)-[:GENERATED]->(e)
            `, { agentName: evt.agent, eventId });
            console.log(`  ✓ ${evt.type}: ${evt.content.substring(0, 50)}...`);
            prevId = eventId;
            // Small delay to spread timestamps
            await new Promise(r => setTimeout(r, 50));
        }
        // Verify the chain
        console.log('\n📊 Verification:');
        const countResult = await session.run('MATCH (e:HyperEvent) RETURN count(e) as count');
        console.log(`  Total HyperEvents: ${countResult.records[0].get('count').toNumber()}`);
        const chainResult = await session.run(`
            MATCH p=(:HyperEvent)-[:LED_TO*]->(:HyperEvent)
            RETURN length(p) as chainLength
            ORDER BY chainLength DESC
            LIMIT 1
        `);
        const maxChain = chainResult.records[0]?.get('chainLength')?.toNumber() || 0;
        console.log(`  Longest chain: ${maxChain + 1} events`);
        const agentLinks = await session.run(`
            MATCH (a:Agent)-[:GENERATED]->(e:HyperEvent)
            RETURN a.name as agent, count(e) as events
        `);
        console.log('  Agent activity:');
        agentLinks.records.forEach(r => {
            console.log(`    - ${r.get('agent')}: ${r.get('events').toNumber()} events`);
        });
        console.log('\n✅ Test chain created successfully!');
        console.log('\n📋 To visualize in Neo4j Browser, run:');
        console.log('   MATCH p=(:HyperEvent)-[:LED_TO*]->(:HyperEvent) RETURN p LIMIT 25');
    }
    finally {
        await session.close();
        await driver.close();
    }
}
createTestChain()
    .then(() => process.exit(0))
    .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
