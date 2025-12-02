import cron from 'node-cron';
import { logger } from '../../utils/logger.js';
import { getNeo4jVectorStore } from '../../platform/vector/Neo4jVectorStoreAdapter.js';
import { OutlookEmailReader } from './OutlookEmailReader.js';
import { PublicThreatScraper } from './PublicThreatScraper.js';
import { InternalLeakHunter } from './InternalLeakHunter.js';
import { NewsMonitorScraper } from './NewsMonitorScraper.js';
import { LocalFileScanner } from './LocalFileScanner.js';
import { eventBus } from '../../mcp/EventBus.js';
import path from 'path';

export class DataScheduler {
    private isRunning = false;
    private tasks: cron.ScheduledTask[] = [];

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        logger.info('⏰ DataScheduler started');

        // Schedule tasks
        this.scheduleEmailIngestion();
        this.scheduleThreatIntel();
        this.scheduleInternalHunt();
        this.scheduleNewsMonitor();
        this.scheduleSystemHealth();
        this.scheduleLocalFiles();
    }

    stop() {
        this.tasks.forEach(t => t.stop());
        this.isRunning = false;
        logger.info('🛑 DataScheduler stopped');
    }

    private scheduleLocalFiles() {
        const scanPath = path.resolve('data/ingestion');
        const scanner = new LocalFileScanner({
            rootPaths: [scanPath],
            extensions: ['.pdf', '.txt', '.md']
        });

        // Run every 30 minutes
        const task = cron.schedule('*/30 * * * *', async () => {
            logger.info(`📂 Scanning local files in ${scanPath}...`);
            try {
                if (await scanner.isAvailable()) {
                    const files = await scanner.fetch();
                    const entities = await scanner.transform(files);
                    
                    if (entities.length > 0) {
                        const vectorStore = getNeo4jVectorStore();
                        await vectorStore.batchUpsert({
                            records: entities.map(entity => ({
                                id: entity.id,
                                content: entity.content,
                                metadata: {
                                    ...entity.metadata,
                                    type: 'document',
                                    source: 'local_ingestion'
                                },
                                namespace: 'documents'
                            })),
                            namespace: 'documents'
                        });
                        
                        logger.info(`✅ Ingested ${entities.length} local documents`);
                        eventBus.emit('ingestion:documents', { count: entities.length });
                    }
                } else {
                    logger.warn(`Local ingestion path not accessible: ${scanPath}`);
                }
            } catch (error) {
                logger.error('Local file scan failed:', error);
            }
        });
        this.tasks.push(task);

        // Initial scan (delayed)
        setTimeout(async () => {
             logger.info('📂 Running initial local file scan...');
             try {
                if (await scanner.isAvailable()) {
                    const files = await scanner.fetch();
                    const entities = await scanner.transform(files);
                    if (entities.length > 0) {
                         const vectorStore = getNeo4jVectorStore();
                         await vectorStore.batchUpsert({
                            records: entities.map(entity => ({
                                id: entity.id,
                                content: entity.content,
                                metadata: {
                                    ...entity.metadata,
                                    type: 'document',
                                    source: 'local_ingestion'
                                },
                                namespace: 'documents'
                            })),
                            namespace: 'documents'
                        });
                        logger.info(`✅ Ingested ${entities.length} local documents (initial)`);
                    }
                }
             } catch (e) {
                 logger.error('Initial local scan failed:', e);
             }
        }, 15000);
    }

    private scheduleEmailIngestion() {
        const task = cron.schedule('*/5 * * * *', async () => {
            logger.info('📧 Running scheduled email ingestion...');
            try {
                const reader = new OutlookEmailReader();
                const emails = await reader.readData();
                
                if (emails.length > 0) {
                    const vectorStore = getNeo4jVectorStore();
                    for (const email of emails) {
                        await vectorStore.upsert({
                            id: `email-${email.id}`,
                            content: `Subject: ${email.subject}\nFrom: ${email.sender}\n\n${email.content}`,
                            metadata: {
                                type: 'email',
                                source: 'outlook',
                                sender: email.sender,
                                receivedAt: email.timestamp,
                                ...email.metadata
                            },
                            namespace: 'emails'
                        });
                    }
                    logger.info(`✅ Ingested ${emails.length} emails to vector store`);
                    eventBus.emit('ingestion:emails', { count: emails.length });
                } else {
                    logger.debug('No new emails found');
                }
            } catch (error) {
                if ((error as any).message?.includes('Mangler IMAP credentials')) {
                    logger.debug('Skipping email ingestion (no credentials)');
                } else {
                    logger.error('❌ Email ingestion failed:', error);
                }
            }
        });
        this.tasks.push(task);
    }

    private scheduleThreatIntel() {
        const scraper = new PublicThreatScraper();
        const task = cron.schedule('*/15 * * * *', async () => {
            logger.info('🛡️ Running public threat intelligence scan...');
            try {
                const threats = await scraper.fetchThreats();
                if (threats.length > 0) {
                    eventBus.emit('threat:detected', { threats });
                    logger.info(`📡 Broadcasted ${threats.length} threats to UI`);
                }
            } catch (error) {
                logger.error('Threat scan failed:', error);
            }
        });
        this.tasks.push(task);
    }

    private scheduleInternalHunt() {
        const hunter = new InternalLeakHunter();
        const task = cron.schedule('*/10 * * * *', async () => {
            try {
                await hunter.hunt();
            } catch (error) {
                logger.error('Internal hunt failed:', error);
            }
        });
        this.tasks.push(task);
    }

    private scheduleNewsMonitor() {
        // Run every hour
        const scraper = new NewsMonitorScraper();
        const task = cron.schedule('0 * * * *', async () => {
            logger.info('📰 Running news monitor scan...');
            try {
                const news = await scraper.fetchNews();
                if (news.length > 0) {
                    const vectorStore = getNeo4jVectorStore();
                    
                    // Batch upsert to Neo4j
                    await vectorStore.batchUpsert({
                        records: news.map(item => ({
                            id: item.id,
                            content: `${item.title}\n${item.snippet}\nSource: ${item.source}\nCategory: ${item.category}`,
                            metadata: {
                                ...item,
                                type: 'news',
                                ingestedAt: new Date().toISOString()
                            },
                            namespace: 'news'
                        })),
                        namespace: 'news'
                    });
                    
                    logger.info(`✅ Ingested ${news.length} news items`);
                    eventBus.emit('ingestion:news', { count: news.length, items: news });
                }
            } catch (error) {
                logger.error('News monitor failed:', error);
            }
        });
        this.tasks.push(task);
        
        // Run immediately on startup (async)
        setTimeout(() => {
            logger.info('📰 Running initial news scan...');
            scraper.fetchNews().then(news => {
                if (news.length > 0) {
                    eventBus.emit('ingestion:news', { count: news.length, items: news });
                }
            }).catch(err => logger.error('Initial news scan failed:', err));
        }, 10000); // Wait 10s for DB to init
    }

    private scheduleSystemHealth() {
        const task = cron.schedule('* * * * *', async () => {
            eventBus.emit('system:heartbeat', { 
                timestamp: new Date().toISOString(),
                status: 'healthy',
                memory: process.memoryUsage()
            });
        });
        this.tasks.push(task);
    }
}

export const dataScheduler = new DataScheduler();
