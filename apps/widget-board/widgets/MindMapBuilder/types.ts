// MindMap Builder - Type Definitions

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  type: 'search' | 'expanded' | 'manual' | 'suggested';
  source?: 'web' | 'drive' | 'pubmed' | 'wikipedia' | 'manual';
  sourceUrl?: string;
  position: { x: number; y: number };
  size: number; // radius
  color?: string;
  isRoot?: boolean;
  isExpanding?: boolean; // loading state
  isTracking?: boolean; // auto-update enabled
  metadata?: Record<string, any>;
  createdAt: string;
  expandedAt?: string;
}

export interface MindMapEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type: 'relates_to' | 'causes' | 'part_of' | 'leads_to' | 'contradicts' | 'supports';
  weight: number; // 0-1, affects line thickness
  animated?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  source: 'web' | 'drive' | 'pubmed' | 'wikipedia';
  relevance: number;
}

export interface ExpansionResult {
  nodes: Omit<MindMapNode, 'position'>[];
  edges: Omit<MindMapEdge, 'id'>[];
  suggestions?: string[];
}

export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  isSearching: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  autoTrackEnabled: boolean;
  trackingInterval: number; // ms
  history: { nodes: MindMapNode[]; edges: MindMapEdge[] }[];
  historyIndex: number;
}

// Layout algorithm types
export interface LayoutOptions {
  type: 'force' | 'radial' | 'tree' | 'manual';
  centerX: number;
  centerY: number;
  nodeSpacing: number;
  levelSpacing: number;
}

// Color palette for node types
export const NODE_COLORS = {
  search: '#00FFFF',    // cyan - user searched
  expanded: '#8B5CF6',  // purple - AI expanded
  manual: '#00FF88',    // green - manually added
  suggested: '#FF8800', // orange - AI suggested
};

export const SOURCE_COLORS = {
  web: '#3B82F6',       // blue
  drive: '#10B981',     // emerald
  pubmed: '#EF4444',    // red
  wikipedia: '#6B7280', // gray
  manual: '#F59E0B',    // amber
};

export const EDGE_COLORS = {
  relates_to: '#6B7280',
  causes: '#EF4444',
  part_of: '#3B82F6',
  leads_to: '#10B981',
  contradicts: '#F59E0B',
  supports: '#8B5CF6',
};
