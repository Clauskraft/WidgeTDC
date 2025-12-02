import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
export class GoogleCalendarAdapter {
    constructor(filePath) {
        this.name = 'Google Calendar';
        this.type = 'other';
        this.events = [];
        this.lastLoaded = 0;
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/google-calendar.json`;
    }
    async load() {
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
        }
        catch (e) {
            console.error(`[GoogleCalendarAdapter] Failed to parse JSON:`, e);
            this.events = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000;
        if (this.events.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.events;
    }
    async transform(raw) {
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
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
