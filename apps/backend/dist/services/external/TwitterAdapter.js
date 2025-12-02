import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
export class TwitterAdapter {
    constructor(filePath) {
        this.name = 'Twitter';
        this.type = 'other';
        this.tweets = [];
        this.lastLoaded = 0;
        // Expected JSON export of tweets
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/twitter-data.json`;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            console.warn(`[TwitterAdapter] File not found: ${this.filePath}`);
            this.tweets = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.tweets = Array.isArray(json) ? json : json.value || [];
            this.lastLoaded = Date.now();
            console.log(`[TwitterAdapter] Loaded ${this.tweets.length} tweets`);
        }
        catch (e) {
            console.error(`[TwitterAdapter] Failed to parse JSON:`, e);
            this.tweets = [];
        }
    }
    async fetch() {
        const STALE = 5 * 60 * 1000;
        if (this.tweets.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.tweets;
    }
    async transform(raw) {
        return raw.map(item => ({
            sourceId: item.id_str ?? item.id,
            type: 'post',
            content: item.text,
            metadata: {
                provider: 'Twitter',
                raw: item
            },
            timestamp: new Date(item.created_at ?? Date.now())
        }));
    }
    async isAvailable() {
        return existsSync(this.filePath);
    }
}
