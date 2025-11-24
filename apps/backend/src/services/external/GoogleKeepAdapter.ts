// Google Keep JSON adapter (placeholder, OAuth to be added later)
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class GoogleKeepAdapter implements DataSourceAdapter {
    name = 'Google Keep';
    type: 'other' = 'other';
    private filePath: string;
    private notes: any[] = [];
    private lastLoaded = 0;

    constructor(filePath?: string) {
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/google-keep.json`;
    }

    private async load(): Promise<void> {
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
        } catch (e) {
            console.error(`[GoogleKeepAdapter] Failed to parse JSON:`, e);
            this.notes = [];
        }
    }

    async fetch(): Promise<any[]> {
        const STALE = 5 * 60 * 1000;
        if (this.notes.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.notes;
    }

    async transform(raw: any[]): Promise<any[]> {
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

    async isAvailable(): Promise<boolean> {
        return existsSync(this.filePath);
    }
}
