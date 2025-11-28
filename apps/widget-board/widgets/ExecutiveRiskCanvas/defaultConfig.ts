// Executive Risk Canvas - Default Configuration
// Pre-populated with Region X NIS2 Incident Cluster scenario

import {
  ClusterNode,
  NodeConnection,
  RiskCluster,
  ExecutiveCanvasState,
  ThreatHuntData,
  ContractData,
  DecisionData,
} from './types';

// =============================================================================
// DEFAULT THREAT DATA - Region X FIN-DB Lateral Movement
// =============================================================================
export const DEFAULT_THREAT_DATA: ThreatHuntData = {
  incidentId: 'INC-4711',
  threatVector: 'FIN-DB Lateral Movement',
  attackerProfile: 'APT-29 / Cozy Bear indicators',
  riskScore: 91,
  arrExposure: 24500000, // 24.5 mio DKK
  detectedAt: '2025-01-15T06:32:00Z',
  status: 'escalated',
  graphNodes: [
    { id: 'fin-db-02', label: 'FIN-DB-02', type: 'compromised', risk: 'critical' },
    { id: 'admin-acc', label: 'Admin-konto (outsourcet)', type: 'account', risk: 'critical' },
    { id: 'soc-svc', label: 'SOC as a Service', type: 'service', risk: 'high' },
    { id: 'jump-srv', label: 'Jump Server EU-West', type: 'server', risk: 'medium' },
    { id: 'ext-ip', label: '185.xx.xx.xx (TOR Exit)', type: 'external', risk: 'critical' },
  ],
  indicators: [
    { type: 'ip', value: '185.xxx.xxx.xxx', confidence: 94 },
    { type: 'hash', value: 'a3f2b8c...', confidence: 87 },
    { type: 'domain', value: 'cdn-update.*.com', confidence: 72 },
    { type: 'cve', value: 'CVE-2025-0024', confidence: 98 },
  ],
};

// =============================================================================
// DEFAULT CONTRACT DATA - Region X Rammeaftale
// =============================================================================
export const DEFAULT_CONTRACT_DATA: ContractData = {
  contractId: 'CTR-RX-2023-001',
  customerName: 'Region X',
  arrValue: 24500000,
  currency: 'DKK',
  regulatoryFrameworks: [
    { id: 'dpa', name: 'DPA (Databehandleraftale)', status: 'compliant' },
    { id: 'nis2', name: 'NIS2 Annex II', status: 'partial', deadline: '2025-02-01' },
    { id: 'cloud-res', name: 'Cloud Residency (EU/EØS)', status: 'compliant' },
    { id: 'gdpr-32', name: 'GDPR Art. 32', status: 'compliant' },
  ],
  keyClause: 'Klausul om dataplacering: Ingen behandling af persondata må ske udenfor EU/EØS uden forudgående skriftlig godkendelse fra Region X.',
  clauseReference: '§4.3 Dataplacering & Sovereignty',
  expirationDate: '2026-12-31',
};

// =============================================================================
// DEFAULT DECISION DATA - SVP Ansvar
// =============================================================================
export const DEFAULT_DECISION_DATA: DecisionData = {
  decisionId: 'DEC-4711-001',
  owner: 'SVP AI Cloud & Cyber',
  customerContext: 'Kritisk kunde · NIS2 · Sundhedssektor',
  status: 'pending',
  deadline: '2025-01-15T14:00:00Z',
  financialImpact: {
    arrAtRisk: 24500000,
    potentialPenalty: 5000000,
    currency: 'DKK',
  },
  actions: [
    {
      id: 'action-1',
      priority: 1,
      description: 'Skift midlertidigt til 100% lokal model for al behandling af Region X-data',
      deadline: '2025-01-15T10:00:00Z',
      status: 'in_progress',
    },
    {
      id: 'action-2',
      priority: 2,
      description: 'Varsl DPA og Region X inden kl. 14:00 med foreløbig rapport',
      deadline: '2025-01-15T14:00:00Z',
      status: 'pending',
    },
    {
      id: 'action-3',
      priority: 3,
      description: 'Freeze udrulning af ny feature i Region X-miljøet',
      deadline: '2025-01-15T12:00:00Z',
      status: 'completed',
    },
  ],
  boardConfirmation: false,
};

