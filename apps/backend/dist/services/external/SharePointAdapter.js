import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
/** Simple JSON‑based SharePoint adapter (placeholder) */
export class SharePointAdapter {
    constructor(filePath) {
        this.name = 'SharePoint';
        this.type = 'other';
        this.items = [];
        this.lastLoaded = 0;
        // Default location – export SharePoint list items to this JSON file
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/sharepoint-items.json`;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            console.warn(`[SharePointAdapter] File not found: ${this.filePath}`);
            this.items = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.items = Array.isArray(json) ? json : json.value || [];
            this.lastLoaded = Date.now();
            console.log(`[SharePointAdapter] Loaded ${this.items.length} items`);
        }
        catch (e) {
            console.error(`[SharePointAdapter] Failed to parse JSON:`, e);
            this.items = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000; // 5 min
        if (this.items.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.items;
    }
    async transform(raw) {
        return raw.map(item => ({
            id: item.id ?? item.title,
            type: 'list_item',
            source: 'SharePoint',
            title: item.title ?? item.name ?? '',
            content: item.title ?? item.name ?? '',
            metadata: {
                provider: 'SharePoint',
                raw: item,
            },
            timestamp: new Date(item.lastModifiedDateTime ?? Date.now())
        }));
    }
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
