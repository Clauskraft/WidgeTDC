// Gmail JSON adapter (placeholder, OAuth to be added later)
import { DataSourceAdapter } from '../../services/ingestion/DataIngestionEngine.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class GmailAdapter implements DataSourceAdapter {
    name = 'Gmail';
    type: 'other' = 'other';
    private filePath: string;
    private mails: any[] = [];
    private lastLoaded = 0;

    constructor(filePath?: string) {
        this.filePath = filePath || `${process.cwd()}/apps/backend/data/gmail-messages.json`;
    }

    private async load(): Promise<void> {
        if (!existsSync(this.filePath)) {
            console.warn(`[GmailAdapter] File not found: ${this.filePath}`);
            this.mails = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            const json = JSON.parse(data);
            this.mails = Array.isArray(json) ? json : json.value || [];
            this.lastLoaded = Date.now();
            console.log(`[GmailAdapter] Loaded ${this.mails.length} messages`);
        } catch (e) {
            console.error(`[GmailAdapter] Failed to parse JSON:`, e);
            this.mails = [];
        }
    }

    async fetch(): Promise<any[]> {
        const STALE = 5 * 60 * 1000;
        if (this.mails.length === 0 || Date.now() - this.lastLoaded > STALE) {
            await this.load();
        }
        return this.mails;
    }

    async transform(raw: any[]): Promise<any[]> {
        return raw.map(item => ({
            sourceId: item.id ?? item.messageId,
            type: 'email',
            content: item.snippet ?? item.body ?? '',
            metadata: {
                provider: 'Gmail',
                raw: item,
                subject: item.subject,
                from: item.from?.emailAddress?.address,
                to: item.to?.map((r: any) => r.emailAddress?.address) ?? []
            },
            timestamp: new Date(item.internalDate ?? Date.now())
        }));
    }

    async isAvailable(): Promise<boolean> {
        return existsSync(this.filePath);
    }
}
