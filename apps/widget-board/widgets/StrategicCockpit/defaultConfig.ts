// Strategic Cockpit - Default Configuration
// Pre-configured with EU Digital Sovereignty scenario

import {
  CockpitAgent,
  ObservationCard,
  RelatedDocument,
  RelatedActor,
  RelatedIncident,
  AffectingPolicy,
  GraphNode,
  GraphEdge,
  CockpitState,
} from './types';

// ============================================================
// DEFAULT AGENTS
// ============================================================

export const defaultAgents: CockpitAgent[] = [
  {
    id: 'agent-security',
    name: 'Security',
    role: 'security',
    status: 'active',
    currentTask: 'Korrelerer trusselsdata fra NIS2-rapporter og interne logs',
    statusMessage: 'Working',
    lastActivity: new Date().toISOString(),
    metrics: { tasksCompleted: 47, tasksInProgress: 3, alertsRaised: 2 },
  },
  {
    id: 'agent-governance',
    name: 'Governance',
    role: 'governance',
    status: 'warning',
    currentTask: 'Evaluerer dataeksport og privatsikkerhed mod EU-retningslinjer',
    statusMessage: 'Review - potentiel risiko identificeret',
    lastActivity: new Date().toISOString(),
    metrics: { tasksCompleted: 31, tasksInProgress: 2, alertsRaised: 1 },
  },
  {
    id: 'agent-legal',
    name: 'Legal',
    role: 'legal',
    status: 'idle',
    currentTask: undefined,
    statusMessage: 'Klar til at fortolke lovgivning (AI-forordning, chat-kontrol)',
    lastActivity: new Date(Date.now() - 300000).toISOString(),
    metrics: { tasksCompleted: 18, tasksInProgress: 0, alertsRaised: 0 },
  },
  {
    id: 'agent-data',
    name: 'Data',
    role: 'data',
    status: 'active',
    currentTask: 'Bearbejder datastrømme om modellokalitet og supply-chain-risici',
    statusMessage: 'Analyzing',
    lastActivity: new Date().toISOString(),
    metrics: { tasksCompleted: 89, tasksInProgress: 5, alertsRaised: 0 },
  },
  {
    id: 'agent-orchestrator',
    name: 'Orchestrator',
    role: 'orchestrator',
    status: 'active',
    currentTask: 'Fordeler opgaver mellem agenter',
    statusMessage: 'Coordinating',
    lastActivity: new Date().toISOString(),
    metrics: { tasksCompleted: 156, tasksInProgress: 6, alertsRaised: 0 },
  },
  {
    id: 'agent-creative',
    name: 'Creative',
    role: 'creative',
    status: 'idle',
    currentTask: undefined,
    statusMessage: 'Klar til at generere rapporter, præsentationer eller visualiseringer',
    lastActivity: new Date(Date.now() - 600000).toISOString(),
    metrics: { tasksCompleted: 12, tasksInProgress: 0, alertsRaised: 0 },
  },
];

// ============================================================
// OBSERVATION CARDS
// ============================================================

export const defaultCards: ObservationCard[] = [
  {
    id: 'card-digital-sovereignty',
    category: 'digital-sovereignty',
    title: 'Digital Suverænitet',
    summary: 'EU\'s ambition om forenkling af regelsæt og massive investeringer i cloud, AI og halvledere under \'Digital Decade 2025\'. Fokus på teknologisk uafhængighed fra USA og Kina.',
    priority: 'high',
    source: 'EU Commission',
    timestamp: new Date().toISOString(),
    position: { x: 100, y: 150 },
    size: { width: 380, height: 280 },
    isCollapsed: false,
    connections: ['card-ai-security', 'card-privacy-chat'],
    tags: ['EU', 'sovereignty', 'cloud', 'AI', 'semiconductors'],
  },
  {
    id: 'card-nis2-threats',
    category: 'nis2-threats',
    title: 'NIS2-trusler',
    summary: 'ENISA\'s observationer om supply-chain-angreb, identitetsbaserede angreb og risici fra misconfigurerede cloud IAM-opsætninger. Kritiske infrastrukturer under øget pres.',
    priority: 'critical',
    source: 'ENISA',
    timestamp: new Date().toISOString(),
    position: { x: 520, y: 100 },
    size: { width: 380, height: 280 },
    isCollapsed: false,
    connections: ['card-ai-security'],
    tags: ['NIS2', 'supply-chain', 'IAM', 'ENISA', 'threats'],
  },
  {
    id: 'card-ai-security',
    category: 'ai-security',
    title: 'AI-sikkerhed',
    summary: 'OpenAI/Microsoft implementerer biometrisk adgang og deny-by-default netværk. NIST\'s AI 800-1-udkast udpeger modeltyveri som kernerisiko. Fokus på model exfiltration prevention.',
    priority: 'high',
    source: 'NIST / OpenAI',
    timestamp: new Date().toISOString(),
    position: { x: 940, y: 150 },
    size: { width: 380, height: 280 },
    isCollapsed: false,
    connections: ['card-nis2-threats', 'card-digital-sovereignty'],
    tags: ['AI', 'security', 'NIST', 'model-theft', 'biometric'],
  },
  {
    id: 'card-privacy-chat',
    category: 'privacy-chat',
    title: 'Privatliv & Chat',
    summary: 'EU\'s kompromis om chat-kontrol gør scanning frivillig og garanterer at kryptering ikke undermineres. Balance mellem børnebeskyttelse og privatlivets fred.',
    priority: 'medium',
    source: 'EU Parliament',
    timestamp: new Date().toISOString(),
    position: { x: 300, y: 480 },
    size: { width: 380, height: 280 },
    isCollapsed: false,
    connections: ['card-digital-sovereignty'],
    tags: ['privacy', 'encryption', 'chat-control', 'CSAM', 'E2EE'],
  },
];

