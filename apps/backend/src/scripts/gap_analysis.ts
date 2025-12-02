import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as path from 'path';
import { fileURLToPath } from 'url';

// SHIM: Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runGapAnalysis() {
    console.log('🧠 Neural Synergy: Analyzing Capability Gaps...');
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
        console.error('❌ ERROR: Missing Neo4j credentials');
        process.exit(1);
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        // Gap Analysis Query
        // Finds tenders where the required keywords (from 'matches' property)
        // do NOT appear in any File content (simulated by file name/path for now as we don't have full content indexed yet)
        
        console.log('⚡ Scanning Graph for missing capabilities...');
        
        const result = await session.run(`
            MATCH (t:Tender)<-[f:POTENTIAL_FIT]-(:Organization)
            WHERE f.score > 40
            UNWIND f.matches as keyword
            WITH t, keyword
            // Check if we have code matching this keyword
            // Using CASE for existence check since we are in a projection
            CALL {
                WITH keyword
                MATCH (file:File)
                WHERE toLower(file.name) CONTAINS toLower(keyword) 
                   OR toLower(file.path) CONTAINS toLower(keyword)
                RETURN count(file) > 0 as hasCapability
            }
            WITH t, keyword, hasCapability
            WHERE NOT hasCapability
            RETURN t.title as Tender, collect(keyword) as MissingTech
        `);

        console.log('\n📋 Strategic Gap Report:');
        if (result.records.length === 0) {
            console.log("✅ No critical gaps found. We have code coverage for all identified opportunities.");
        } else {
            result.records.forEach(r => {
                console.log(`\n🚨 Tender: "${r.get('Tender')}"`);
                console.log(`   Missing Tech: ${r.get('MissingTech').join(', ')}`);
            });
        }

    } catch (error) {
        console.error('💥 Analysis Failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

runGapAnalysis();
