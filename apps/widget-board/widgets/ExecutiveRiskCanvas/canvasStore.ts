// Executive Risk Canvas - Zustand Store
// State management for zoom, pan, nodes, and connections

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ExecutiveCanvasState,
  ClusterNode,
  NodeConnection,
  RiskCluster,
  CanvasPosition,
  ViewportState,
} from './types';
import { DEFAULT_CANVAS_STATE } from './defaultConfig';

interface CanvasStore extends ExecutiveCanvasState {
  // Viewport actions
  setZoom: (zoom: number) => void;
  setPan: (pan: CanvasPosition) => void;
  setViewportMode: (mode: 'portfolio' | 'crisis') => void;
  resetViewport: () => void;
  
  // Node actions
  addNode: (node: ClusterNode) => void;
  updateNode: (id: string, updates: Partial<ClusterNode>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: CanvasPosition) => void;
  toggleNodeCollapse: (id: string) => void;
  selectNode: (id: string | undefined) => void;
  hoverNode: (id: string | undefined) => void;
  
  // Connection actions
  addConnection: (connection: NodeConnection) => void;
  updateConnection: (id: string, updates: Partial<NodeConnection>) => void;
  removeConnection: (id: string) => void;
  selectConnection: (id: string | undefined) => void;
  
  // Cluster actions
  addCluster: (cluster: RiskCluster) => void;
  updateCluster: (id: string, updates: Partial<RiskCluster>) => void;
  removeCluster: (id: string) => void;
  focusCluster: (id: string) => void;
  
  // View actions
  togglePresentationMode: () => void;
  toggleMinimap: () => void;
  
  // Bulk actions
  loadState: (state: Partial<ExecutiveCanvasState>) => void;
  resetToDefault: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_CANVAS_STATE,

      // Viewport actions
      setZoom: (zoom) =>
        set((state) => ({
          viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(3, zoom)) },
        })),

      setPan: (pan) =>
        set((state) => ({
          viewport: { ...state.viewport, pan },
        })),

      setViewportMode: (mode) =>
        set((state) => ({
          viewport: { ...state.viewport, mode },
        })),

      resetViewport: () =>
        set({
          viewport: { zoom: 1, pan: { x: 0, y: 0 }, mode: 'crisis' },
        }),

      // Node actions
      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
        })),

      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          connections: state.connections.filter(
            (c) => c.sourceId !== id && c.targetId !== id
          ),
          selectedNodeId: state.selectedNodeId === id ? undefined : state.selectedNodeId,
        })),

      moveNode: (id, position) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, position } : n
          ),
        })),

      toggleNodeCollapse: (id) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, collapsed: !n.collapsed } : n
          ),
        })),

      selectNode: (id) =>
        set({
          selectedNodeId: id,
          selectedConnectionId: undefined,
        }),

      hoverNode: (id) =>
        set({ hoveredNodeId: id }),

      // Connection actions
      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnection: (id, updates) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          selectedConnectionId:
            state.selectedConnectionId === id ? undefined : state.selectedConnectionId,
        })),

      selectConnection: (id) =>
        set({
          selectedConnectionId: id,
          selectedNodeId: undefined,
        }),

      // Cluster actions
      addCluster: (cluster) =>
        set((state) => ({
          clusters: [...state.clusters, cluster],
        })),

      updateCluster: (id, updates) =>
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeCluster: (id) =>
        set((state) => ({
          clusters: state.clusters.filter((c) => c.id !== id),
        })),

      focusCluster: (id) => {
        const cluster = get().clusters.find((c) => c.id === id);
        if (cluster) {
          set({
            viewport: {
              zoom: 1,
              pan: {
                x: -cluster.centerPosition.x + 500,
                y: -cluster.centerPosition.y + 300,
              },
              mode: 'crisis',
            },
          });
        }
      },

      // View actions
      togglePresentationMode: () =>
        set((state) => ({
          presentationMode: !state.presentationMode,
        })),

      toggleMinimap: () =>
        set((state) => ({
          showMinimap: !state.showMinimap,
        })),

      // Bulk actions
      loadState: (newState) =>
        set((state) => ({
          ...state,
          ...newState,
        })),

      resetToDefault: () =>
        set(DEFAULT_CANVAS_STATE),
    }),
    {
      name: 'executive-risk-canvas',
      partialize: (state) => ({
        viewport: state.viewport,
        nodes: state.nodes,
        connections: state.connections,
        clusters: state.clusters,
        showMinimap: state.showMinimap,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useViewport = () => useCanvasStore((s) => s.viewport);
export const useNodes = () => useCanvasStore((s) => s.nodes);
export const useConnections = () => useCanvasStore((s) => s.connections);
export const useClusters = () => useCanvasStore((s) => s.clusters);
export const useSelectedNode = () => {
  const selectedId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  return nodes.find((n) => n.id === selectedId);
};
export const useSelectedConnection = () => {
  const selectedId = useCanvasStore((s) => s.selectedConnectionId);
  const connections = useCanvasStore((s) => s.connections);
  return connections.find((c) => c.id === selectedId);
};
