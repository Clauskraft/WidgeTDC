import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
export class OneDriveAdapter {
    constructor(filePath) {
        this.name = 'OneDrive';
        this.type = 'other';
        this.items = [];
        this.lastLoaded = 0;
        // Default JSON export location; can be overridden
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/onedrive-items.json`;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            console.warn(`[OneDriveAdapter] File not found: ${this.filePath}`);
            this.items = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.items = Array.isArray(json) ? json : json.value || [];
            this.lastLoaded = Date.now();
            console.log(`[OneDriveAdapter] Loaded ${this.items.length} items`);
        }
        catch (e) {
            console.error(`[OneDriveAdapter] Failed to parse JSON:`, e);
            this.items = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000; // 5 minutes
        if (this.items.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.items;
    }
    async transform(raw) {
        // Convert OneDrive items to generic ingestion entities
        return raw.map(item => ({
            sourceId: item.id ?? item.name,
            type: 'file',
            content: item.name,
            metadata: {
                provider: 'OneDrive',
                raw: item
            },
            timestamp: new Date(item.lastModifiedDateTime ?? Date.now())
        }));
    }
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