// =============================================================================
// DEFAULT NODES - Pre-configured cluster widgets
// =============================================================================
export const DEFAULT_NODES: ClusterNode[] = [
  // Threat Hunt Widget
  {
    id: 'node-threat-rx',
    type: 'threat',
    position: { x: 100, y: 150 },
    size: { width: 420, height: 380 },
    title: 'Threat Hunt: Region X',
    subtitle: 'FIN-DB Lateral Movement',
    severity: 'critical',
    widgetType: 'CybersecurityOverwatchWidget',
    metadata: {
      ...DEFAULT_THREAT_DATA,
      headerBadge: 'Kritisk kunde · NIS2',
    },
  },
  // Contract View Widget
  {
    id: 'node-contract-rx',
    type: 'contract',
    position: { x: 580, y: 100 },
    size: { width: 380, height: 320 },
    title: 'Contract View: Rammeaftale',
    subtitle: 'Region X',
    severity: 'high',
    widgetType: 'ProcurementIntelligenceWidget',
    metadata: {
      ...DEFAULT_CONTRACT_DATA,
      headerBadge: 'DPA, NIS2 Annex, Cloud Residency',
    },
  },
  // Decision Card Widget
  {
    id: 'node-decision-rx',
    type: 'decision',
    position: { x: 340, y: 550 },
    size: { width: 400, height: 350 },
    title: 'Decision: Region X',
    subtitle: 'Incident 4711 (SVP Ansvar)',
    severity: 'critical',
    widgetType: 'CmaDecisionWidget',
    metadata: {
      ...DEFAULT_DECISION_DATA,
      headerBadge: 'SVP AI Cloud & Cyber',
    },
  },
  // Optional: Dark Web Monitor (supporting intelligence)
  {
    id: 'node-darkweb-rx',
    type: 'widget',
    position: { x: 1020, y: 200 },
    size: { width: 320, height: 280 },
    title: 'Dark Web Intel',
    subtitle: 'Region X credentials',
    severity: 'high',
    collapsed: true,
    widgetType: 'DarkWebMonitorWidget',
    metadata: {
      monitoredDomains: ['region-x.dk', 'sundhed.region-x.dk'],
      alertsCount: 3,
    },
  },
  // Optional: Compliance Status
  {
    id: 'node-compliance-rx',
    type: 'widget',
    position: { x: 1020, y: 520 },
    size: { width: 320, height: 240 },
    title: 'SRAG Governance',
    subtitle: 'NIS2 Compliance Status',
    severity: 'medium',
    collapsed: true,
    widgetType: 'SragGovernanceWidget',
    metadata: {
      framework: 'NIS2',
      customer: 'Region X',
    },
  },
];

// =============================================================================
// DEFAULT CONNECTIONS - Argumentationskæden
// =============================================================================
export const DEFAULT_CONNECTIONS: NodeConnection[] = [
  // Threat → Contract: "Denne hændelse ligger under Region X-aftalen"
  {
    id: 'conn-threat-contract',
    sourceId: 'node-threat-rx',
    targetId: 'node-contract-rx',
    connectionType: 'regulatory',
    label: 'Hændelsen ligger under denne aftale',
    svpBudskab: 'Den konkrete aktivitet her (peg på graf) er reguleret af præcis den klausul her (peg på kontrakt).',
    style: 'solid',
    color: '#F59E0B', // Amber
  },
  // Threat → Decision: "Denne beslutning er afledt af hændelsen"
  {
    id: 'conn-threat-decision',
    sourceId: 'node-threat-rx',
    targetId: 'node-decision-rx',
    connectionType: 'causal',
    label: 'Beslutning afledt af hændelsen',
    svpBudskab: 'Dette er ikke mavefornemmelse – det er en konsekvens af databilledet + kontraktbilledet, som leder til denne beslutning.',
    style: 'solid',
    color: '#EF4444', // Red
  },
  // Contract → Decision: "Aftalen definerer handlingsrum"
  {
    id: 'conn-contract-decision',
    sourceId: 'node-contract-rx',
    targetId: 'node-decision-rx',
    connectionType: 'financial',
    label: 'Kontraktuelle forpligtelser',
    svpBudskab: 'Vores handlingsrum er defineret af disse klausuler og den økonomiske eksponering.',
    style: 'dashed',
    color: '#3B82F6', // Blue
  },
  // Dark Web → Threat: Supporting intelligence
  {
    id: 'conn-darkweb-threat',
    sourceId: 'node-darkweb-rx',
    targetId: 'node-threat-rx',
    connectionType: 'operational',
    label: 'Intel understøtter trussel',
    style: 'dashed',
    color: '#8B5CF6', // Purple
  },
  // Compliance → Contract: "Regulatorisk binding"
  {
    id: 'conn-compliance-contract',
    sourceId: 'node-compliance-rx',
    targetId: 'node-contract-rx',
    connectionType: 'regulatory',
    label: 'NIS2 krav i aftalen',
    style: 'dashed',
    color: '#10B981', // Green
  },
];

