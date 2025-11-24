// DataIngestionEngine – Autonomous data collection and enrichment
import { projectMemory } from '../project/ProjectMemory.js';
import { eventBus } from '../../mcp/EventBus.js';
import { dataSourceConfig } from './DataSourceConfigManager.js';

export interface DataSourceAdapter {
    name: string;
    type: 'local_files' | 'outlook_mail' | 'browser_history' | 'google_drive' | 'other';

    /** Fetch raw data from the source */
    fetch(): Promise<any[]>;

    /** Transform raw data into normalized entities */
    transform(raw: any[]): Promise<IngestedEntity[]>;

    /** Health check */
    isAvailable(): Promise<boolean>;
}

export interface IngestedEntity {
    id: string;
    type: string;
    source: string;
    title?: string;
    content?: string;
    metadata: Record<string, any>;
}

export class DataIngestionEngine {
    private adapters: Map<string, DataSourceAdapter> = new Map();
    private isRunning: boolean = false;
    private ingestedCount: number = 0;

    /** Register a data source adapter */
    async registerAdapter(adapter: DataSourceAdapter, description: string, requiresApproval: boolean = false): Promise<void> {
        this.adapters.set(adapter.name, adapter);
        const canUse = await dataSourceConfig.registerSource(adapter.name, description, requiresApproval);

        console.log(`📥 Registered data adapter: ${adapter.name} (${adapter.type}) - ${canUse ? 'Ready' : 'Awaiting approval'}`);
    }

    /** Start ingestion from all registered adapters */
    async ingestAll(): Promise < void> {
    if(this.isRunning) {
    console.warn('⚠️ Ingestion already running');
    return;
}

// Load config
await dataSourceConfig.load();

this.isRunning = true;
this.ingestedCount = 0;

console.log(`🚀 Starting data ingestion from ${this.adapters.size} sources...`);

projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'in_progress',
    details: {
        type: 'data_ingestion_started',
        sources: Array.from(this.adapters.keys())
    }
});

const results: any[] = [];

for (const [name, adapter] of this.adapters) {
    try {
        // Check if source is enabled
        if (!dataSourceConfig.isEnabled(name)) {
            console.log(`⏭️ ${name} is disabled, skipping`);
            results.push({ source: name, status: 'skipped', reason: 'disabled' });
            continue;
        }

        console.log(`📂 Ingesting from: ${name}...`);

        // Check availability
        const available = await adapter.isAvailable();
        if (!available) {
            console.warn(`⚠️ ${name} not available, skipping`);
            results.push({ source: name, status: 'skipped', reason: 'not_available' });
            continue;
        }

        // Fetch raw data
        const rawData = await adapter.fetch();
        console.log(`  → Fetched ${rawData.length} items from ${name}`);

        // Transform to normalized entities
        const entities = await adapter.transform(rawData);
        console.log(`  → Transformed ${entities.length} entities`);

        // Store entities (for now, just log - later we'll save to memory/database)
        this.ingestedCount += entities.length;

        // Auto-add to Vidensarkiv (Knowledge Archive) for continuous learning
        try {
            const { getChromaVectorStore } = await import('../../platform/vector/ChromaVectorStoreAdapter.js');
            const vectorStore = getChromaVectorStore();
            
            // Batch add entities to vidensarkiv
            const vectorRecords = entities.map(entity => ({
                id: entity.id,
                content: entity.content || entity.title || JSON.stringify(entity.metadata),
                embedding: [], // Will be generated automatically
                metadata: {
                    ...entity.metadata,
                    datasetType: 'new',
                    source: name,
                    type: entity.type,
                    ingestedAt: new Date().toISOString()
                },
                namespace: `org:default:user:system` // TODO: Get from context
            }));

            if (vectorRecords.length > 0) {
                await vectorStore.batchUpsert({
                    records: vectorRecords,
                    namespace: `org:default:user:system`
                });
                console.log(`  → Added ${vectorRecords.length} entities to vidensarkiv`);
            }
        } catch (err) {
            console.warn(`⚠️ Failed to add to vidensarkiv:`, err);
            // Non-critical, continue ingestion
        }

        results.push({
            source: name,
            status: 'success',
            items: entities.length
        });

        // Mark as used
        await dataSourceConfig.markUsed(name);

        // Emit event for real-time updates
        eventBus.emit('data:ingested', {
            source: name,
            count: entities.length,
            entities: entities.slice(0, 5) // Sample of first 5
        });

    } catch (error: any) {
        console.error(`❌ Failed to ingest from ${name}:`, error.message);
        results.push({
            source: name,
            status: 'error',
            error: error.message
        });
    }
}

this.isRunning = false;

// Log completion
projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
        type: 'data_ingestion_completed',
        totalIngested: this.ingestedCount,
        results
    }
});

console.log(`✅ Data ingestion complete! Total entities: ${this.ingestedCount}`);
    }

    /** Ingest from a specific source */
    async ingestFrom(sourceName: string): Promise<number> {
        const adapter = this.adapters.get(sourceName);

        if (!adapter) {
            throw new Error(`Unknown data source: ${sourceName}`);
        }

        // Check if enabled
        if (!dataSourceConfig.isEnabled(sourceName)) {
            throw new Error(`Data source ${sourceName} is not enabled`);
        }

        const available = await adapter.isAvailable();
        if (!available) {
            throw new Error(`Source ${sourceName} is not available`);
        }

        const rawData = await adapter.fetch();
        const entities = await adapter.transform(rawData);

        await dataSourceConfig.markUsed(sourceName);

        eventBus.emit('data:ingested', {
            source: sourceName,
            count: entities.length,
            entities: entities.slice(0, 5)
        });

        return entities.length;
    }

/** Get ingestion status */
getStatus() {
    return {
        running: this.isRunning,
        totalIngested: this.ingestedCount,
        adapters: Array.from(this.adapters.keys()),
        enabled: dataSourceConfig.getEnabledSources(),
        pendingApprovals: dataSourceConfig.getPendingApprovals()
    };
}
}

// Singleton instance
export const dataIngestionEngine = new DataIngestionEngine();
