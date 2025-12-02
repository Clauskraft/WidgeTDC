import { neo4jService } from '../services/Neo4jService';
async function fixTenderData() {
    console.log('🔧 Fixing Tender Data (Enriching with Keywords)...');
    const updates = [
        {
            title: "Etablering af SOC og beredskab til Region Hovedstaden",
            keywords: ['SOC', 'Security', 'Beredskab', 'Overvågning', 'SIEM', 'Cybersecurity', 'Alarm']
        },
        {
            title: "Landsdækkende IoT-netværk til forsyningssektoren",
            keywords: ['IoT', 'Netværk', 'Sensor', 'LoRaWAN', 'Forsyning', 'Dataopsamling']
        },
        {
            title: "Sikker kommunikationsplatform (Unified Comms)",
            keywords: ['Unified Comms', 'Sikkerhed', 'Kryptering', 'Kommunikation', 'VoIP', 'Video', 'Chat']
        }
    ];
    try {
        for (const update of updates) {
            console.log(`Updating: ${update.title}`);
            await neo4jService.write(`
        MATCH (t:Tender {title: $title})
        SET t.keywords = $keywords, t.budget = 5000000 + toInteger(rand() * 10000000)
        RETURN t.title, t.keywords
      `, {
                title: update.title,
                keywords: update.keywords
            });
        }
        console.log('✅ Data fixed.');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await neo4jService.disconnect();
    }
}
fixTenderData();
