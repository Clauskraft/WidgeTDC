import { eventBus } from '../../mcp/EventBus.js';
import { getVectorStore, IVectorStore } from '../../platform/vector/index.js';
import { IngestedEntity } from './DataIngestionEngine.js';
import { unifiedMemorySystem } from '../../mcp/cognitive/UnifiedMemorySystem.js';

/**
 * IngestionPipeline
 *
 * The bridge between Data Ingestion (Senses) and Vector Store (Memory).
 * Listens for new data, vectorizes it, and stores it in the Knowledge Archive.
 */
export class IngestionPipeline {
    private vectorStore: IVectorStore | null = null;
    private isProcessing = false;

    constructor() {
        this.setupListeners();
        console.log('🧠 [IngestionPipeline] Initialized and listening for data...');
    }

    private setupListeners() {
        // Listen for data ingestion events
        eventBus.onEvent('data:ingested', async (event) => {
            console.log(`📥 [IngestionPipeline] Received ${event.count} items from ${event.source}`);

            if (event.entities && Array.isArray(event.entities)) {
                await this.processEntities(event.entities);
            }
        });
    }

    /**
     * Process a batch of ingested entities
     */
    private async processEntities(entities: IngestedEntity[]) {
        this.isProcessing = true;
        let processedCount = 0;

        try {
            // Initialize vector store if needed
            if (!this.vectorStore) {
                this.vectorStore = await getVectorStore();
            }

            for (const entity of entities) {
                try {
                    // 1. Prepare content for embedding
                    // Combine title and content for better context
                    const textContent = `Title: ${entity.title || 'No Title'}\nType: ${entity.type}\nSource: ${entity.source}\n\n${entity.content || ''}`;

                    // 2. Create Vector Record
                    // We let the vector store handle the embedding generation via HuggingFace
                    await this.vectorStore.upsert({
                        id: `ingest-${entity.source}-${entity.id}`,
                        content: textContent,
                        metadata: {
                            source: entity.source,
                            type: entity.type,
                            originalId: entity.id,
                            timestamp: entity.timestamp.toISOString(),
                            ...entity.metadata
                        },
                        namespace: 'vidensarkiv' // The main knowledge archive
                    });

                    processedCount++;

                    // 3. Notify Unified Memory (Short-term / Working Memory)
                    // This makes the agent "aware" that it just learned something new
                    if (processedCount % 5 === 0) { // Don't spam for every single item
                        await unifiedMemorySystem.updateWorkingMemory(
                            { userId: 'system', orgId: 'default' },
                            {
                                type: 'memory_update',
                                action: 'learned_new_data',
                                source: entity.source,
                                count: processedCount
                            }
                        );
                    }

                } catch (err) {
                    console.error(`❌ [IngestionPipeline] Failed to process entity ${entity.id}:`, err);
                }
            }

            console.log(`✅ [IngestionPipeline] Successfully memorized ${processedCount} new items`);

        } catch (error) {
            console.error('❌ [IngestionPipeline] Critical error in processing loop:', error);
        } finally {
            this.isProcessing = false;
        }
    }
}

// Singleton instance
export const ingestionPipeline = new IngestionPipeline();
