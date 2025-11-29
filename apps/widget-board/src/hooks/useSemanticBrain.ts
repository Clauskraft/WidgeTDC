import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Semantic Brain Hook - Widget Telepathy
 *
 * Allows any widget to:
 * 1. "Dream" - Search for related thoughts across collective memory
 * 2. "Broadcast" - Send thoughts into the semantic bus
 * 3. "Listen" - React to related thoughts in real-time
 *
 * Usage:
 * ```tsx
 * const { thoughts, recall, broadcast, isThinking, brainStatus } = useSemanticBrain();
 *
 * // Find related thoughts
 * await recall("user wants security analysis");
 *
 * // Broadcast a thought
 * await broadcast("INSIGHT", "Detected unusual login pattern", { confidence: 0.87 });
 * ```
 */

export interface RelatedThought {
  id: string;
  content: string;
  agent: string;
  type: string;
  timestamp: number;
  score: number;
}

export interface BrainStatus {
  canDream: boolean;
  status: 'dreaming' | 'awake';
  metrics: {
    totalThoughts: number;
    thoughtsWithEmbeddings: number;
    embeddingCoverage: string;
    activeAgents: number;
    agentList: string[];
  };
}

export type HyperEventType =
  | 'USER_INTENT'
  | 'THOUGHT'
  | 'TOOL_SELECTION'
  | 'TOOL_EXECUTION'
  | 'DATA_RETRIEVAL'
  | 'REASONING_UPDATE'
  | 'HYPOTHESIS'
  | 'INSIGHT'
  | 'CRITICAL_DECISION'
  | 'PATTERN_RECOGNIZED'
  | 'SYSTEM_ERROR';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useSemanticBrain = (widgetName?: string) => {
  const [thoughts, setThoughts] = useState<RelatedThought[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [brainStatus, setBrainStatus] = useState<BrainStatus | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const agentName = widgetName || 'UnknownWidget';

  // Fetch brain status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hyper/status`);
        if (res.ok) {
          const data = await res.json();
          setBrainStatus(data);
        }
      } catch (error) {
        console.warn('[SemanticBrain] Could not fetch brain status:', error);
      }
    };

    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Recall - Search for related thoughts by semantic meaning
   * This is the "dreaming" capability
   */
  const recall = useCallback(async (
    context: string,
    options: { limit?: number; minScore?: number } = {}
  ): Promise<RelatedThought[]> => {
    setIsThinking(true);
    setLastQuery(context);

    try {
      const res = await fetch(`${API_BASE}/api/hyper/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: context,
          limit: options.limit || 5,
          minScore: options.minScore || 0.6
        })
      });

      if (!res.ok) {
        throw new Error('Dream request failed');
      }

      const data = await res.json();
      setThoughts(data.results);
      return data.results;
    } catch (error) {
      console.error('[SemanticBrain] Recall failed:', error);
      setThoughts([]);
      return [];
    } finally {
      setIsThinking(false);
    }
  }, []);

  /**
   * Broadcast - Send a thought into the collective consciousness
   * Other widgets can pick this up via semantic search
   */
  const broadcast = useCallback(async (
    type: HyperEventType,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/hyper/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          agent: agentName,
          content,
          metadata
        })
      });

      if (!res.ok) {
        throw new Error('Broadcast failed');
      }

      const data = await res.json();
      return data.eventId;
    } catch (error) {
      console.error('[SemanticBrain] Broadcast failed:', error);
      return null;
    }
  }, [agentName]);

  /**
   * Find thoughts similar to a specific event
   */
  const findSimilar = useCallback(async (
    eventId: string,
    limit = 5
  ): Promise<RelatedThought[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/hyper/similar/${eventId}?limit=${limit}`);

      if (!res.ok) {
        throw new Error('Similarity search failed');
      }

      const data = await res.json();
      return data.results;
    } catch (error) {
      console.error('[SemanticBrain] FindSimilar failed:', error);
      return [];
    }
  }, []);

  /**
   * Rewind - Get the causal path leading to a thought
   * "How did we get here?"
   */
  const rewind = useCallback(async (
    eventId: string,
    maxDepth = 50
  ): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/hyper/rewind/${eventId}?maxDepth=${maxDepth}`);

      if (!res.ok) {
        throw new Error('Rewind failed');
      }

      const data = await res.json();
      return data.path;
    } catch (error) {
      console.error('[SemanticBrain] Rewind failed:', error);
      return [];
    }
  }, []);

  /**
   * Get recent thoughts from the collective
   */
  const getRecentThoughts = useCallback(async (limit = 20): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/hyper/events`);

      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await res.json();
      return data.events.slice(0, limit);
    } catch (error) {
      console.error('[SemanticBrain] GetRecentThoughts failed:', error);
      return [];
    }
  }, []);

  /**
   * Start a new thought chain (for grouping related thoughts)
   */
  const startChain = useCallback(async (label?: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/hyper/chain/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });

      if (!res.ok) {
        throw new Error('Failed to start chain');
      }

      const data = await res.json();
      return data.correlationId;
    } catch (error) {
      console.error('[SemanticBrain] StartChain failed:', error);
      return null;
    }
  }, []);

  // Helper: Check if brain can do semantic search
  const canDream = brainStatus?.canDream ?? false;

  // Helper: Get highest scored thought
  const topThought = thoughts.length > 0 ? thoughts[0] : null;

  // Helper: Check if a thought is highly relevant (score > 0.8)
  const hasHighRelevance = thoughts.some(t => t.score > 0.8);

  return {
    // State
    thoughts,
    isThinking,
    brainStatus,
    lastQuery,
    canDream,
    topThought,
    hasHighRelevance,

    // Actions
    recall,
    broadcast,
    findSimilar,
    rewind,
    getRecentThoughts,
    startChain,

    // Convenience: Combined intent + recall
    async thinkAbout(topic: string) {
      await broadcast('THOUGHT', `Considering: ${topic}`);
      return recall(topic);
    },

    // Convenience: Broadcast an insight
    async shareInsight(insight: string, confidence?: number) {
      return broadcast('INSIGHT', insight, { confidence });
    },

    // Convenience: Report a decision
    async shareDecision(decision: string, alternatives?: string[]) {
      return broadcast('CRITICAL_DECISION', decision, { alternatives });
    }
  };
};

export default useSemanticBrain;
