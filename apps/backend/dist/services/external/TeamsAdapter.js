import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
/** Simple JSON‑based Microsoft Teams adapter (placeholder) */
export class TeamsAdapter {
    constructor(filePath) {
        this.name = 'Teams';
        this.type = 'other';
        this.items = [];
        this.lastLoaded = 0;
        // Default location – export Teams messages to this JSON file
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/teams-messages.json`;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            console.warn(`[TeamsAdapter] File not found: ${this.filePath}`);
            this.items = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.items = Array.isArray(json) ? json : json.value || [];
            this.lastLoaded = Date.now();
            console.log(`[TeamsAdapter] Loaded ${this.items.length} items`);
        }
        catch (e) {
            console.error(`[TeamsAdapter] Failed to parse JSON:`, e);
            this.items = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000;
        if (this.items.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.items;
    }
    async transform(raw) {
        return raw.map(item => ({
            id: item.id ?? item.messageId,
            type: 'message',
            source: 'Teams',
            title: item.subject ?? 'Teams Message',
            content: item.body?.content || item.text || '',
            metadata: {
                provider: 'Teams',
                raw: item,
            },
            timestamp: new Date(item.lastModifiedDateTime ?? Date.now())
        }));
    }
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
