import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { logger } from '../../utils/logger.js';
import { DataSourceAdapter, IngestedEntity } from './DataIngestionEngine.js';

export interface EmailMessage {
    id: string;
    subject: string;
    sender: string;
    content: string;
    timestamp: string;
    metadata: Record<string, any>;
}

export class OutlookEmailReader implements DataSourceAdapter {
    name = 'Outlook Email Reader';
    type = 'outlook_mail' as const;
    private config: Imap.Config;

    constructor() {
        this.config = {
            user: process.env.IMAP_USER || '',
            password: process.env.IMAP_PASSWORD || '',
            host: process.env.IMAP_HOST || 'outlook.office365.com',
            port: parseInt(process.env.IMAP_PORT || '993', 10),
            tls: true,
            tlsOptions: { rejectUnauthorized: false }, // Tillad self-signed certs hvis nødvendigt
            authTimeout: 10000
        };
    }

    async isAvailable(): Promise<boolean> {
        return !!(this.config.user && this.config.password);
    }

    async fetch(): Promise<EmailMessage[]> {
        return this.readData();
    }

    async transform(data: EmailMessage[]): Promise<IngestedEntity[]> {
        return data.map(email => ({
            id: email.id,
            type: 'email',
            source: this.name,
            title: email.subject,
            content: email.content,
            metadata: {
                sender: email.sender,
                timestamp: email.timestamp,
                ...email.metadata
            },
            timestamp: new Date(email.timestamp)
        }));
    }

    async readData(): Promise<EmailMessage[]> {
        if (!this.config.user || !this.config.password) {
            logger.warn('⚠️ Mangler IMAP credentials. Sæt IMAP_USER og IMAP_PASSWORD i .env');
            return [];
        }

        return new Promise((resolve, reject) => {
            const imap = new Imap(this.config);
            const emails: EmailMessage[] = [];

            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    // Hent sidste 10 mails
                    const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 9)}:*`, {
                        bodies: '',
                        struct: true
                    });

                    fetch.on('message', (msg, seqno) => {
                        let buffer = '';
                        let uid = 0;

                        msg.on('body', (stream) => {
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                        });

                        msg.once('attributes', (attrs) => {
                            uid = attrs.uid;
                        });

                        msg.once('end', async () => {
                            try {
                                const parsed = await simpleParser(buffer);
                                emails.push({
                                    id: uid.toString(),
                                    subject: parsed.subject || '(Ingen emne)',
                                    sender: parsed.from?.text || 'Ukendt',
                                    content: parsed.text || parsed.html || '',
                                    timestamp: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                                    metadata: {
                                        messageId: parsed.messageId,
                                        references: parsed.references
                                    }
                                });
                            } catch (e) {
                                logger.error(`Fejl ved parsing af mail ${seqno}:`, e);
                            }
                        });
                    });

                    fetch.once('error', (err) => {
                        logger.error('Fetch error:', err);
                        imap.end();
                        reject(err);
                    });

                    fetch.once('end', () => {
                        imap.end();
                        // Returner nyeste først
                        resolve(emails.reverse());
                    });
                });
            });

            imap.once('error', (err: any) => {
                logger.error('IMAP connection error:', err);
                reject(err);
            });

            imap.once('end', () => {
                logger.info('IMAP connection closed');
            });

            imap.connect();
        });
    }
}
