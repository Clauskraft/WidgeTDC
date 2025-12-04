/**
 * ProjectMemory - In-memory project lifecycle tracking
 *
 * Uses in-memory storage for development.
 * In production, events are also sent to Neo4j via EventBus.
 */
import { eventBus } from '../../mcp/EventBus.js';
class ProjectMemoryService {
    constructor() {
        this.events = [];
        this.features = new Map();
        this.eventIdCounter = 1;
        this.featureIdCounter = 1;
        this.setupEventListeners();
        console.log('📚 ProjectMemory initialized (in-memory mode)');
    }
    setupEventListeners() {
        // Listen for system alerts and log them as 'other' events
        eventBus.onEvent('system.alert', (event) => {
            this.logLifecycleEvent({
                eventType: 'other',
                status: 'failure', // Alerts are usually bad
                details: { source: 'system.alert', payload: event.payload }
            });
        });
    }
    logLifecycleEvent(event) {
        const now = new Date().toISOString();
        const newEvent = {
            ...event,
            id: this.eventIdCounter++,
            createdAt: now
        };
        this.events.unshift(newEvent); // Add to front for newest-first ordering
        // Keep only last 1000 events in memory
        if (this.events.length > 1000) {
            this.events = this.events.slice(0, 1000);
        }
        console.log(`[ProjectMemory] Logged event: ${event.eventType} - ${event.status}`);
    }
    getLifecycleEvents(limit = 50) {
        return this.events.slice(0, limit);
    }
    addFeature(feature) {
        const now = new Date().toISOString();
        const newFeature = {
            ...feature,
            id: this.featureIdCounter++,
            createdAt: now,
            updatedAt: now
        };
        this.features.set(feature.name, newFeature);
        console.log(`[ProjectMemory] Added feature: ${feature.name}`);
    }
    getFeatures() {
        return Array.from(this.features.values())
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }
    updateFeatureStatus(name, status) {
        const existing = this.features.get(name);
        if (existing) {
            existing.status = status;
            existing.updatedAt = new Date().toISOString();
        }
        else {
            this.addFeature({
                name,
                description: name,
                status
            });
        }
        console.log(`[ProjectMemory] Updated feature ${name} to ${status}`);
    }
}
export const projectMemory = new ProjectMemoryService();
