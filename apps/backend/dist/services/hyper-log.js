import { EventEmitter } from 'events';
import * as crypto from 'crypto';
class HyperLogService extends EventEmitter {
    constructor() {
        super();
        this.eventLog = [];
    }
    static getInstance() {
        if (!HyperLogService.instance) {
            HyperLogService.instance = new HyperLogService();
        }
        return HyperLogService.instance;
    }
    // Metode til at logge en "Tanke" (Non-blocking)
    async log(type, agent, content, metadata = {}) {
        const event = {
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
    getHistory(limit = 100) {
        return this.eventLog.slice(-limit);
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
    // New methods to support Semantic Bus
    async findRelatedThoughts(query, limit = 5, minScore = 0.6) {
        // Simple keyword match for now
        const lowerQuery = query.toLowerCase();
        return this.eventLog
            .filter(e => e.content.toLowerCase().includes(lowerQuery))
            .slice(-limit)
            .map(e => ({ ...e, score: 0.9 }));
    }
    canDream() {
        // Check if we have enough data to "dream" (simulate semantic connections)
        return this.eventLog.length > 10;
    }
    async findSimilarTo(eventId, limit = 5) {
        const event = this.eventLog.find(e => e.id === eventId);
        if (!event)
            return [];
        // Return events from same agent
        return this.eventLog
            .filter(e => e.agent === event.agent && e.id !== eventId)
            .slice(-limit);
    }
    async getCausalPath(eventId, maxDepth = 50) {
        const index = this.eventLog.findIndex(e => e.id === eventId);
        if (index === -1)
            return [];
        // Return preceding events
        return this.eventLog.slice(Math.max(0, index - 5), index + 1);
    }
    startChain(label) {
        return crypto.randomUUID();
    }
}
export const hyperLog = HyperLogService.getInstance();
