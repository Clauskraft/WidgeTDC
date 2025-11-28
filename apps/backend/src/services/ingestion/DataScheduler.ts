import cron from 'node-cron';
import { logger } from '../../utils/logger.js';
import { getNeo4jVectorStore } from '../../platform/vector/Neo4jVectorStoreAdapter.js';
import { OutlookEmailReader } from './OutlookEmailReader.js';
import { PublicThreatScraper } from './PublicThreatScraper.js';
import { eventBus } from '../../mcp/EventBus.js';

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
        this.scheduleSystemHealth();
    }

    stop() {
        this.tasks.forEach(t => t.stop());
        this.isRunning = false;
        logger.info('🛑 DataScheduler stopped');
    }

    private scheduleEmailIngestion() {
        // Run every 5 minutes
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
                // Only log error if it's not just missing credentials (which is expected in dev)
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
        // Run every 15 minutes
        const scraper = new PublicThreatScraper();
        
        const task = cron.schedule('*/15 * * * *', async () => {
            logger.info('🛡️ Running public threat intelligence scan...');
            try {
                const threats = await scraper.fetchThreats();
                
                if (threats.length > 0) {
                    // Broadcast to UI (DarkWebMonitorWidget)
                    // In a real system, we would also store this in Neo4j
                    eventBus.emit('threat:detected', { threats });
                    logger.info(`📡 Broadcasted ${threats.length} threats to UI`);
                }
            } catch (error) {
                logger.error('Threat scan failed:', error);
            }
        });
        this.tasks.push(task);
    }

    private scheduleSystemHealth() {
        // Run every 1 minute
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

// Singleton
export const dataScheduler = new DataScheduler();
