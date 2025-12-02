import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
// Load .env from backend directory
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
async function check() {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        // Quietly verify connectivity
        await driver.verifyConnectivity();
        const result = await session.run('MATCH (n) RETURN count(n) as count');
        const count = result.records[0].get('count').toNumber();
        console.log(`NodeCount: ${count}`);
    }
    catch (e) {
        // Minimal error output as per "Black Ops"
        console.log(`Error: ${e.message}`);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
check();
