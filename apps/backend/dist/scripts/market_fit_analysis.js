import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
// ESM Shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_PATH = path.resolve(__dirname, '../../../../market_fit_report.json');
async function runMarketAnalysis() {
    console.log('📊 Operation Market Fit: Initializing...');
    // Cloud Connection
    const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
    const session = driver.session();
    try {
        console.log('🔌 Connecting to Neural Graph...');
        // RETTET QUERY: Henter data fra relationen POTENTIAL_FIT
        const result = await session.run(`
      MATCH (org:Organization)-[r:POTENTIAL_FIT]->(t:Tender)
      MATCH (b:Buyer)-[:ISSUED]->(t)
      RETURN 
        t.title as title,
        b.name as buyer,
        r.score as score,
        r.matches as capabilities,
        r.upscale as isUpscale,
        r.rationale as rationale,
        t.url as url
      ORDER BY r.score DESC
    `);
        const opportunities = result.records.map(record => ({
            title: record.get('title'),
            buyer: record.get('buyer'),
            score: record.get('score'), // Match %
            capabilities: record.get('capabilities'), // Hvad vi kan
            isUpscale: record.get('isUpscale'), // Er det R&D?
            rationale: record.get('rationale'),
            url: record.get('url'),
            // Simuleret "Missing" (I fremtiden kan vi sammenligne med t.description)
            status: record.get('score') > 80 ? 'STRONG FIT' : 'DEVELOPMENT NEEDED'
        }));
        console.log(`✅ Analysis Complete. Found ${opportunities.length} strategic opportunities.`);
        // Gem rapporten
        fs.writeFileSync(REPORT_PATH, JSON.stringify({
            generatedAt: new Date().toISOString(),
            count: opportunities.length,
            opportunities: opportunities
        }, null, 2));
        console.log(`📄 Report saved to: ${REPORT_PATH}`);
        // Vis preview i konsollen
        if (opportunities.length > 0) {
            console.log('\nTop Opportunity:');
            console.log(`🎯 ${opportunities[0].title}`);
            console.log(`   Score: ${opportunities[0].score}%`);
            console.log(`   Matches: ${opportunities[0].capabilities.join(', ')}`);
        }
    }
    catch (error) {
        console.error('❌ Analysis Failure:', error);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
runMarketAnalysis();
