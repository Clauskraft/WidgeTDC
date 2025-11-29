// Strategic Cockpit - Zustand Store
// State management with persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CockpitState,
  CockpitAgent,
  ObservationCard,
  AgentStatus,
  NeuralStreamSection,
  GraphNode,
  GraphEdge,
  RelatedDocument,
  RelatedActor,
  RelatedIncident,
  AffectingPolicy,
} from './types';
import { defaultCockpitState } from './defaultConfig';

interface CockpitActions {
  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setZoom: (zoom: number) => void;
  pan: (dx: number, dy: number) => void;
  resetViewport: () => void;

  // Cards
  selectCard: (cardId: string | null) => void;
  hoverCard: (cardId: string | null) => void;
  moveCard: (cardId: string, position: { x: number; y: number }) => void;
  resizeCard: (cardId: string, size: { width: number; height: number }) => void;
  toggleCardCollapse: (cardId: string) => void;
  addCard: (card: ObservationCard) => void;
  removeCard: (cardId: string) => void;
  updateCard: (cardId: string, updates: Partial<ObservationCard>) => void;
  connectCards: (sourceId: string, targetId: string) => void;
  disconnectCards: (sourceId: string, targetId: string) => void;

  // Agents
  updateAgentStatus: (agentId: string, status: AgentStatus, message?: string) => void;
  updateAgentTask: (agentId: string, task: string | undefined) => void;
  toggleAgentCouncil: () => void;

  // Neural Stream
  setActiveNeuralSection: (section: NeuralStreamSection) => void;
  updateNeuralContext: (cardId: string) => void;
  setNeuralLoading: (loading: boolean) => void;
  toggleNeuralStream: () => void;
  setNeuralDocuments: (docs: RelatedDocument[]) => void;
  setNeuralActors: (actors: RelatedActor[]) => void;
  setNeuralIncidents: (incidents: RelatedIncident[]) => void;
  setNeuralPolicies: (policies: AffectingPolicy[]) => void;

  // Mindmap
  toggleMindmap: () => void;
  setMindmapMode: (mode: 'overlay' | 'panel') => void;
  addGraphNode: (node: GraphNode) => void;
  removeGraphNode: (nodeId: string) => void;
  updateGraphNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  moveGraphNode: (nodeId: string, position: { x: number; y: number }) => void;
  selectGraphNode: (nodeId: string | null) => void;
  addGraphEdge: (edge: GraphEdge) => void;
  removeGraphEdge: (edgeId: string) => void;
  setMindmapViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Connection mode
  startConnecting: (sourceId: string) => void;
  cancelConnecting: () => void;

  // WebSocket
  setWsConnected: (connected: boolean) => void;
  setLastUpdate: (timestamp: string) => void;

  // Bulk operations
  loadState: (state: Partial<CockpitState>) => void;
  resetToDefault: () => void;
}

type CockpitStore = CockpitState & CockpitActions;

