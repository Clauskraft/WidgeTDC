/**
 * Neo4j Database Initialization Script
 *
 * Sets up schema, constraints, indexes, and seed data for WidgeTDC
 * With robust retry logic for transient errors (deadlocks, etc.)
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
// Load .env from backend directory (don't override existing env vars)
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env'), override: false });
// Support both NEO4J_USER and NEO4J_USERNAME for compatibility
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function isRetriableError(error) {
    return error?.code?.includes('TransientError') ||
        error?.code?.includes('Deadlock') ||
        error?.retriable === true ||
        error?.retryable === true ||
        error?.message?.includes('deadlock') ||
        error?.message?.includes('lock');
}
async function runQueryWithRetry(session, query, params = {}, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await session.run(query, params);
            const preview = query.split('\n').find(l => l.trim())?.substring(0, 50) || query.substring(0, 50);
            console.log(`  ✓ ...`);
            return;
        }
        catch (error) {
            // Ignore "already exists" errors for constraints/indexes
            if (error.message?.includes('already exists') || error.message?.includes('EquivalentSchemaRule')) {
                console.log(`  ⏭ Already exists`);
                return;
            }
            // Retry on transient errors
            if (isRetriableError(error) && attempt < retries) {
                console.log(`  ⚠️  Retrying (${attempt}/${retries}) after transient error...`);
                await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
                continue;
            }
            throw error;
        }
    }
}
async function createConstraints(driver) {
    console.log('\n📋 Creating constraints...');
    // Run each constraint in its own session to avoid deadlocks
    const constraints = [
        `CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE`,
        `CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE`,
        `CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE`,
        `CREATE CONSTRAINT memory_id IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE`,
        `CREATE CONSTRAINT task_id IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE`,
        `CREATE CONSTRAINT pattern_id IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE`,
    ];
    for (const constraint of constraints) {
        const session = driver.session();
        try {
            await runQueryWithRetry(session, constraint);
        }
        finally {
            await session.close();
        }
        // Small delay between constraints to reduce contention
        await sleep(100);
    }
}
async function createIndexes(driver) {
    console.log('\n📇 Creating indexes...');
    const indexes = [
        `CREATE FULLTEXT INDEX entity_fulltext IF NOT EXISTS FOR (e:Entity) ON EACH [e.name, e.content, e.description]`,
        `CREATE FULLTEXT INDEX document_fulltext IF NOT EXISTS FOR (d:Document) ON EACH [d.title, d.content, d.summary]`,
        `CREATE FULLTEXT INDEX memory_fulltext IF NOT EXISTS FOR (m:Memory) ON EACH [m.content, m.context]`,
        `CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)`,
        `CREATE INDEX entity_created IF NOT EXISTS FOR (e:Entity) ON (e.createdAt)`,
        `CREATE INDEX document_type IF NOT EXISTS FOR (d:Document) ON (d.type)`,
        `CREATE INDEX agent_status IF NOT EXISTS FOR (a:Agent) ON (a.status)`,
        `CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status)`,
        `CREATE INDEX memory_importance IF NOT EXISTS FOR (m:Memory) ON (m.importance)`,
    ];
    for (const index of indexes) {
        const session = driver.session();
        try {
            await runQueryWithRetry(session, index);
        }
        finally {
            await session.close();
        }
        await sleep(100);
    }
}
async function createSeedData(driver) {
    console.log('\n🌱 Creating seed data...');
    const now = new Date().toISOString();
    const session = driver.session();
    try {
        // System Agent
        await runQueryWithRetry(session, `
            MERGE (a:Agent:Entity {id: 'agent-system'})
            SET a.name = 'System Agent',
                a.type = 'orchestrator',
                a.status = 'active',
                a.description = 'Core system orchestrator agent',
                a.createdAt = $now,
                a.updatedAt = $now
        `, { now });
        // HansPedder Agent
        await runQueryWithRetry(session, `
            MERGE (a:Agent:Entity {id: 'agent-hanspedder'})
            SET a.name = 'HansPedder',
                a.type = 'qa-tester',
                a.status = 'active',
                a.description = 'Autonomous QA testing agent',
                a.capabilities = ['testing', 'validation', 'reporting'],
                a.createdAt = $now,
                a.updatedAt = $now
        `, { now });
        // GraphRAG Agent
        await runQueryWithRetry(session, `
            MERGE (a:Agent:Entity {id: 'agent-graphrag'})
            SET a.name = 'GraphRAG Engine',
                a.type = 'retrieval',
                a.status = 'active',
                a.description = 'Graph-enhanced retrieval augmented generation',
                a.capabilities = ['search', 'retrieval', 'synthesis'],
                a.createdAt = $now,
                a.updatedAt = $now
        `, { now });
        // WidgeTDC Organization
        await runQueryWithRetry(session, `
            MERGE (o:Organization:Entity {id: 'org-widgetdc'})
            SET o.name = 'WidgeTDC',
                o.type = 'Organization',
                o.description = 'Enterprise Intelligence Platform',
                o.createdAt = $now,
                o.updatedAt = $now
        `, { now });
        // Knowledge Domains
        const domains = [
            { id: 'domain-security', name: 'Security', description: 'Cybersecurity and threat intelligence' },
            { id: 'domain-compliance', name: 'Compliance', description: 'GDPR, regulatory compliance' },
            { id: 'domain-analytics', name: 'Analytics', description: 'Data analytics and insights' },
            { id: 'domain-agents', name: 'Agents', description: 'Autonomous agent coordination' }
        ];
        for (const domain of domains) {
            await runQueryWithRetry(session, `
                MERGE (d:Domain:Entity {id: $id})
                SET d.name = $name,
                    d.type = 'Domain',
                    d.description = $description,
                    d.createdAt = $now,
                    d.updatedAt = $now
            `, { ...domain, now });
        }
        // Sample Documents
        await runQueryWithRetry(session, `
            MERGE (d:Document:Entity {id: 'doc-system-architecture'})
            SET d.title = 'WidgeTDC System Architecture',
                d.type = 'documentation',
                d.content = 'WidgeTDC is an enterprise-grade autonomous intelligence platform built as a TypeScript monorepo.',
                d.summary = 'Core system architecture documentation',
                d.source = 'internal',
                d.createdAt = $now,
                d.updatedAt = $now
        `, { now });
        await runQueryWithRetry(session, `
            MERGE (d:Document:Entity {id: 'doc-mcp-protocol'})
            SET d.title = 'MCP Protocol Integration',
                d.type = 'documentation',
                d.content = 'Model Context Protocol enables AI agents to communicate with external tools and data sources.',
                d.summary = 'MCP protocol documentation',
                d.source = 'internal',
                d.createdAt = $now,
                d.updatedAt = $now
        `, { now });
        // Sample Task
        await runQueryWithRetry(session, `
            MERGE (t:Task:Entity {id: 'task-init-neo4j'})
            SET t.name = 'Initialize Neo4j Database',
                t.type = 'setup',
                t.status = 'completed',
                t.description = 'Set up Neo4j schema, constraints, and seed data',
                t.createdAt = $now,
                t.completedAt = $now
        `, { now });
        // Sample Pattern
        await runQueryWithRetry(session, `
            MERGE (p:Pattern:Entity {id: 'pattern-graph-query'})
            SET p.name = 'Graph Query Pattern',
                p.type = 'query',
                p.description = 'Common pattern for querying knowledge graph',
                p.frequency = 0,
                p.successRate = 1.0,
                p.createdAt = $now,
                p.updatedAt = $now
        `, { now });
        // Sample Memory
        await runQueryWithRetry(session, `
            MERGE (m:Memory:Entity {id: 'memory-system-init'})
            SET m.content = 'System initialized successfully with Neo4j knowledge graph',
                m.context = 'system-startup',
                m.importance = 0.8,
                m.type = 'episodic',
                m.createdAt = $now
        `, { now });
    }
    finally {
        await session.close();
    }
}
async function createRelationships(driver) {
    console.log('\n🔗 Creating relationships...');
    const session = driver.session();
    try {
        // Agents belong to organization
        await runQueryWithRetry(session, `
            MATCH (a:Agent), (o:Organization {id: 'org-widgetdc'})
            WHERE a.id IN ['agent-system', 'agent-hanspedder', 'agent-graphrag']
            MERGE (a)-[:BELONGS_TO]->(o)
        `);
        // Agents manage domains
        await runQueryWithRetry(session, `
            MATCH (a:Agent {id: 'agent-hanspedder'}), (d:Domain {id: 'domain-agents'})
            MERGE (a)-[:MANAGES]->(d)
        `);
        await runQueryWithRetry(session, `
            MATCH (a:Agent {id: 'agent-graphrag'}), (d:Domain {id: 'domain-analytics'})
            MERGE (a)-[:MANAGES]->(d)
        `);
        // Documents relate to domains
        await runQueryWithRetry(session, `
            MATCH (doc:Document {id: 'doc-system-architecture'}), (d:Domain {id: 'domain-analytics'})
            MERGE (doc)-[:RELATES_TO]->(d)
        `);
        await runQueryWithRetry(session, `
            MATCH (doc:Document {id: 'doc-mcp-protocol'}), (d:Domain {id: 'domain-agents'})
            MERGE (doc)-[:RELATES_TO]->(d)
        `);
        // System agent created task
        await runQueryWithRetry(session, `
            MATCH (a:Agent {id: 'agent-system'}), (t:Task {id: 'task-init-neo4j'})
            MERGE (a)-[:CREATED]->(t)
        `);
        // Memory created by system
        await runQueryWithRetry(session, `
            MATCH (a:Agent {id: 'agent-system'}), (m:Memory {id: 'memory-system-init'})
            MERGE (a)-[:RECORDED]->(m)
        `);
        // Pattern used by GraphRAG
        await runQueryWithRetry(session, `
            MATCH (a:Agent {id: 'agent-graphrag'}), (p:Pattern {id: 'pattern-graph-query'})
            MERGE (a)-[:USES]->(p)
        `);
    }
    finally {
        await session.close();
    }
}
async function showStatistics(driver) {
    console.log('\n📊 Database Statistics:');
    const session = driver.session();
    try {
        const nodeResult = await session.run('MATCH (n) RETURN count(n) as count');
        console.log(`  Total nodes: ${nodeResult.records[0].get('count').toNumber()}`);
        const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
        console.log(`  Total relationships: ${relResult.records[0].get('count').toNumber()}`);
        const labelResult = await session.run(`
            MATCH (n)
            UNWIND labels(n) as label
            RETURN label, count(*) as count
            ORDER BY count DESC
        `);
        console.log('  Labels:');
        labelResult.records.forEach(r => {
            console.log(`    - ${r.get('label')}: ${r.get('count').toNumber()}`);
        });
        const relTypeResult = await session.run(`
            MATCH ()-[r]->()
            RETURN type(r) as type, count(*) as count
            ORDER BY count DESC
        `);
        console.log('  Relationship types:');
        relTypeResult.records.forEach(r => {
            console.log(`    - ${r.get('type')}: ${r.get('count').toNumber()}`);
        });
    }
    finally {
        await session.close();
    }
}
async function initializeNeo4j() {
    console.log('🚀 Neo4j Database Initialization');
    console.log('================================');
    console.log(`Connecting to: ${NEO4J_URI}`);
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000,
        maxConnectionPoolSize: 10, // Reduced to prevent contention
        connectionAcquisitionTimeout: 30 * 1000,
    });
    try {
        // Verify connection with retry
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await driver.verifyConnectivity();
                console.log('✅ Connected to Neo4j');
                break;
            }
            catch (error) {
                if (attempt === MAX_RETRIES)
                    throw error;
                console.log(`  ⚠️  Connection attempt ${attempt}/${MAX_RETRIES} failed, retrying...`);
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
        // Run initialization steps sequentially
        await createConstraints(driver);
        await createIndexes(driver);
        await createSeedData(driver);
        await createRelationships(driver);
        await showStatistics(driver);
        console.log('\n✅ Neo4j initialization complete!');
    }
    catch (error) {
        console.error('❌ Initialization failed:', error);
        throw error;
    }
    finally {
        await driver.close();
    }
}
export { initializeNeo4j };
// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
    process.argv[1]?.includes('initNeo4j');
if (isMainModule) {
    initializeNeo4j()
        .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 Failed:', error);
        process.exit(1);
    });
}
