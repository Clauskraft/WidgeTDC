import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
export class OutlookJsonAdapter {
    constructor(filePath) {
        this.name = 'Outlook';
        this.type = 'outlook_mail';
        this.emails = [];
        this.lastLoaded = 0;
        this.filePath = filePath;
    }
    /**
     * Loads emails from the local JSON file
     */
    async loadEmails() {
        if (!existsSync(this.filePath)) {
            console.warn(`[OutlookJsonAdapter] File not found: ${this.filePath}`);
            this.emails = [];
            return;
        }
        try {
            const data = await readFile(this.filePath, 'utf-8');
            // Handle potential wrapping structures (e.g. { value: [...] } or just [...])
            const json = JSON.parse(data);
            this.emails = Array.isArray(json) ? json : (json.value || []);
            this.lastLoaded = Date.now();
            console.log(`[OutlookJsonAdapter] Loaded ${this.emails.length} emails from ${this.filePath}`);
        }
        catch (error) {
            console.error(`[OutlookJsonAdapter] Failed to parse JSON:`, error);
            this.emails = [];
        }
    }
    /**
     * Fetch emails, reloading if cache is stale (> 5 minutes)
     */
    async fetch() {
        const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        if (this.emails.length === 0 || Date.now() - this.lastLoaded > STALE_THRESHOLD) {
            await this.loadEmails();
        }
        return this.emails;
    }
    /**
     * Transform Outlook emails to Unified Memory entities
     */
    async transform(raw) {
        return raw.map((email) => ({
            id: email.id,
            type: 'email',
            source: 'Outlook',
            title: email.subject,
            content: `${email.subject}\n\nFrom: ${email.sender.name} <${email.sender.address}>\nDate: ${email.receivedDateTime}\n\n${email.bodyPreview}`,
            metadata: {
                subject: email.subject,
                sender: email.sender.address,
                senderName: email.sender.name,
                receivedAt: email.receivedDateTime,
                importance: email.importance,
                isRead: email.isRead,
                source: 'outlook_json',
            },
            timestamp: new Date(email.receivedDateTime)
        }));
    }
    /**
     * Check if the adapter is available (file exists)
     */
    async isAvailable() {
        return existsSync(this.filePath);
    }
    /**
     * Support direct queries
     */
    async query(operation, params) {
        await this.fetch(); // Ensure data is loaded
        switch (operation) {
            case 'search':
                const term = params.query?.toLowerCase();
                if (!term)
                    return this.emails.slice(0, params.limit || 10);
                return this.emails.filter(e => e.subject.toLowerCase().includes(term) ||
                    e.sender.name.toLowerCase().includes(term) ||
                    e.bodyPreview.toLowerCase().includes(term)).slice(0, params.limit || 10);
            case 'get_latest':
                return this.emails
                    .sort((a, b) => new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime())
                    .slice(0, params.limit || 10);
            case 'get_by_sender':
                const sender = params.sender?.toLowerCase();
                if (!sender)
                    return [];
                return this.emails.filter(e => e.sender.address.toLowerCase().includes(sender) ||
                    e.sender.name.toLowerCase().includes(sender)).slice(0, params.limit || 10);
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
    }
}
