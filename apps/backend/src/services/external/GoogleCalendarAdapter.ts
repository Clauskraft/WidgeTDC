typescript
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export class GoogleCalendarAdapter implements DataSourceAdapter {
    readonly name = 'Google Calendar';
    readonly type = 'other' as const;
    
    private readonly filePath: string;
    private events: any[] = [];
    private lastLoaded = 0;
    private loadPromise: Promise<void> | null = null;
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(filePath?: string) {
        this.filePath = filePath || join(process.cwd(), 'apps/backend/data/google-calendar.json');
    }

    private async load(): Promise<void> {
        // Prevent concurrent loads
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = (async () => {
            try {
                await stat(this.filePath);
                const data = await readFile(this.filePath, 'utf-8');
                const json = JSON.parse(data);
                this.events = Array.isArray(json) ? json : json.items || [];
                this.lastLoaded = Date.now();
                console.log(`[GoogleCalendarAdapter] Loaded ${this.events.length} events`);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    console.warn(`[GoogleCalendarAdapter] File not found: ${this.filePath}`);
                } else {
                    console.error(`[GoogleCalendarAdapter] Failed to load data:`, error);
                }
                this.events = [];
            } finally {
                this.loadPromise = null;
            }
        })();

        return this.loadPromise;
    }

    async fetch(): Promise<any[]> {
        const isCacheStale = Date.now() - this.lastLoaded > GoogleCalendarAdapter.CACHE_TTL;
        
        if (this.events.length === 0 || isCacheStale) {
            await this.load();
        }
        
        return this.events;
    }

    async transform(raw: any[]): Promise<any[]> {
        return raw.map(item => {
            const startDate = item.start?.dateTime ? new Date(item.start.dateTime) : new Date();
            
            return {
                sourceId: item.id,
                type: 'event' as const,
                content: item.summary || '',
                metadata: {
                    provider: 'Google Calendar',
                    raw: item,
                    location: item.location || null,
                    start: item.start || null,
                    end: item.end || null
                },
                timestamp: startDate
            };
        });
    }

    async isAvailable(): Promise<boolean> {
        try {
            await stat(this.filePath);
            return true;
        } catch {
            return false;
        }
    }
}