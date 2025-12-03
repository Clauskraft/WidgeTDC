/**
 * ProjectMemory - In-memory project lifecycle tracking
 *
 * Uses in-memory storage for development.
 * In production, events are also sent to Neo4j via EventBus.
 */

import { eventBus } from '../../mcp/EventBus.js';

export interface LifecycleEvent {
    id?: number;
    eventType: 'build' | 'test' | 'deploy' | 'feature' | 'other';
    status: 'success' | 'failure' | 'in_progress';
    details: any;
    createdAt?: string;
}

export interface ProjectFeature {
    id?: number;
    name: string;
    description: string;
    status: 'planned' | 'in_progress' | 'completed' | 'deprecated';
    createdAt?: string;
    updatedAt?: string;
}

class ProjectMemoryService {
    private events: LifecycleEvent[] = [];
    private features: Map<string, ProjectFeature> = new Map();
    private eventIdCounter = 1;
    private featureIdCounter = 1;

    constructor() {
        this.setupEventListeners();
        console.log('📚 ProjectMemory initialized (in-memory mode)');
    }

    private setupEventListeners() {
        // Listen for system alerts and log them as 'other' events
        eventBus.onEvent('system.alert', (event) => {
            this.logLifecycleEvent({
                eventType: 'other',
                status: 'failure', // Alerts are usually bad
                details: { source: 'system.alert', payload: event.payload }
            });
        });
    }

    public logLifecycleEvent(event: LifecycleEvent): void {
        const now = new Date().toISOString();
        const newEvent: LifecycleEvent = {
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

    public getLifecycleEvents(limit = 50): LifecycleEvent[] {
        return this.events.slice(0, limit);
    }

    public addFeature(feature: ProjectFeature): void {
        const now = new Date().toISOString();
        const newFeature: ProjectFeature = {
            ...feature,
            id: this.featureIdCounter++,
            createdAt: now,
            updatedAt: now
        };

        this.features.set(feature.name, newFeature);
        console.log(`[ProjectMemory] Added feature: ${feature.name}`);
    }

    public getFeatures(): ProjectFeature[] {
        return Array.from(this.features.values())
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }

    public updateFeatureStatus(name: string, status: ProjectFeature['status']): void {
        const existing = this.features.get(name);

        if (existing) {
            existing.status = status;
            existing.updatedAt = new Date().toISOString();
        } else {
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
