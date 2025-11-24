import { getDatabase } from '../../database/index.js';
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
    constructor() {
        this.setupEventListeners();
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
        const db = getDatabase();
        try {
            db.prepare(`
        INSERT INTO project_lifecycle_events (event_type, status, details, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(event.eventType, event.status, JSON.stringify(event.details || {}));

            console.log(`[ProjectMemory] Logged event: ${event.eventType} - ${event.status}`);
        } catch (error) {
            console.error('[ProjectMemory] Failed to log event:', error);
        }
    }

    public getLifecycleEvents(limit = 50): LifecycleEvent[] {
        const db = getDatabase();
        try {
            const rows = db.prepare(`
        SELECT * FROM project_lifecycle_events ORDER BY created_at DESC LIMIT ?
        `).all(limit) as any[];

            return rows.map(row => ({
                id: row.id,
                eventType: row.event_type,
                status: row.status,
                details: JSON.parse(row.details),
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error('[ProjectMemory] Failed to get events:', error);
            return [];
        }
    }

    public addFeature(feature: ProjectFeature): void {
        const db = getDatabase();
        try {
            db.prepare(`
        INSERT INTO project_features (name, description, status)
        VALUES (?, ?, ?)
        `).run(feature.name, feature.description, feature.status);
        } catch (error) {
            console.error('[ProjectMemory] Failed to add feature:', error);
        }
    }

    public getFeatures(): ProjectFeature[] {
        const db = getDatabase();
        try {
            const rows = db.prepare(`
        SELECT * FROM project_features ORDER BY updated_at DESC
        `).all() as any[];

            return rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } catch (error) {
            console.error('[ProjectMemory] Failed to get features:', error);
            return [];
        }
    }

    public updateFeatureStatus(name: string, status: ProjectFeature['status']): void {
        const db = getDatabase();
        try {
            db.prepare(`
            UPDATE project_features SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?
        `).run(status, name);
        } catch (error) {
            console.error('[ProjectMemory] Failed to update feature:', error);
        }
    }
}

export const projectMemory = new ProjectMemoryService();
