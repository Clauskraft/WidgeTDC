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
            const eventType = event.eventType || 'unknown';
            const status = event.status || 'unknown';
            const details = JSON.stringify(event.details || {});

            // Use named parameters for sql.js compatibility
            db.prepare(`
        INSERT INTO project_lifecycle_events (event_type, status, details)
        VALUES ($eventType, $status, $details)
        `).run({ $eventType: eventType, $status: status, $details: details } as any);

            console.log(`[ProjectMemory] Logged event: ${event.eventType} - ${event.status}`);
        } catch (error) {
            console.error('[ProjectMemory] Failed to log event:', error);
        }
    }

    public getLifecycleEvents(limit = 50): LifecycleEvent[] {
        const db = getDatabase();
        try {
            const rows = db.prepare(`
        SELECT * FROM project_lifecycle_events ORDER BY created_at DESC LIMIT $limit
        `).all({ $limit: limit } as any) as any[];

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
        VALUES ($name, $description, $status)
        `).run({ $name: feature.name, $description: feature.description, $status: feature.status } as any);
        } catch (error) {
            console.error('[ProjectMemory] Failed to add feature:', error);
        }
    }

    public getFeatures(): ProjectFeature[] {
        const db = getDatabase();
        try {
            // sql.js .all() doesn't work the same way - use exec instead
            const result = (db as any).exec(`SELECT * FROM project_features ORDER BY updated_at DESC`);

            if (!result || result.length === 0) {
                return [];
            }

            const columns = result[0].columns;
            const values = result[0].values;

            return values.map((row: any[]) => {
                const obj: any = {};
                columns.forEach((col: string, idx: number) => {
                    obj[col] = row[idx];
                });
                return {
                    id: obj.id,
                    name: obj.name,
                    description: obj.description,
                    status: obj.status,
                    createdAt: obj.created_at,
                    updatedAt: obj.updated_at
                };
            });
        } catch (error) {
            console.error('[ProjectMemory] Failed to get features:', error);
            return [];
        }
    }

    public updateFeatureStatus(name: string, status: ProjectFeature['status']): void {
        const db = getDatabase();
        try {
            // First, check if feature exists
            const existing = db.prepare(`SELECT id FROM project_features WHERE name = $name`).get({ $name: name } as any);

            if (existing) {
                // Update existing
                db.prepare(`UPDATE project_features SET status = $status WHERE name = $name`).run({ $status: status, $name: name } as any);
            } else {
                // Insert new feature with minimal data
                db.prepare(`
                    INSERT INTO project_features (name, description, status)
                    VALUES ($name, $description, $status)
                `).run({ $name: name, $description: name, $status: status } as any);
            }
        } catch (error) {
            console.error('[ProjectMemory] Failed to update feature:', error);
        }
    }
}

export const projectMemory = new ProjectMemoryService();
