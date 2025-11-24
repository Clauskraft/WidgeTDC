// OutlookEmailReader – Wraps existing OutlookJsonAdapter for data ingestion
import { DataSourceAdapter, IngestedEntity } from './DataIngestionEngine.js';
import { OutlookJsonAdapter } from '../external/OutlookJsonAdapter.js';
import * as path from 'path';
import * as fs from 'fs';

export class OutlookEmailReader implements DataSourceAdapter {
    name = 'Outlook Email';
    type = 'outlook_mail' as const;

    private adapter: OutlookJsonAdapter;
    private jsonPath: string;

    constructor(jsonPath?: string) {
        // Default path: apps/backend/data/outlook-mails.json
        this.jsonPath = jsonPath || path.join(process.cwd(), 'apps', 'backend', 'data', 'outlook-mails.json');
        this.adapter = new OutlookJsonAdapter(this.jsonPath);
    }

    async isAvailable(): Promise<boolean> {
        try {
            return fs.existsSync(this.jsonPath);
        } catch {
            return false;
        }
    }

    async fetch(): Promise<any[]> {
        return await this.adapter.fetch();
    }

    async transform(emails: any[]): Promise<IngestedEntity[]> {
        const transformed = this.adapter.transform(emails);

        // Convert to IngestedEntity format
        return transformed.map(email => ({
            id: email.sourceId,
            type: 'email',
            source: 'Outlook Email',
            title: email.metadata.subject,
            content: email.content,
            metadata: {
                ...email.metadata,
                sender: email.metadata.sender,
                senderName: email.metadata.senderName,
                receivedAt: email.metadata.receivedAt,
                importance: email.metadata.importance,
                isRead: email.metadata.isRead
            },
            timestamp: new Date(email.timestamp)
        }));
    }
}
