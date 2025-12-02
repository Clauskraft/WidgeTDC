/**
 * HyperLog - AI Memory & Event Logging
 * 
 * Wrapper around HyperLogService for SelfHealingAdapter compatibility.
 * Logs events for AI learning and system analysis.
 */

import { EventEmitter } from 'events';

interface HyperLogEvent {
  id: string;
  timestamp: number;
  eventType: string;
  data: Record<string, any>;
}

export class HyperLog extends EventEmitter {
  private events: HyperLogEvent[] = [];
  private maxEvents = 10000;

  /**
   * Log an event for AI memory/analysis
   */
  async logEvent(eventType: string, data: Record<string, any> = {}): Promise<void> {
    const event: HyperLogEvent = {
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
  getEventsByType(eventType: string, limit: number = 100): HyperLogEvent[] {
    return this.events
      .filter(e => e.eventType === eventType)
      .slice(-limit);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): HyperLogEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get healing-related events for analysis
   */
  getHealingHistory(): HyperLogEvent[] {
    return this.events.filter(e => 
      e.eventType.startsWith('HEALING_') || 
      e.eventType === 'SELF_HEALING'
    );
  }

  /**
   * Export for AI training/analysis
   */
  exportForAnalysis(): { events: HyperLogEvent[]; summary: Record<string, number> } {
    const summary: Record<string, number> = {};
    
    for (const event of this.events) {
      summary[event.eventType] = (summary[event.eventType] || 0) + 1;
    }

    return { events: this.events, summary };
  }

  private generateId(): string {
    return `hyper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton
export const hyperLog = new HyperLog();
