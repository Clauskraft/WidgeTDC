// Executive Risk Canvas - Type Definitions
// For SVP-level Risk & P&L Control Surface

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ClusterType = 'threat' | 'contract' | 'decision' | 'policy' | 'widget';
export type ConnectionType = 'causal' | 'regulatory' | 'financial' | 'operational';

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  pan: CanvasPosition;
  mode: 'portfolio' | 'crisis';
}

export interface ClusterNode {
  id: string;
  type: ClusterType;
  position: CanvasPosition;
  size: { width: number; height: number };
  title: string;
  subtitle?: string;
  severity?: RiskSeverity;
  collapsed?: boolean;
  locked?: boolean;
  widgetType?: string; // Reference to existing widget
  widgetConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface NodeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: ConnectionType;
  label: string;
  svpBudskab?: string;
  style?: 'solid' | 'dashed' | 'animated';
  color?: string;
}

export interface ThreatHuntData {
  incidentId: string;
  threatVector: string;
  attackerProfile?: string;
  riskScore: number;
  arrExposure: number;
  detectedAt: string;
  status: 'investigating' | 'contained' | 'escalated';
  graphNodes: Array<{
    id: string;
    label: string;
    type: 'server' | 'account' | 'service' | 'external' | 'compromised';
    risk: RiskSeverity;
  }>;
  indicators: Array<{
    type: 'ip' | 'hash' | 'domain' | 'email' | 'cve';
    value: string;
    confidence: number;
  }>;
}

export interface ContractData {
  contractId: string;
  customerName: string;
  arrValue: number;
  currency: string;
  regulatoryFrameworks: Array<{
    id: string;
    name: string;
    status: 'compliant' | 'partial' | 'non_compliant';
    deadline?: string;
  }>;
  keyClause: string;
  clauseReference: string;
  expirationDate: string;
}

export interface DecisionData {
  decisionId: string;
  owner: string;
  customerContext: string;
  status: DecisionStatus;
  deadline?: string;
  financialImpact: {
    arrAtRisk: number;
    potentialPenalty: number;
    currency: string;
  };
  actions: Array<{
    id: string;
    priority: number;
    description: string;
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  }>;
  boardConfirmation?: boolean;
}

export interface RiskCluster {
  id: string;
  name: string;
  description?: string;
  nodes: string[];
  connections: string[];
  centerPosition: CanvasPosition;
  severity: RiskSeverity;
  owner: string;
  tags: string[];
}

export interface ExecutiveCanvasState {
  viewport: ViewportState;
  nodes: ClusterNode[];
  connections: NodeConnection[];
  clusters: RiskCluster[];
  selectedNodeId?: string;
  selectedConnectionId?: string;
  hoveredNodeId?: string;
  presentationMode: boolean;
  showMinimap: boolean;
}

export interface ExecutiveSummary {
  totalArrAtRisk: number;
  criticalIncidents: number;
  pendingDecisions: number;
  complianceScore: number;
  topRiskClusters: Array<{
    clusterId: string;
    name: string;
    severity: RiskSeverity;
    arrExposure: number;
  }>;
}
