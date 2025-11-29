import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';

// Definition af Hyper-MCP Events (Liquid State)
export type HyperEvent = {
  id: string;
  timestamp: number;
  type: 'THOUGHT' | 'TOOL_USE' | 'DECISION' | 'CRITICAL_STOP';
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
  log(type: HyperEvent['type'], agent: string, content: string, metadata = {}) {
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
  }

  // Hent historik til grafer
  getHistory(limit = 100): HyperEvent[] {
    return this.eventLog.slice(-limit);
  }

  // Analyse: Beregn "Intelligens-Score" (Simuleret KPI)
  getMetrics() {
    const total = this.eventLog.length;
    const tools = this.eventLog.filter(e => e.type === 'TOOL_USE').length;
    return {
      totalThoughts: total,
      toolUsageRate: total > 0 ? (tools / total).toFixed(2) : 0,
      activeAgents: [...new Set(this.eventLog.map(e => e.agent))].length
    };
  }
}

export const hyperLog = HyperLogService.getInstance();

