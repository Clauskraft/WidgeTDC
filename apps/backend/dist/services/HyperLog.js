/**
 * HyperLog - AI Memory & Event Logging
 *
 * Wrapper around HyperLogService for SelfHealingAdapter compatibility.
 * Logs events for AI learning and system analysis.
 */
import { EventEmitter } from 'events';
export class HyperLog extends EventEmitter {
    constructor() {
        super(...arguments);
        this.events = [];
        this.maxEvents = 10000;
    }
    /**
     * Log an event for AI memory/analysis
     */
    async logEvent(eventType, data = {}) {
        const event = {
            id: this.generateId(),
            timestamp: Date.now(),
            eventType,
            data
        };
        this.events.push(event);
        // Trim if over max
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
        // Emit for real-time subscribers
        this.emit('event', event);
        // Console log for debugging
        console.log(`🧠 [HyperLog] ${eventType}:`, data);
    }
    /**
     * Get events by type
     */
    getEventsByType(eventType, limit = 100) {
        return this.events
            .filter(e => e.eventType === eventType)
            .slice(-limit);
    }
    /**
     * Get recent events
     */
    getRecentEvents(limit = 100) {
        return this.events.slice(-limit);
    }
    /**
     * Get healing-related events for analysis
     */
    getHealingHistory() {
        return this.events.filter(e => e.eventType.startsWith('HEALING_') ||
            e.eventType === 'SELF_HEALING');
    }
    /**
     * Export for AI training/analysis
     */
    exportForAnalysis() {
        const summary = {};
        for (const event of this.events) {
            summary[event.eventType] = (summary[event.eventType] || 0) + 1;
        }
        return { events: this.events, summary };
    }
    generateId() {
        return `hyper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
// Singleton
export const hyperLog = new HyperLog();
