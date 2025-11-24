// Google Calendar JSON adapter (placeholder, OAuth to be added later)
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class GoogleCalendarAdapter implements DataSourceAdapter {
    name = 'Google Calendar';
    type: 'other' = 'other';
    private filePath: string;
    private events: any[] = [];
    private lastLoaded = 0;

    constructor(filePath?: string) {
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/google-calendar.json`;
    }

    private async load(): Promise<void> {
        if (!existsSync(this.filePath)) {
            console.warn(`[GoogleCalendarAdapter] File not found: ${this.filePath}`);
            this.events = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.events = Array.isArray(json) ? json : json.items || [];
            this.lastLoaded = Date.now();
            console.log(`[GoogleCalendarAdapter] Loaded ${this.events.length} events`);
        } catch (e) {
            console.error(`[GoogleCalendarAdapter] Failed to parse JSON:`, e);
            this.events = [];
        }
    }

    async fetch(): Promise<any[]> {
        const STALE = 5 * 60 * 1000;
        if (this.events.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.events;
    }

    async transform(raw: any[]): Promise<any[]> {
        return raw.map(item => ({
            sourceId: item.id,
            type: 'event',
            content: item.summary ?? '',
            metadata: {
                provider: 'Google Calendar',
                raw: item,
                location: item.location,
                start: item.start,
                end: item.end
            },
            timestamp: new Date(item.start?.dateTime ?? Date.now())
        }));
    }

    async isAvailable(): Promise<boolean> {
        return existsSync(this.filePath);
    }
}
