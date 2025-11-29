// MindMap Builder - Zustand Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MindMapNode,
  MindMapEdge,
  SearchResult,
  MindMapState,
  NODE_COLORS,
} from './types';

// Helper to generate unique IDs
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateEdgeId = () => `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Force-directed layout calculation
const calculateForceLayout = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  centerX: number,
  centerY: number
): MindMapNode[] => {
  if (nodes.length === 0) return nodes;
  
  const iterations = 50;
  const repulsion = 5000;
  const attraction = 0.05;
  const damping = 0.9;
  
  let positions = nodes.map(n => ({ 
    id: n.id, 
    x: n.position.x || centerX + (Math.random() - 0.5) * 200,
    y: n.position.y || centerY + (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
    fixed: n.isRoot,
  }));

  for (let i = 0; i < iterations; i++) {
    // Repulsion between all nodes
    for (let j = 0; j < positions.length; j++) {
      for (let k = j + 1; k < positions.length; k++) {
        const dx = positions[k].x - positions[j].x;
        const dy = positions[k].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (!positions[j].fixed) {
          positions[j].vx -= fx;
          positions[j].vy -= fy;
        }
        if (!positions[k].fixed) {
          positions[k].vx += fx;
          positions[k].vy += fy;
        }
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = positions.find(p => p.id === edge.sourceId);
      const target = positions.find(p => p.id === edge.targetId);
      if (!source || !target) continue;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      if (!source.fixed) {
        source.vx += fx;
        source.vy += fy;
      }
      if (!target.fixed) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // Apply velocities with damping
    for (const pos of positions) {
      if (!pos.fixed) {
        pos.x += pos.vx * damping;
        pos.y += pos.vy * damping;
        pos.vx *= damping;
        pos.vy *= damping;
      }
    }
  }

  return nodes.map(node => {
    const pos = positions.find(p => p.id === node.id);
    return pos ? { ...node, position: { x: pos.x, y: pos.y } } : node;
  });
};

interface MindMapStore extends MindMapState {
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearch: () => void;

  // Node actions
  addNodeFromSearch: (query: string, description?: string) => MindMapNode;
  addNode: (node: Omit<MindMapNode, 'id' | 'createdAt'>) => MindMapNode;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  setNodeExpanding: (nodeId: string, isExpanding: boolean) => void;
  toggleNodeTracking: (nodeId: string) => void;

  // Edge actions
  addEdge: (edge: Omit<MindMapEdge, 'id'>) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<MindMapEdge>) => void;

  // Expansion actions
  expandNode: (nodeId: string, childNodes: Omit<MindMapNode, 'id' | 'position' | 'createdAt'>[], edges: Omit<MindMapEdge, 'id'>[]) => void;

  // Viewport actions
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setZoom: (zoom: number) => void;
  pan: (dx: number, dy: number) => void;
  resetViewport: () => void;
  centerOnNode: (nodeId: string) => void;

  // Layout actions
  applyForceLayout: () => void;
  applyRadialLayout: () => void;

  // Auto-track
  setAutoTrack: (enabled: boolean) => void;
  setTrackingInterval: (interval: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Bulk actions
  clear: () => void;
  loadState: (nodes: MindMapNode[], edges: MindMapEdge[]) => void;
}

export const useMindMapStore = create<MindMapStore>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNodeId: null,
      hoveredNodeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      isSearching: false,
      searchQuery: '',
      searchResults: [],
      autoTrackEnabled: false,
      trackingInterval: 30000,
      history: [],
      historyIndex: -1,

      // Search actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearching: (isSearching) => set({ isSearching }),
      setSearchResults: (results) => set({ searchResults: results }),
      clearSearch: () => set({ searchQuery: '', searchResults: [], isSearching: false }),

      // Node actions
      addNodeFromSearch: (query, description) => {
        const state = get();
        const isFirstNode = state.nodes.length === 0;
        const centerX = 600;
        const centerY = 400;
        
        const newNode: MindMapNode = {
          id: generateId(),
          label: query,
          description,
          type: 'search',
          source: 'web',
          position: isFirstNode 
            ? { x: centerX, y: centerY }
            : { x: centerX + (Math.random() - 0.5) * 300, y: centerY + (Math.random() - 0.5) * 300 },
          size: isFirstNode ? 50 : 40,
          color: NODE_COLORS.search,
          isRoot: isFirstNode,
          createdAt: new Date().toISOString(),
        };

        get().saveHistory();
        set((state) => ({
          nodes: [...state.nodes, newNode],
          selectedNodeId: newNode.id,
          searchQuery: '',
          searchResults: [],
        }));

        return newNode;
      },

      addNode: (nodeData) => {
        const newNode: MindMapNode = {
          ...nodeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        get().saveHistory();
        set((state) => ({ nodes: [...state.nodes, newNode] }));
        return newNode;
      },

      removeNode: (nodeId) => {
        get().saveHistory();
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
        }));
      },

      moveNode: (nodeId, position) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
        }));
      },

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
      hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),

      setNodeExpanding: (nodeId, isExpanding) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, isExpanding } : n)),
        }));
      },

      toggleNodeTracking: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, isTracking: !n.isTracking } : n
          ),
        }));
      },

      // Edge actions
      addEdge: (edgeData) => {
        const newEdge: MindMapEdge = {
          ...edgeData,
          id: generateEdgeId(),
        };
        get().saveHistory();
        set((state) => ({ edges: [...state.edges, newEdge] }));
      },

      removeEdge: (edgeId) => {
        get().saveHistory();
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        }));
      },

      updateEdge: (edgeId, updates) => {
        set((state) => ({
          edges: state.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e)),
        }));
      },

      // Expansion
      expandNode: (nodeId, childNodes, newEdges) => {
        const state = get();
        const parentNode = state.nodes.find((n) => n.id === nodeId);
        if (!parentNode) return;

        get().saveHistory();

        // Calculate positions around parent
        const angleStep = (2 * Math.PI) / childNodes.length;
        const radius = 150;

        const newNodes: MindMapNode[] = childNodes.map((child, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return {
            ...child,
            id: generateId(),
            position: {
              x: parentNode.position.x + Math.cos(angle) * radius,
              y: parentNode.position.y + Math.sin(angle) * radius,
            },
            size: 35,
            color: NODE_COLORS.expanded,
            createdAt: new Date().toISOString(),
          };
        });

        // Create edges from parent to children
        const edges: MindMapEdge[] = newEdges.map((edge, i) => ({
          ...edge,
          id: generateEdgeId(),
          sourceId: nodeId,
          targetId: newNodes[i]?.id || nodeId,
        }));

        set((state) => ({
          nodes: [
            ...state.nodes.map((n) =>
              n.id === nodeId ? { ...n, isExpanding: false, expandedAt: new Date().toISOString() } : n
            ),
            ...newNodes,
          ],
          edges: [...state.edges, ...edges],
        }));

        // Apply force layout after expansion
        setTimeout(() => get().applyForceLayout(), 100);
      },

      // Viewport
      setViewport: (viewport) => set({ viewport }),
      setZoom: (zoom) => {
        const clampedZoom = Math.max(0.2, Math.min(3, zoom));
        set((state) => ({ viewport: { ...state.viewport, zoom: clampedZoom } }));
      },
      pan: (dx, dy) => {
        set((state) => ({
          viewport: { ...state.viewport, x: state.viewport.x + dx, y: state.viewport.y + dy },
        }));
      },
      resetViewport: () => set({ viewport: { x: 0, y: 0, zoom: 1 } }),
      centerOnNode: (nodeId) => {
        const state = get();
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;
        set({
          viewport: {
            x: -node.position.x + 600,
            y: -node.position.y + 400,
            zoom: state.viewport.zoom,
          },
        });
      },

      // Layout
      applyForceLayout: () => {
        const state = get();
        const updatedNodes = calculateForceLayout(state.nodes, state.edges, 600, 400);
        set({ nodes: updatedNodes });
      },

      applyRadialLayout: () => {
        const state = get();
        const rootNode = state.nodes.find((n) => n.isRoot);
        if (!rootNode) return;

        const centerX = 600;
        const centerY = 400;
        const levelSpacing = 150;

        // BFS to find levels
        const levels: Map<string, number> = new Map();
        const queue = [{ id: rootNode.id, level: 0 }];
        levels.set(rootNode.id, 0);

        while (queue.length > 0) {
          const { id, level } = queue.shift()!;
          const connectedEdges = state.edges.filter((e) => e.sourceId === id || e.targetId === id);
          
          for (const edge of connectedEdges) {
            const neighborId = edge.sourceId === id ? edge.targetId : edge.sourceId;
            if (!levels.has(neighborId)) {
              levels.set(neighborId, level + 1);
              queue.push({ id: neighborId, level: level + 1 });
            }
          }
        }

        // Group nodes by level
        const nodesByLevel: Map<number, string[]> = new Map();
        levels.forEach((level, nodeId) => {
          if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
          nodesByLevel.get(level)!.push(nodeId);
        });

        // Position nodes
        const updatedNodes = state.nodes.map((node) => {
          const level = levels.get(node.id) ?? 0;
          const nodesAtLevel = nodesByLevel.get(level) ?? [node.id];
          const indexAtLevel = nodesAtLevel.indexOf(node.id);
          const angleStep = (2 * Math.PI) / nodesAtLevel.length;
          const angle = angleStep * indexAtLevel - Math.PI / 2;
          const radius = level * levelSpacing;

          return {
            ...node,
            position: {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
            },
          };
        });

        set({ nodes: updatedNodes });
      },

      // Auto-track
      setAutoTrack: (enabled) => set({ autoTrackEnabled: enabled }),
      setTrackingInterval: (interval) => set({ trackingInterval: interval }),

      // History
      saveHistory: () => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          edges: JSON.parse(JSON.stringify(state.edges)),
        });
        set({ history: newHistory.slice(-50), historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const prevState = state.history[state.historyIndex - 1];
          set({
            nodes: prevState.nodes,
            edges: prevState.edges,
            historyIndex: state.historyIndex - 1,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1];
          set({
            nodes: nextState.nodes,
            edges: nextState.edges,
            historyIndex: state.historyIndex + 1,
          });
        }
      },

      // Bulk
      clear: () => {
        get().saveHistory();
        set({ nodes: [], edges: [], selectedNodeId: null });
      },

      loadState: (nodes, edges) => {
        get().saveHistory();
        set({ nodes, edges });
      },
    }),
    {
      name: 'mindmap-builder-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        autoTrackEnabled: state.autoTrackEnabled,
      }),
    }
  )
);

export default useMindMapStore;
