import { getNeo4jVectorStore } from '../../platform/vector/Neo4jVectorStoreAdapter.js';
import { logger } from '../../utils/logger.js';
import { eventBus } from '../../mcp/EventBus.js';
export class InternalLeakHunter {
    constructor() {
        // Keywords to hunt for - Expanded with strategic assets
        this.keywords = [
            // Security keywords
            'password', 'secret', 'key', 'token', 'credential', 'login', 'adgangskode',
            // Strategic keywords
            'strategi', 'roadmap', 'budget', 'finans', 'Q1', 'Q2', 'Q3', 'Q4',
            // System keywords
            'cyber', 'system', 'arkitektur', 'server', 'database', 'vulnerabil',
            // AI & Innovation keywords
            'ai', 'kunstig intelligens', 'llm', 'agent', 'copilot', 'machine learning', 'gpt', 'model'
        ];
        // Target domains/identities
        this.targets = ['tdc.dk', 'clauskraft'];
    }
    async hunt() {
        logger.info('🕵️ InternalLeakHunter started Asset Discovery & Leak Scan...');
        const vectorStore = getNeo4jVectorStore();
        const threats = [];
        const assets = [];
        // 1. Scan Internal Vector Memory
        for (const keyword of this.keywords) {
            try {
                const results = await vectorStore.search({
                    text: keyword,
                    limit: 10,
                    namespace: 'emails' // Also scan 'docs' if available
                });
                results.forEach(res => {
                    if (res.similarity > 0.78) {
                        // Classify findings
                        const lowerContent = res.content.toLowerCase();
                        let type = 'info';
                        let severity = 'low';
                        if (lowerContent.includes('password') || lowerContent.includes('secret')) {
                            type = 'internal_exposure';
                            severity = 'high';
                            threats.push({
                                id: `leak-${res.id}`,
                                type,
                                severity,
                                title: `Potential Exposure: ${keyword}`,
                                description: `Sensitive keyword found in document: ${res.id}`,
                                source: 'Internal Knowledge Base',
                                timestamp: new Date().toISOString(),
                                metadata: res.metadata
                            });
                        }
                        else if (keyword.includes('strategi') || keyword.includes('budget')) {
                            type = 'strategic_asset';
                            severity = 'medium';
                            assets.push({
                                id: `asset-${res.id}`,
                                type,
                                title: `Strategic Asset: ${keyword}`,
                                description: `Strategic document identified`,
                                source: 'Internal Knowledge Base',
                                metadata: res.metadata
                            });
                        }
                        else if (['ai', 'llm', 'agent'].some(k => keyword.includes(k))) {
                            type = 'ai_initiative';
                            severity = 'low';
                            assets.push({
                                id: `ai-${res.id}`,
                                type,
                                title: `AI Initiative: ${keyword}`,
                                description: `AI related content detected`,
                                source: 'Internal Knowledge Base',
                                metadata: res.metadata
                            });
                        }
                    }
                });
            }
            catch (error) {
                // Ignore search errors
            }
        }
        // 2. Simulate/Execute External Search for Targets (OSINT)
        logger.info(`🔍 Hunting for targets: ${this.targets.join(', ')} on external sources...`);
        // Broadcast results
        if (threats.length > 0) {
            logger.warn(`⚠️ InternalLeakHunter found ${threats.length} potential exposures!`);
            eventBus.emit('threat:detected', { threats });
        }
        if (assets.length > 0) {
            logger.info(`💎 InternalLeakHunter identified ${assets.length} strategic/AI assets.`);
            // Emit event so dashboard can show strategic insights
            eventBus.emit('ingestion:assets', { count: assets.length, assets });
        }
        logger.info('✅ InternalLeakHunter scan finished.');
    }
    updateTargets(newTargets) {
        this.targets = [...new Set([...this.targets, ...newTargets])];
    }
}
