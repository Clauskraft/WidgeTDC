import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as path from 'path';
import { fileURLToPath } from 'url';
// SHIM: Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WATCHLIST = [
    { term: "Claus", type: "Person", sensitivity: "High" },
    { term: "WidgeTDC", type: "Company", sensitivity: "High" },
    { term: "Widget", type: "Brand", sensitivity: "Medium" }, // Broader term
    { term: "Hald", type: "Family", sensitivity: "High" },
    // Critical Infrastructure (Operation Silent Alarm - NIS2 Expansion)
    { term: "Denmark", type: "Country", sensitivity: "High" },
    { term: "Copenhagen", type: "City", sensitivity: "High" },
    // Energy
    { term: "Energinet", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Ørsted", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Vestas", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Andel", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Norlys", type: "Infrastructure", sensitivity: "Critical" },
    // Transport
    { term: "Mærsk", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Banedanmark", type: "Infrastructure", sensitivity: "Critical" },
    { term: "DSB", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Naviair", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Københavns Lufthavn", type: "Infrastructure", sensitivity: "Critical" },
    // Health & Water
    { term: "Novo Nordisk", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Region Hovedstaden", type: "Infrastructure", sensitivity: "Critical" },
    { term: "HOFOR", type: "Infrastructure", sensitivity: "Critical" },
    // Digital & Finance
    { term: "TDC", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Nuuday", type: "Infrastructure", sensitivity: "Critical" },
    { term: "GlobalConnect", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Danske Bank", type: "Infrastructure", sensitivity: "Critical" },
    { term: "Nykredit", type: "Infrastructure", sensitivity: "Critical" },
    { term: "JN Data", type: "Infrastructure", sensitivity: "Critical" },
    // Government
    { term: "Digitaliseringsstyrelsen", type: "Government", sensitivity: "Critical" },
    { term: "Rigspolitiet", type: "Government", sensitivity: "Critical" },
    { term: "NATO", type: "Defense", sensitivity: "Critical" }
];
async function setupWatchlist() {
    console.log('🛡️  Operation Personal Shield: Configuring Watchlist...');
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
        let targetsCreated = 0;
        for (const target of WATCHLIST) {
            await session.run(`
                MERGE (t:WatchlistTarget {term: $term})
                SET t.type = $type, 
                    t.sensitivity = $sensitivity,
                    t.active = true,
                    t.lastUpdated = datetime()
            `, { term: target.term, type: target.type, sensitivity: target.sensitivity });
            targetsCreated++;
        }
        console.log(`✅ Watchlist Active. Monitoring ${targetsCreated} targets.`);
        // Verify
        const result = await session.run('MATCH (t:WatchlistTarget) RETURN t.term, t.type');
        console.log('\n📋 Active Targets:');
        result.records.forEach(r => console.log(` - ${r.get('t.term')} (${r.get('t.type')})`));
    }
    catch (error) {
        console.error('💥 Watchlist Configuration Failed:', error);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
setupWatchlist();
