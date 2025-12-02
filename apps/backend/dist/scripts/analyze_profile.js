import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYWORDS = [
    'udbud', 'tender', 'public procurement',
    'cybersecurity', 'sikkerhed', 'security',
    'budget', 'ansvar', 'portfolio', 'portefølje',
    'claus', 'familie', 'family', 'privat', 'private',
    'darkweb', 'leak', 'password'
];
async function analyzeProfile() {
    console.log('🕵️  Analysing User Profile & Focus Areas...');
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();
    try {
        // 1. Søg i filnavne og stier
        console.log('📂 Scanning file paths for keywords...');
        const pathQuery = `
            MATCH (f:File)
            WHERE ${KEYWORDS.map(k => `toLower(f.path) CONTAINS '${k}'`).join(' OR ')}
            RETURN f.path as path, f.name as name
            LIMIT 20
        `;
        const pathResults = await session.run(pathQuery);
        // 2. Søg i indhold (hvis indekseret - simuleret her via metadata eller noder)
        // Bemærk: Vi har ikke fuldtekst af alle dokumenter i grafen endnu, kun kode-struktur.
        // Men vi tjekker 'IntelReport' og 'ThreatActor' for sammenfald.
        console.log('🧠 Checking Intelligence Graph correlation...');
        // Tjek om 'Claus' eller firma-relaterede termer optræder i Threat Data
        const threatQuery = `
            MATCH (n)
            WHERE (n:Victim OR n:ThreatActor OR n:IntelReport)
            AND (toLower(n.name) CONTAINS 'claus' OR toLower(n.name) CONTAINS 'widget')
            RETURN labels(n) as type, n.name as name
        `;
        const threatResults = await session.run(threatQuery);
        // 3. Rapport
        console.log('\n--- 🔍 FINDINGS REPORT ---');
        if (pathResults.records.length > 0) {
            console.log('\n📄 Relevant Files (Portfolio & Interests):');
            pathResults.records.forEach(r => {
                console.log(` - ${r.get('name')} (${r.get('path')})`);
            });
        }
        else {
            console.log('\n📄 No direct file matches found in current index.');
        }
        if (threatResults.records.length > 0) {
            console.log('\n⚠️  THREAT ALERT (Personal/Brand Mention):');
            threatResults.records.forEach(r => {
                console.log(` - [${r.get('type')}] ${r.get('name')}`);
            });
        }
        else {
            console.log('\n✅ No direct mentions of User/Brand found in current Dark Web data sample.');
        }
    }
    catch (error) {
        console.error('Analysis failed:', error);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
analyzeProfile();