// ============================================================
// NEURAL STREAM CONTENT
// ============================================================

export const defaultDocuments: RelatedDocument[] = [
  {
    id: 'doc-eu-digital-declaration',
    title: 'EU\'s digitale suverænitetserklæring',
    source: 'European Commission',
    type: 'legislation',
    url: 'https://digital-strategy.ec.europa.eu/',
    relevanceScore: 0.95,
    snippet: 'Europa skal opbygge sin egen digitale kapacitet inden 2030...',
  },
  {
    id: 'doc-enisa-nis2',
    title: 'ENISA NIS2-rapport',
    source: 'ENISA',
    type: 'report',
    url: 'https://www.enisa.europa.eu/',
    relevanceScore: 0.92,
    snippet: 'Supply-chain-angreb er steget med 300% i 2024...',
  },
  {
    id: 'doc-nist-ai-standard',
    title: 'NIST AI 800-1 Standardudkast',
    source: 'NIST',
    type: 'standard',
    url: 'https://www.nist.gov/ai',
    relevanceScore: 0.88,
    snippet: 'Model exfiltration udgør den primære risiko for AI-systemer...',
  },
  {
    id: 'doc-ai-act',
    title: 'EU AI Act - Final Text',
    source: 'EUR-Lex',
    type: 'legislation',
    relevanceScore: 0.91,
    snippet: 'Højrisiko AI-systemer skal opfylde særlige krav til transparens...',
  },
];

export const defaultActors: RelatedActor[] = [
  {
    id: 'actor-france-germany',
    name: 'Frankrig & Tyskland',
    type: 'country',
    role: 'Drivkræfter bag digital suverænitet',
    influence: 'high',
    stance: 'Pro-europæisk teknologisk uafhængighed',
  },
  {
    id: 'actor-enisa',
    name: 'ENISA',
    type: 'organization',
    role: 'EU\'s cybersikkerhedsagentur',
    influence: 'high',
    stance: 'Regulatorisk og rådgivende',
  },
  {
    id: 'actor-openai-msft',
    name: 'OpenAI / Microsoft',
    type: 'organization',
    role: 'Ledende AI-udviklere',
    influence: 'high',
    stance: 'Sætter industristandarder for AI-sikkerhed',
  },
  {
    id: 'actor-privacy-advocates',
    name: 'Privacyforkæmpere',
    type: 'group',
    role: 'Civilsamfundsorganisationer',
    influence: 'medium',
    stance: 'Mod masseovervågning, for E2EE',
  },
];

export const defaultIncidents: RelatedIncident[] = [
  {
    id: 'incident-supply-chain',
    title: 'Supply-chain kompromittering',
    type: 'attack',
    date: '2024-11-15',
    severity: 'critical',
    description: 'Omfattende supply-chain-brud påvirker kritisk infrastruktur i flere EU-lande.',
  },
  {
    id: 'incident-identity-compromise',
    title: 'Identitetskompromittering',
    type: 'breach',
    date: '2024-11-20',
    severity: 'high',
    description: 'Identitetsbaserede angreb mod cloud IAM-systemer.',
  },
  {
    id: 'incident-ai-exfiltration',
    title: 'AI Model Exfiltration forsøg',
    type: 'attack',
    date: '2024-11-22',
    severity: 'high',
    description: 'Forsøg på at exfiltrere proprietære AI-modeller opdaget.',
  },
  {
    id: 'incident-chat-control-debate',
    title: 'Chat-kontrol debatten',
    type: 'debate',
    date: '2024-11-25',
    severity: 'medium',
    description: 'Igangværende politisk debat om balance mellem privatliv og børnebeskyttelse.',
  },
];

export const defaultPolicies: AffectingPolicy[] = [
  {
    id: 'policy-ai-act',
    name: 'AI-forordningen',
    type: 'external',
    jurisdiction: 'EU',
    status: 'active',
    relevance: 'Udsættelse for højrisiko-systemer indtil 2026',
    complianceStatus: 'partial',
  },
  {
    id: 'policy-nis2',
    name: 'NIS2-direktivet',
    type: 'external',
    jurisdiction: 'EU',
    status: 'active',
    relevance: 'Skærpede krav til kritiske enheder',
    complianceStatus: 'partial',
  },
  {
    id: 'policy-gdpr-schrems',
    name: 'GDPR & Schrems II',
    type: 'external',
    jurisdiction: 'EU',
    status: 'active',
    relevance: 'Dataoverførsel til tredjeland',
    complianceStatus: 'compliant',
  },
  {
    id: 'policy-csam',
    name: 'CSAM-kompromiset',
    type: 'external',
    jurisdiction: 'EU',
    status: 'proposed',
    relevance: 'Frivillig scanning, kryptering bevares',
    complianceStatus: 'unknown',
  },
];

