// Twitter JSON adapter (placeholder, OAuth to be added)
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class TwitterAdapter implements DataSourceAdapter {
    name = 'Twitter';
    type: 'other' = 'other';
    private filePath: string;
    private tweets: any[] = [];
    private lastLoaded = 0;

    constructor(filePath?: string) {
        // Expected JSON export of tweets
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/twitter-data.json`;
    }

    private async load(): Promise<void> {
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
        } catch (e) {
            console.error(`[TwitterAdapter] Failed to parse JSON:`, e);
            this.tweets = [];
        }
    }

    async fetch(): Promise<any[]> {
        const STALE = 5 * 60 * 1000;
        if (this.tweets.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.tweets;
    }

    async transform(raw: any[]): Promise<any[]> {
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

    async isAvailable(): Promise<boolean> {
        return existsSync(this.filePath);
    }
}