// =============================================================================
// DEFAULT CLUSTER - Region X NIS2 Incident
// =============================================================================
export const DEFAULT_CLUSTERS: RiskCluster[] = [
  {
    id: 'cluster-region-x-nis2',
    name: 'Region X - NIS2 Incident Cluster',
    description: 'Kritisk hændelse med lateral movement i FIN-DB. NIS2 og DPA-krav aktiveret.',
    nodes: ['node-threat-rx', 'node-contract-rx', 'node-decision-rx', 'node-darkweb-rx', 'node-compliance-rx'],
    connections: ['conn-threat-contract', 'conn-threat-decision', 'conn-contract-decision', 'conn-darkweb-threat', 'conn-compliance-contract'],
    centerPosition: { x: 550, y: 400 },
    severity: 'critical',
    owner: 'SVP AI Cloud & Cyber',
    tags: ['NIS2', 'Region X', 'FIN-DB', 'Lateral Movement', 'DPA'],
  },
];

// =============================================================================
// ADDITIONAL PORTFOLIO CLUSTERS (for udzoomet view)
// =============================================================================
export const PORTFOLIO_CLUSTERS: RiskCluster[] = [
  {
    id: 'cluster-pharma-gdpr',
    name: 'Pharma Corp - GDPR Breach',
    description: 'Potentielt databrud med kliniske forsøgsdata.',
    nodes: [],
    connections: [],
    centerPosition: { x: 1500, y: 200 },
    severity: 'high',
    owner: 'SVP AI Cloud & Cyber',
    tags: ['GDPR', 'Pharma', 'Clinical Data'],
  },
  {
    id: 'cluster-bank-sox',
    name: 'Nordic Bank - SOX Audit',
    description: 'SOX compliance audit Q1 forberedelse.',
    nodes: [],
    connections: [],
    centerPosition: { x: 1500, y: 600 },
    severity: 'medium',
    owner: 'VP Compliance',
    tags: ['SOX', 'Financial', 'Audit'],
  },
  {
    id: 'cluster-telecom-5g',
    name: 'Telecom Alpha - 5G Security',
    description: '5G core network penetration test findings.',
    nodes: [],
    connections: [],
    centerPosition: { x: 100, y: 800 },
    severity: 'medium',
    owner: 'CISO',
    tags: ['5G', 'Telecom', 'PenTest'],
  },
  {
    id: 'cluster-energy-nis2',
    name: 'Energy Corp - NIS2 Migration',
    description: 'NIS2 compliance deadline approaching.',
    nodes: [],
    connections: [],
    centerPosition: { x: 800, y: 900 },
    severity: 'low',
    owner: 'VP Infrastructure',
    tags: ['NIS2', 'Energy', 'Migration'],
  },
];

// =============================================================================
// INITIAL CANVAS STATE
// =============================================================================
export const DEFAULT_CANVAS_STATE: ExecutiveCanvasState = {
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    mode: 'crisis', // Start focused on Region X cluster
  },
  nodes: DEFAULT_NODES,
  connections: DEFAULT_CONNECTIONS,
  clusters: [...DEFAULT_CLUSTERS, ...PORTFOLIO_CLUSTERS],
  selectedNodeId: undefined,
  selectedConnectionId: undefined,
  hoveredNodeId: undefined,
  presentationMode: false,
  showMinimap: true,
};

// =============================================================================
// EXECUTIVE SUMMARY DATA
// =============================================================================
export const DEFAULT_EXECUTIVE_SUMMARY = {
  totalArrAtRisk: 89500000, // 89.5 mio DKK
  criticalIncidents: 2,
  pendingDecisions: 5,
  complianceScore: 87,
  topRiskClusters: [
    { clusterId: 'cluster-region-x-nis2', name: 'Region X - NIS2', severity: 'critical' as const, arrExposure: 24500000 },
    { clusterId: 'cluster-pharma-gdpr', name: 'Pharma Corp - GDPR', severity: 'high' as const, arrExposure: 35000000 },
    { clusterId: 'cluster-bank-sox', name: 'Nordic Bank - SOX', severity: 'medium' as const, arrExposure: 18000000 },
  ],
};

// =============================================================================
// WIDGET MAPPING - Maps node types to existing widgets
// =============================================================================
export const NODE_WIDGET_MAPPING: Record<string, string> = {
  threat: 'CybersecurityOverwatchWidget',
  contract: 'ProcurementIntelligenceWidget',
  decision: 'CmaDecisionWidget',
  policy: 'SragGovernanceWidget',
  darkweb: 'DarkWebMonitorWidget',
  compliance: 'SragGovernanceWidget',
  activity: 'ActivityStreamWidget',
  kanban: 'KanbanWidget',
};
