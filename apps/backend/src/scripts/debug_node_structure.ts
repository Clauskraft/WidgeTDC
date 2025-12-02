import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function checkNodeStructure() {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        const result = await session.run("MATCH (n:File) WHERE n.name ENDS WITH '.ts' RETURN n LIMIT 1");
        if (result.records.length > 0) {
             console.log(JSON.stringify(result.records[0].get('n').properties, null, 2));
        } else {
             console.log("No TS files found.");
        }
    } catch(e) {
        console.error("Error:", e);
    } finally {
        await session.close();
        await driver.close();
    }
}
checkNodeStructure();
