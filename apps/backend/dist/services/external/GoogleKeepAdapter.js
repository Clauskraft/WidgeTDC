import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
export class GoogleKeepAdapter {
    constructor(filePath) {
        this.name = 'Google Keep';
        this.type = 'other';
        this.notes = [];
        this.lastLoaded = 0;
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/google-keep.json`;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            console.warn(`[GoogleKeepAdapter] File not found: ${this.filePath}`);
            this.notes = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.notes = Array.isArray(json) ? json : json.items || [];
            this.lastLoaded = Date.now();
            console.log(`[GoogleKeepAdapter] Loaded ${this.notes.length} notes`);
        }
        catch (e) {
            console.error(`[GoogleKeepAdapter] Failed to parse JSON:`, e);
            this.notes = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000;
        if (this.notes.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.notes;
    }
    async transform(raw) {
        return raw.map(item => ({
            sourceId: item.id ?? item.title,
            type: 'note',
            content: item.title ?? '',
            metadata: {
                provider: 'Google Keep',
                raw: item,
                labels: item.labels ?? []
            },
            timestamp: new Date(item.createdTime ?? Date.now())
        }));
    }
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
