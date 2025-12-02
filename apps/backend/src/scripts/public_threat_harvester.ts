import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as path from 'path';
import { fileURLToPath } from 'url';

// SHIM: Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SOURCES: Strategic alignment with EU/DK interests
// Using hardcoded examples for POC to ensure graph logic works perfectly before adding RSS parsing complexity
const SOURCES = [
    {
        name: "ENISA",
        description: "European Union Agency for Cybersecurity",
        reports: [
            {
                title: "ENISA Threat Landscape 2024",
                summary: "Ransomware remains a top threat. Groups like LockBit 3.0 and RagnarLocker are evolving tactics targeting critical infrastructure in the EU.",
                date: new Date().toISOString(),
                url: "https://www.enisa.europa.eu/publications/enisa-threat-landscape-2024"
            },
            {
                title: "Supply Chain Attacks Analysis",
                summary: "Recent analysis shows increased targeting of software dependencies. Similar to the SolarWinds incident, attackers are leveraging trusted components.",
                date: new Date().toISOString(),
                url: "https://www.enisa.europa.eu/publications/supply-chain"
            }
        ]
    },
    {
        name: "Center for Cybersikkerhed (CFCS)",
        description: "Danish National Cyber Security Centre",
        reports: [
            {
                title: "Trusselsvurdering 2025",
                summary: "Truslen fra cyberkriminalitet er MEGET HØJ. Ransomware-grupper som Lorenz og Conti udgør en alvorlig trussel mod danske virksomheder.",
                date: new Date().toISOString(),
                url: "https://cfcs.dk/trusselsvurdering"
            }
        ]
    },
    {
        name: "Folketinget - SamSik",
        description: "Udvalget for Digitalisering og It",
        reports: [
            {
                title: "Beredskabsrapport: Kritisk Infrastruktur",
                summary: "Debat om styrkelse af beredskabet. Fokus på energisektoren og beskyttelse mod destruktive angreb fra statslige aktører og kriminelle syndikater som BlackCat.",
                date: new Date().toISOString(),
                url: "https://ft.dk/samsik/rapport2025"
            }
        ]
    }
];

async function harvestPublicThreats() {
    console.log('🌐 Operation Omni-Sentry: Initializing Public Intel Harvest...');
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
        // 1. Ingest Sources & Reports
        console.log('📡 Ingesting reports from EU (ENISA), DK (CFCS/Folketing), and Strategic Partners...');
        
        for (const source of SOURCES) {
            await session.run(
                `
                MERGE (s:Organization {name: $name})
                SET s.description = $description, s.type = 'IntelSource'
            `,
                { name: source.name, description: source.description }
            );

            for (const report of source.reports) {
                await session.run(
                    `
                    MATCH (s:Organization {name: $sourceName})
                    MERGE (r:IntelReport {title: $title})
                    SET r.summary = $summary, r.date = $date, r.url = $url
                    MERGE (s)-[:PUBLISHED]->(r)
                `,
                    { 
                        sourceName: source.name, 
                        title: report.title, 
                        summary: report.summary,
                        date: report.date,
                        url: report.url
                    }
                );
            }
        }
        console.log('✅ Reports ingested.');

        // 2. Semantic Correlation (The Glue)
        console.log('🧠 Analyzing semantic links between Public Reports and Dark Web Actors...');
        
        // We match Reports against known ThreatActors (from Dark Sentry) based on string containment in summary
        const correlationQuery = `
            MATCH (r:IntelReport)
            MATCH (a:ThreatActor)
            WHERE toLower(r.summary) CONTAINS toLower(a.name)
            MERGE (r)-[rel:MENTIONS]->(a)
            RETURN r.title as Report, a.name as Actor, rel
        `;

        const result = await session.run(correlationQuery);
        
        console.log(`
🔗 Correlations Found: ${result.records.length}`);
        if (result.records.length > 0) {
            result.records.forEach(rec => {
                console.log(`   - "${rec.get('Report')}" mentions [${rec.get('Actor')}]`);
            });
        } else {
            console.log("   (No direct name matches found in this sample set. Try running Dark Sentry to populate more Actors first.)");
        }

    } catch (error) {
        console.error('💥 Omni-Sentry Failure:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

harvestPublicThreats();
