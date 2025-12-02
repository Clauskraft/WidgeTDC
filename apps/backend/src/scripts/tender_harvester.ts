import 'dotenv/config';
import neo4j from 'neo4j-driver';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- KONFIGURATION (TDC ENHANCED) ---
const ORG_CAPABILITIES = [
  // Core Tech
  'Cyber Security', 'Threat Intelligence', 'Graph Database', 'Neo4j', 
  'AI', 'Machine Learning', 'Network Analysis', 'Monitoring', 'SaaS',
  
  // TDC Infrastruktur & Netværk
  '5G', 'Private 5G', 'Fiber', 'Coax', 'IoT', 'NB-IoT', 'LTE-M', 
  'MPLS', 'SD-WAN', 'Network-as-a-Service', 'Kritisk Infrastruktur',

  // TDC Sikkerhed (Heavy Duty)
  'SOC', 'Security Operations Center', 'DDoS', 'DDoS Protection', 
  'Firewall', 'Smart Security', 'Log Management', 'SIEM', 'NIS2',
  'Compliance', 'Vulnerability Management', 'Endpoint Protection',

  // Cloud & Unified Comms
  'Unified Communications', 'Teams', 'Cisco Webex', 'Cloud Key',
  'Managed Cloud', 'Azure', 'Device Management', 'MDM'
];

const UPSCALE_KEYWORDS = [
  'Innovation', 'R&D', 'Udvikling', 'Prototype', 'Partnerskab', 'PoC',
  'Skalering', 'Transformation', 'Digitalisering'
];

// Kilder der ofte har "under-threshold" udbud (ikke i TED)
const DEEP_SOURCES = [
  { 
    name: 'Udbud.dk (DK)', 
    url: 'https://udbud.dk/rss.aspx', 
    type: 'RSS',
    country: 'DK'
  },
  {
    name: 'Doffin (NO)',
    url: 'https://doffin.no/RSS',
    type: 'RSS',
    country: 'NO'
  },
  {
    name: 'Mercell (Nordic)',
    url: 'https://mercell.com/rss',
    type: 'RSS',
    country: 'Nordic'
  }
];

// --- LOGIK ---

interface Tender {
  id: string;
  title: string;
  description: string;
  buyer: string;
  value?: number;
  currency?: string;
  deadline?: string;
  source: string;
  url: string;
}

interface StrategicFit {
  score: number; // 0-100
  matches: string[];
  isUpscaleOpportunity: boolean;
  upscaleReason?: string;
}

async function runHarvester() {
  console.log('🕵️‍♂️ Operation Smart Hunter v2.0 (TDC Edition): Initializing...');
  
  // 1. Forbind til Neo4j Cloud
  if (!process.env.NEO4J_URI) {
      console.error("❌ Mangler NEO4J_URI i .env");
      process.exit(1);
  }

  const driver = neo4j.driver(
    process.env.NEO4J_URI, 
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();

  try {
    // 2. Fetch Data (Simuleret RSS parsing for demo)
    console.log('📡 Scanning Deep Sources (Non-TED)...');
    const tenders = await fetchTenders(); 
    console.log(`📥 Downloaded ${tenders.length} potential tenders.`);

    let validLeads = 0;

    for (const tender of tenders) {
      // 3. Analyser Strategisk Fit
      const fit = calculateStrategicFit(tender);

      // Filter: Vi gemmer kun hvis score > 40
      if (fit.score > 40) {
        console.log(`🎯 MATCH FOUND: ${tender.title} (Score: ${fit.score}%)`);
        console.log(`   - Keywords: ${fit.matches.join(', ')}`);
        
        // 4. Ingest i Grafen
        await session.run(`
          MERGE (t:Tender {id: $id})
          SET t += $props, t.ingestedAt = datetime()
          
          MERGE (b:Buyer {name: $buyer})
          MERGE (b)-[:ISSUED]->(t)
          
          MERGE (org:Organization {name: 'WidgeTDC'})
          MERGE (org)-[f:POTENTIAL_FIT]->(t)
          SET f.score = $score, 
              f.matches = $matches,
              f.upscale = $upscale,
              f.rationale = $rationale
        `, {
          id: tender.id,
          buyer: tender.buyer,
          props: {
            title: tender.title,
            description: tender.description,
            source: tender.source,
            url: tender.url,
            deadline: tender.deadline
          },
          score: fit.score,
          matches: fit.matches,
          upscale: fit.isUpscaleOpportunity,
          rationale: fit.upscaleReason || ''
        });
        
        validLeads++;
      }
    }

    console.log(`✅ Hunt Complete. Ingested ${validLeads} strategic opportunities.`);

  } catch (err) {
    console.error('❌ Harvester Failed:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

// --- HJÆLPEFUNKTIONER ---

async function fetchTenders(): Promise<Tender[]> {
  // MOCK DATA - Demonstrerer den nye bredde i TDC's kapabiliteter
  return [
    {
      id: 'DK-2025-001',
      title: 'Etablering af SOC og beredskab til Region Hovedstaden',
      description: 'Vi søger en leverandør til 24/7 overvågning af netværkstrafik, Log Management og Threat Intelligence.',
      buyer: 'Region Hovedstaden',
      source: 'Udbud.dk (DK)',
      url: 'https://udbud.dk/...'
    },
    {
      id: 'DK-2025-002',
      title: 'Landsdækkende IoT-netværk til forsyningssektoren',
      description: 'Udrulning af NB-IoT sensorer til vandmåling. Kræver stabil 5G/NB-IoT dækning.',
      buyer: 'HOFOR',
      source: 'Udbud.dk (DK)',
      url: 'https://udbud.dk/...'
    },
    {
      id: 'NO-2025-992',
      title: 'Sikker kommunikationsplatform (Unified Comms)',
      description: 'Modernisering af telefoni og video. Skal integrere med Microsoft Teams og Cisco udstyr.',
      buyer: 'Oslo Kommune',
      source: 'Doffin (NO)',
      url: 'https://doffin.no/...'
    },
    {
      id: 'SE-2025-XYZ',
      title: 'Rengøring af kommunale bygninger',
      description: 'Daglig rengøring...',
      buyer: 'Malmö Stad',
      source: 'Opic (SE)',
      url: 'https://opic.se/...'
    }
  ];
}

function calculateStrategicFit(tender: Tender): StrategicFit {
  const text = (tender.title + ' ' + tender.description).toLowerCase();
  
  // 1. Tæl Capability Matches
  const matches = ORG_CAPABILITIES.filter(cap => text.includes(cap.toLowerCase()));
  
  // 2. Beregn Base Score
  // Vi er nu mere aggressive: Jo flere matches, jo højere score.
  let score = (matches.length / 2) * 100; // 2 matches = 100% (fordi vi søger niche-fit)
  if (score > 100) score = 100;

  // 3. Tjek for Upscaling
  const upscaleMatches = UPSCALE_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
  const isUpscale = upscaleMatches.length > 0;

  if (isUpscale) score += 10;

  return {
    score: Math.round(score),
    matches,
    isUpscaleOpportunity: isUpscale,
    upscaleReason: isUpscale ? `Innovation keywords: ${upscaleMatches.join(', ')}` : undefined
  };
}

// Start
runHarvester();
