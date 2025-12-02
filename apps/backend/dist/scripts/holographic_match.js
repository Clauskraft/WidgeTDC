import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
// ESM Shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Output sti til rapporten
const REPORT_PATH = path.resolve(__dirname, '../../../../docs/HOLOGRAPHIC_GAP_REPORT.json');
async function runHolographicAnalysis() {
    console.log('🌌 Operation Holographic Match: Initializing...');
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;
    if (!uri || !user || !password) {
        console.error('❌ FEJL: Mangler Neo4j credentials.');
        process.exit(1);
    }
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();
    try {
        console.log('🧠 Connecting to Cortex...');
        // THE HOLOGRAPHIC QUERY (Fra Blackboardet)
        // Finder udbud (Tenders) hvor vi MANGLER koden (File content) til at løse opgaven
        // Bemærk: Denne query antager at t.keywords eksisterer på Tender noder.
        // Vores tidligere scripts har muligvis ikke sat denne property eksplicit på noden, men relationen har 'matches'.
        // Lad os justere queryen til at bruge relationen POTENTIAL_FIT's 'matches' property.
        const result = await session.run(`
      MATCH (org:Organization)-[f:POTENTIAL_FIT]->(t:Tender)
      // Unwind alle keywords fra 'matches' arrayet på relationen
      UNWIND f.matches as keyword
      WITH t, keyword, org
      // Tjek om vi har en fil der matcher dette keyword
      CALL {
        WITH keyword
        MATCH (file:File)
        WHERE toLower(file.name) CONTAINS toLower(keyword) 
           OR toLower(file.path) CONTAINS toLower(keyword)
        RETURN count(file) > 0 as hasCapability
      }
      WITH t, keyword, hasCapability
      WHERE NOT hasCapability
      // Aggreger manglende keywords per tender
      RETURN t.title as Title, 
             t.buyer as Buyer,
             'Gap Detected' as Status,
             t.url as Url,
             collect(keyword) as MissingKeywords
      LIMIT 20
    `);
        const gaps = result.records.map(r => ({
            title: r.get('Title'),
            buyer: r.get('Buyer'),
            status: r.get('Status'),
            url: r.get('Url'),
            missingKeywords: r.get('MissingKeywords'),
            recommendation: "INITIATE R&D SPRINT"
        }));
        console.log(`🔍 Analysis Complete. Found ${gaps.length} capability gaps.`);
        // Gem rapporten
        fs.writeFileSync(REPORT_PATH, JSON.stringify(gaps, null, 2));
        console.log(`📄 Report saved to: ${REPORT_PATH}`);
        if (gaps.length > 0) {
            console.log('\nTop 3 Missing Capabilities (Opportunities):');
            gaps.slice(0, 3).forEach((g, i) => {
                console.log(`${i + 1}. ${g.title} (${g.buyer})`);
                console.log(`   Missing: ${g.missingKeywords.join(', ')}`);
            });
        }
        else {
            console.log('✨ No gaps found! We are fully synced with the market.');
        }
    }
    catch (error) {
        console.error('💥 Holographic Failure:', error);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
runHolographicAnalysis();
