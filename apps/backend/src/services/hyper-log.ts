import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import * as crypto from 'crypto';

// Definition af Hyper-MCP Events (Liquid State)
export type HyperEvent = {
  id: string;
  timestamp: number;
  type: 'THOUGHT' | 'TOOL_USE' | 'DECISION' | 'CRITICAL_STOP' | 'DELEGATION' | 'REASONING_UPDATE' | 'CRITICAL_DECISION' | 'USER_INTENT' | 'INSIGHT' | 'TOOL_SELECTION' | 'DATA_RETRIEVAL' | 'MEMORY_STORED' | 'SYSTEM_ERROR';
  agent: string;
  content: string;
  metadata: Record<string, any>;
};

class HyperLogService extends EventEmitter {
  private static instance: HyperLogService;
  private eventLog: HyperEvent[] = [];

  private constructor() {
    super();
  }

  static getInstance(): HyperLogService {
    if (!HyperLogService.instance) {
      HyperLogService.instance = new HyperLogService();
    }
    return HyperLogService.instance;
  }

  // Metode til at logge en "Tanke" (Non-blocking)
  async log(type: HyperEvent['type'], agent: string, content: string, metadata = {}) {
    const event: HyperEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      agent,
      content,
      metadata
    };
    
    // Gem i hukommelsen (senere: Event Store / Neo4j TimeTree)
    this.eventLog.push(event);
    
    // Udsend til abonnenter (Frontend via WebSocket)
    this.emit('new-event', event);
    
    // Debug i konsollen (så vi kan se det virker)
    // logger.debug(`[HYPER-LOG] 🧠 ${agent}: ${content}`);
    return event.id;
  }

  // Hent historik til grafer
  getHistory(limit = 100): HyperEvent[] {
    return this.eventLog.slice(-limit);
  }

  getRecentEvents(limit = 100): HyperEvent[] {
    return this.getHistory(limit);
  }

  // Analyse: Beregn "Intelligens-Score" (Simuleret KPI)
  getMetrics() {
    const total = this.eventLog.length;
    const tools = this.eventLog.filter(e => e.type === 'TOOL_USE' || e.type === 'TOOL_SELECTION').length;
    return {
      totalThoughts: total,
      toolUsageRate: total > 0 ? (tools / total).toFixed(2) : 0,
      activeAgents: [...new Set(this.eventLog.map(e => e.agent))].length
    };
  }

  exportForAnalysis(): { events: HyperEvent[]; summary: Record<string, number> } {
    const summary: Record<string, number> = {};
    for (const event of this.eventLog) {
      summary[event.type] = (summary[event.type] || 0) + 1;
    }
    return {
      events: [...this.eventLog],
      summary,
    };
  }

  getHealingHistory(): HyperEvent[] {
    return this.eventLog.filter(event => event.type.startsWith('HEALING'));
  }

  // New methods to support Semantic Bus
  async findRelatedThoughts(query: string, limit = 5, minScore = 0.6): Promise<any[]> {
      // Simple keyword match for now
      const lowerQuery = query.toLowerCase();
      return this.eventLog
          .filter(e => e.content.toLowerCase().includes(lowerQuery))
          .slice(-limit)
          .map(e => ({ ...e, score: 0.9 }));
  }

  canDream(): boolean {
      // Check if we have enough data to "dream" (simulate semantic connections)
      return this.eventLog.length > 10;
  }

  async findSimilarTo(eventId: string, limit = 5): Promise<HyperEvent[]> {
      const event = this.eventLog.find(e => e.id === eventId);
      if (!event) return [];
      // Return events from same agent
      return this.eventLog
          .filter(e => e.agent === event.agent && e.id !== eventId)
          .slice(-limit);
  }

  async getCausalPath(eventId: string, maxDepth = 50): Promise<HyperEvent[]> {
      const index = this.eventLog.findIndex(e => e.id === eventId);
      if (index === -1) return [];
      // Return preceding events
      return this.eventLog.slice(Math.max(0, index - 5), index + 1);
  }

  startChain(label: string): string {
      return crypto.randomUUID();
  }
}

export const hyperLog = HyperLogService.getInstance();

