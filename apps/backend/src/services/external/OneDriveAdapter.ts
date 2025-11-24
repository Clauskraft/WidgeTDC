// OneDrive JSON adapter (placeholder, no OAuth required)
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class OneDriveAdapter implements DataSourceAdapter {
    name = 'OneDrive';
    type: 'other' = 'other';
    private filePath: string;
    private items: any[] = [];
    private lastLoaded = 0;

    constructor(filePath?: string) {
        // Default JSON export location; can be overridden
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/onedrive-items.json`;
    }

    private async load(): Promise<void> {
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
        } catch (e) {
            console.error(`[OneDriveAdapter] Failed to parse JSON:`, e);
            this.items = [];
        }
    }

    async fetch(): Promise<any[]> {
        const STALE = 5 * 60 * 1000; // 5 minutes
        if (this.items.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.items;
    }

    async transform(raw: any[]): Promise<any[]> {
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

    async isAvailable(): Promise<boolean> {
        return existsSync(this.filePath);
    }
}
