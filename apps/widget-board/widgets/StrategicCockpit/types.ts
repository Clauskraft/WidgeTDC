// Strategic Cockpit - Type Definitions
// Glass, Neon & The Graph Theme

// ============================================================
// AGENT COUNCIL TYPES
// ============================================================

export type AgentStatus = 'idle' | 'active' | 'warning' | 'blocked';

export interface CockpitAgent {
  id: string;
  name: string;
  role: 'security' | 'governance' | 'legal' | 'data' | 'orchestrator' | 'creative';
  status: AgentStatus;
  currentTask?: string;
  statusMessage?: string;
  lastActivity: string; // ISO timestamp
  metrics?: {
    tasksCompleted: number;
    tasksInProgress: number;
    alertsRaised: number;
  };
}

// ============================================================
// OBSERVATION CARDS (External Insights)
// ============================================================

export type CardCategory = 
  | 'digital-sovereignty' 
  | 'nis2-threats' 
  | 'ai-security' 
  | 'privacy-chat';

export type CardPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ObservationCard {
  id: string;
  category: CardCategory;
  title: string;
  summary: string;
  priority: CardPriority;
  source?: string;
  timestamp: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isCollapsed: boolean;
  connections: string[]; // IDs of connected cards
  tags: string[];
  metadata?: Record<string, any>;
}

// ============================================================
// NEURAL STREAM TYPES
// ============================================================

export type NeuralStreamSection = 
  | 'related-documents' 
  | 'related-actors' 
  | 'related-incidents' 
  | 'affecting-policies';

export interface RelatedDocument {
  id: string;
  title: string;
  source: string;
  type: 'legislation' | 'report' | 'standard' | 'guidance' | 'article';
  url?: string;
  relevanceScore: number;
  snippet?: string;
}

export interface RelatedActor {
  id: string;
  name: string;
  type: 'country' | 'organization' | 'person' | 'group';
  role: string;
  influence: 'high' | 'medium' | 'low';
  stance?: string;
}

export interface RelatedIncident {
  id: string;
  title: string;
  type: 'breach' | 'attack' | 'vulnerability' | 'policy-event' | 'debate';
  date: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  sources?: string[];
}

export interface AffectingPolicy {
  id: string;
  name: string;
  type: 'internal' | 'external';
  jurisdiction: string;
  status: 'active' | 'pending' | 'proposed' | 'delayed';
  relevance: string;
  complianceStatus?: 'compliant' | 'partial' | 'non-compliant' | 'unknown';
}

export interface NeuralStreamContext {
  selectedCardId: string | null;
  documents: RelatedDocument[];
  actors: RelatedActor[];
  incidents: RelatedIncident[];
  policies: AffectingPolicy[];
  isLoading: boolean;
}

// ============================================================
// MINDMAP / GRAPH TYPES
// ============================================================

export type GraphNodeType = 
  | 'threat' 
  | 'policy' 
  | 'actor' 
  | 'incident' 
  | 'project' 
  | 'decision'
  | 'trend'
  | 'technology';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  description?: string;
  properties: Record<string, any>;
  position: { x: number; y: number };
  size: number;
  color?: string;
  isNew?: boolean; // For animation of newly added nodes
  source?: 'linkedin' | 'media' | 'internal' | 'api';
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'relates_to' | 'causes' | 'regulates' | 'involves' | 'impacts';
  label?: string;
  weight: number;
  animated?: boolean;
}

export interface MindmapState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedNodeId: string | null;
}

// ============================================================
// WORKSPACE STATE
// ============================================================

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface CockpitState {
  // Viewport
  viewport: ViewportState;
  
  // Cards on canvas
  cards: ObservationCard[];
  selectedCardId: string | null;
  hoveredCardId: string | null;
  
  // Agent Council
  agents: CockpitAgent[];
  
  // Neural Stream
  neuralStream: NeuralStreamContext;
  activeNeuralSection: NeuralStreamSection;
  
  // Mindmap
  mindmap: MindmapState;
  showMindmap: boolean;
  mindmapMode: 'overlay' | 'panel';
  
  // UI State
  showAgentCouncil: boolean;
  showNeuralStream: boolean;
  showMarketRadar: boolean;
  isConnecting: boolean;
  connectionSource: string | null;
  
  // WebSocket
  wsConnected: boolean;
  lastUpdate: string | null;
}

// ============================================================
// ACTION TYPES
// ============================================================

export interface CardConnectionDrag {
  sourceId: string;
  currentPosition: { x: number; y: number };
}

export interface WebSocketMessage {
  type: 'agent_update' | 'new_node' | 'card_update' | 'context_update';
  payload: any;
  timestamp: string;
}

// ============================================================
// THEME CONSTANTS
// ============================================================

export const NEON_COLORS = {
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  green: '#00FF88',
  orange: '#FF8800',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  red: '#EF4444',
  amber: '#F59E0B',
} as const;

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#6B7280',      // Gray
  active: '#10B981',    // Green
  warning: '#F59E0B',   // Amber
  blocked: '#EF4444',   // Red
};

export const CARD_CATEGORY_COLORS: Record<CardCategory, string> = {
  'digital-sovereignty': NEON_COLORS.cyan,
  'nis2-threats': NEON_COLORS.orange,
  'ai-security': NEON_COLORS.purple,
  'privacy-chat': NEON_COLORS.magenta,
};

export const PRIORITY_COLORS: Record<CardPriority, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

export const NODE_TYPE_COLORS: Record<GraphNodeType, string> = {
  threat: '#EF4444',
  policy: '#3B82F6',
  actor: '#8B5CF6',
  incident: '#F59E0B',
  project: '#10B981',
  decision: '#EC4899',
  trend: '#06B6D4',
  technology: '#6366F1',
};
