import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
async function run() {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        const query = `
            MATCH (f:File)
            WHERE f.path ENDS WITH '.ts' 
            AND NOT ()-[:DEPENDS_ON]->(f)
            AND NOT f.name ENDS WITH 'index.ts'
            AND NOT f.name ENDS WITH 'server.ts'
            AND NOT f.name ENDS WITH '.d.ts'
            AND NOT f.name ENDS WITH '.test.ts'
            AND NOT f.name ENDS WITH '.spec.ts'
            AND NOT f.name STARTS WITH 'vite'
            AND NOT f.path CONTAINS 'node_modules'
            RETURN f.path as path, f.name as name
            ORDER BY f.path
        `;
        const result = await session.run(query);
        console.log(`Found ${result.records.length} zombies:`);
        result.records.forEach(r => {
            console.log(`- ${r.get('path')}`);
        });
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
run();