export const useCockpitStore = create<CockpitStore>()(
  persist(
    (set, get) => ({
      ...defaultCockpitState,

      // Viewport
      setViewport: (viewport) => set({ viewport }),
      setZoom: (zoom) => set((state) => ({
        viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(3, zoom)) }
      })),
      pan: (dx, dy) => set((state) => ({
        viewport: {
          ...state.viewport,
          x: state.viewport.x + dx,
          y: state.viewport.y + dy,
        }
      })),
      resetViewport: () => set({ viewport: { x: 0, y: 0, zoom: 1 } }),

      // Cards
      selectCard: (cardId) => {
        set({ selectedCardId: cardId });
        if (cardId) {
          get().updateNeuralContext(cardId);
        }
      },
      hoverCard: (cardId) => set({ hoveredCardId: cardId }),
      moveCard: (cardId, position) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? { ...card, position } : card
        ),
      })),
      resizeCard: (cardId, size) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? { ...card, size } : card
        ),
      })),
      toggleCardCollapse: (cardId) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? { ...card, isCollapsed: !card.isCollapsed } : card
        ),
      })),
      addCard: (card) => set((state) => ({
        cards: [...state.cards, card],
      })),
      removeCard: (cardId) => set((state) => ({
        cards: state.cards.filter((card) => card.id !== cardId),
        selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
      })),
      updateCard: (cardId, updates) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      })),
      connectCards: (sourceId, targetId) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === sourceId && !card.connections.includes(targetId)
            ? { ...card, connections: [...card.connections, targetId] }
            : card
        ),
        isConnecting: false,
        connectionSource: null,
      })),
      disconnectCards: (sourceId, targetId) => set((state) => ({
        cards: state.cards.map((card) =>
          card.id === sourceId
            ? { ...card, connections: card.connections.filter((id) => id !== targetId) }
            : card
        ),
      })),

      // Agents
      updateAgentStatus: (agentId, status, message) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId
            ? { ...agent, status, statusMessage: message, lastActivity: new Date().toISOString() }
            : agent
        ),
      })),
      updateAgentTask: (agentId, task) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId
            ? { ...agent, currentTask: task, lastActivity: new Date().toISOString() }
            : agent
        ),
      })),
      toggleAgentCouncil: () => set((state) => ({
        showAgentCouncil: !state.showAgentCouncil,
      })),

      // Neural Stream
      setActiveNeuralSection: (section) => set({ activeNeuralSection: section }),
      updateNeuralContext: (cardId) => set((state) => ({
        neuralStream: { ...state.neuralStream, selectedCardId: cardId },
      })),
      setNeuralLoading: (loading) => set((state) => ({
        neuralStream: { ...state.neuralStream, isLoading: loading },
      })),
      toggleNeuralStream: () => set((state) => ({
        showNeuralStream: !state.showNeuralStream,
      })),
      setNeuralDocuments: (docs) => set((state) => ({
        neuralStream: { ...state.neuralStream, documents: docs },
      })),
      setNeuralActors: (actors) => set((state) => ({
        neuralStream: { ...state.neuralStream, actors: actors },
      })),
      setNeuralIncidents: (incidents) => set((state) => ({
        neuralStream: { ...state.neuralStream, incidents: incidents },
      })),
      setNeuralPolicies: (policies) => set((state) => ({
        neuralStream: { ...state.neuralStream, policies: policies },
      })),

      // Mindmap
      toggleMindmap: () => set((state) => ({
        showMindmap: !state.showMindmap,
      })),
      setMindmapMode: (mode) => set({ mindmapMode: mode }),
      addGraphNode: (node) => set((state) => ({
        mindmap: { ...state.mindmap, nodes: [...state.mindmap.nodes, node] },
      })),
      removeGraphNode: (nodeId) => set((state) => ({
        mindmap: {
          ...state.mindmap,
          nodes: state.mindmap.nodes.filter((n) => n.id !== nodeId),
          edges: state.mindmap.edges.filter(
            (e) => e.sourceId !== nodeId && e.targetId !== nodeId
          ),
        },
      })),
      updateGraphNode: (nodeId, updates) => set((state) => ({
        mindmap: {
          ...state.mindmap,
          nodes: state.mindmap.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...updates } : n
          ),
        },
      })),
      moveGraphNode: (nodeId, position) => set((state) => ({
        mindmap: {
          ...state.mindmap,
          nodes: state.mindmap.nodes.map((n) =>
            n.id === nodeId ? { ...n, position } : n
          ),
        },
      })),
      selectGraphNode: (nodeId) => set((state) => ({
        mindmap: { ...state.mindmap, selectedNodeId: nodeId },
      })),
      addGraphEdge: (edge) => set((state) => ({
        mindmap: { ...state.mindmap, edges: [...state.mindmap.edges, edge] },
      })),
      removeGraphEdge: (edgeId) => set((state) => ({
        mindmap: {
          ...state.mindmap,
          edges: state.mindmap.edges.filter((e) => e.id !== edgeId),
        },
      })),
      setMindmapViewport: (viewport) => set((state) => ({
        mindmap: { ...state.mindmap, viewport },
      })),

      // Connection mode
      startConnecting: (sourceId) => set({
        isConnecting: true,
        connectionSource: sourceId,
      }),
      cancelConnecting: () => set({
        isConnecting: false,
        connectionSource: null,
      }),

      // WebSocket
      setWsConnected: (connected) => set({ wsConnected: connected }),
      setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

      // Bulk operations
      loadState: (state) => set((current) => ({ ...current, ...state })),
      resetToDefault: () => set(defaultCockpitState),
    }),
    {
      name: 'strategic-cockpit-storage',
      partialize: (state) => ({
        viewport: state.viewport,
        cards: state.cards,
        showAgentCouncil: state.showAgentCouncil,
        showNeuralStream: state.showNeuralStream,
        showMindmap: state.showMindmap,
        mindmapMode: state.mindmapMode,
        mindmap: state.mindmap,
      }),
    }
  )
);

export default useCockpitStore;
