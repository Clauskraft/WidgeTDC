import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function check() {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        // Verify counts
        const countResult = await session.run('MATCH (n) RETURN count(n) as count');
        const total = countResult.records[0].get('count').toNumber();
        console.log(`Total Nodes: ${total}`);

        // Specific verification
        const result = await session.run("MATCH (n:File) WHERE n.name CONTAINS 'Neo4jAdapter' RETURN n.name as name, n.path as path");
        if (result.records.length > 0) {
             console.log("✅ Verification found Neo4jAdapter files:");
             result.records.forEach(r => {
                 console.log(` - ${r.get('name')} (${r.get('path')})`);
             });
        } else {
             console.log("❌ Verification FAILED: No 'Neo4jAdapter' files found.");
        }

    } catch(e) {
        console.error("Error:", e);
    } finally {
        await session.close();
        await driver.close();
    }
}
check();