// ============================================================
// MINDMAP / GRAPH DATA
// ============================================================

export const defaultGraphNodes: GraphNode[] = [
  {
    id: 'node-digital-sovereignty',
    type: 'trend',
    label: 'Digital Suverænitet',
    description: 'EU\'s strategi for teknologisk uafhængighed',
    properties: { region: 'EU', priority: 'strategic' },
    position: { x: 400, y: 300 },
    size: 60,
  },
  {
    id: 'node-nis2',
    type: 'policy',
    label: 'NIS2',
    description: 'Network and Information Security Directive',
    properties: { status: 'active', deadline: '2024-10-17' },
    position: { x: 250, y: 180 },
    size: 50,
  },
  {
    id: 'node-ai-act',
    type: 'policy',
    label: 'AI Act',
    description: 'EU\'s AI-forordning',
    properties: { status: 'active', highRiskDelay: '2026' },
    position: { x: 550, y: 180 },
    size: 50,
  },
  {
    id: 'node-supply-chain',
    type: 'threat',
    label: 'Supply Chain Risk',
    description: 'Risici i leverandørkæder',
    properties: { severity: 'critical', trend: 'increasing' },
    position: { x: 150, y: 350 },
    size: 45,
  },
  {
    id: 'node-model-theft',
    type: 'threat',
    label: 'Model Theft',
    description: 'AI model exfiltration risiko',
    properties: { severity: 'high', actors: ['state', 'criminal'] },
    position: { x: 650, y: 350 },
    size: 45,
  },
  {
    id: 'node-enisa',
    type: 'actor',
    label: 'ENISA',
    description: 'EU Agency for Cybersecurity',
    properties: { type: 'regulator', influence: 'high' },
    position: { x: 100, y: 200 },
    size: 40,
  },
  {
    id: 'node-nist',
    type: 'actor',
    label: 'NIST',
    description: 'National Institute of Standards and Technology',
    properties: { type: 'standard-setter', country: 'USA' },
    position: { x: 700, y: 200 },
    size: 40,
  },
  {
    id: 'node-chat-control',
    type: 'policy',
    label: 'Chat Control',
    description: 'EU CSAM scanning proposal',
    properties: { status: 'proposed', controversial: true },
    position: { x: 400, y: 450 },
    size: 40,
  },
];

export const defaultGraphEdges: GraphEdge[] = [
  {
    id: 'edge-ds-nis2',
    sourceId: 'node-digital-sovereignty',
    targetId: 'node-nis2',
    type: 'involves',
    label: 'Regulerer',
    weight: 0.9,
  },
  {
    id: 'edge-ds-ai',
    sourceId: 'node-digital-sovereignty',
    targetId: 'node-ai-act',
    type: 'involves',
    label: 'Regulerer',
    weight: 0.9,
  },
  {
    id: 'edge-nis2-supply',
    sourceId: 'node-nis2',
    targetId: 'node-supply-chain',
    type: 'regulates',
    label: 'Adresserer',
    weight: 0.85,
  },
  {
    id: 'edge-ai-theft',
    sourceId: 'node-ai-act',
    targetId: 'node-model-theft',
    type: 'regulates',
    label: 'Beskytter mod',
    weight: 0.8,
  },
  {
    id: 'edge-enisa-nis2',
    sourceId: 'node-enisa',
    targetId: 'node-nis2',
    type: 'involves',
    label: 'Håndhæver',
    weight: 0.95,
  },
  {
    id: 'edge-nist-theft',
    sourceId: 'node-nist',
    targetId: 'node-model-theft',
    type: 'involves',
    label: 'Standardiserer',
    weight: 0.75,
  },
  {
    id: 'edge-ds-chat',
    sourceId: 'node-digital-sovereignty',
    targetId: 'node-chat-control',
    type: 'involves',
    label: 'Påvirker',
    weight: 0.6,
  },
];

// ============================================================
// COMPLETE DEFAULT STATE
// ============================================================

export const defaultCockpitState: CockpitState = {
  viewport: { x: 0, y: 0, zoom: 1 },
  cards: defaultCards,
  selectedCardId: null,
  hoveredCardId: null,
  agents: defaultAgents,
  neuralStream: {
    selectedCardId: null,
    documents: defaultDocuments,
    actors: defaultActors,
    incidents: defaultIncidents,
    policies: defaultPolicies,
    isLoading: false,
  },
  activeNeuralSection: 'related-documents',
  mindmap: {
    nodes: defaultGraphNodes,
    edges: defaultGraphEdges,
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: null,
  },
  showMindmap: false,
  mindmapMode: 'overlay',
  showAgentCouncil: true,
  showNeuralStream: true,
  isConnecting: false,
  connectionSource: null,
  wsConnected: false,
  lastUpdate: new Date().toISOString(),
};
