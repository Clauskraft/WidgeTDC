/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              THE OMNI-HARVESTER - Knowledge Acquisition Service            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Pattern: Dual-Encoding Pipeline                                          ║
 * ║                                                                           ║
 * ║  INPUT → SPLIT → DUAL-STORE                                               ║
 * ║    │       │         ├─→ Left Brain (Postgres/pgvector): Embeddings       ║
 * ║    │       │         └─→ Right Brain (Neo4j): Entity Graph                ║
 * ║    │       │                                                              ║
 * ║  URL/PDF/Text → Chunks (max 1000 tokens) → Semantic + Structural Storage  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * Architect: Gemini (The Architect)
 * Implementer: Claude (The Captain)
 * Version: 1.0 - Skeleton
 */

import { neo4jAdapter } from '../adapters/Neo4jAdapter.js';
import { hyperLog } from './HyperLog.js';
import { getVectorStore } from '../platform/vector/index.js';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

export interface AcquisitionSource {
    type: 'url' | 'pdf' | 'text' | 'file';
    content: string;  // URL, base64, or raw text
    metadata?: {
        title?: string;
        author?: string;
        source?: string;
        category?: string;
    };
}

export interface ContentChunk {
    id: string;
    index: number;
    content: string;
    tokenCount: number;
    hash: string;
    sourceId: string;
}

export interface ExtractedEntity {
    name: string;
    type: 'Concept' | 'Person' | 'Organization' | 'Technology' | 'Process' | 'Document';
    confidence: number;
    context: string;
}

export interface AcquisitionResult {
    sourceId: string;
    success: boolean;
    chunks: number;
    entitiesExtracted: number;
    vectorsStored: number;
    graphNodesCreated: number;
    errors: string[];
    duration: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Knowledge Acquisition Service - The Omni-Harvester
// ═══════════════════════════════════════════════════════════════════════════

class KnowledgeAcquisitionService {
    private static instance: KnowledgeAcquisitionService;
    private readonly MAX_CHUNK_TOKENS = 1000;
    private readonly OVERLAP_TOKENS = 100;

    private constructor() {}

    static getInstance(): KnowledgeAcquisitionService {
        if (!KnowledgeAcquisitionService.instance) {
            KnowledgeAcquisitionService.instance = new KnowledgeAcquisitionService();
        }
        return KnowledgeAcquisitionService.instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Main Pipeline
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * The main acquisition pipeline - processes any source through dual-encoding
     */
    async acquire(source: AcquisitionSource): Promise<AcquisitionResult> {
        const startTime = Date.now();
        const sourceId = this.generateSourceId(source);
        const result: AcquisitionResult = {
            sourceId,
            success: false,
            chunks: 0,
            entitiesExtracted: 0,
            vectorsStored: 0,
            graphNodesCreated: 0,
            errors: [],
            duration: 0
        };

        try {
            hyperLog.logEvent('ACQUISITION_START', { sourceId, type: source.type });

            // Phase 1: Extract raw content
            const rawContent = await this.extractContent(source);
            
            // Phase 2: Split into chunks
            const chunks = this.splitIntoChunks(rawContent, sourceId);
            result.chunks = chunks.length;

            // Phase 3: Dual-Store Pipeline
            for (const chunk of chunks) {
                // Left Brain: Vector Store (Postgres/pgvector)
                const vectorStored = await this.storeVector(chunk);
                if (vectorStored) result.vectorsStored++;

                // Right Brain: Entity Graph (Neo4j)
                const entities = await this.extractEntities(chunk);
                const nodesCreated = await this.storeInGraph(chunk, entities, source.metadata);
                result.entitiesExtracted += entities.length;
                result.graphNodesCreated += nodesCreated;
            }

            result.success = true;
            hyperLog.logEvent('ACQUISITION_COMPLETE', { 
                sourceId, 
                chunks: result.chunks,
                entities: result.entitiesExtracted 
            });

        } catch (error: any) {
            result.errors.push(error.message);
            hyperLog.logEvent('ACQUISITION_ERROR', { sourceId, error: error.message });
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 1: Content Extraction
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Extract raw text content from various source types
     */
    private async extractContent(source: AcquisitionSource): Promise<string> {
        switch (source.type) {
            case 'url':
                return await this.fetchUrlContent(source.content);
            case 'pdf':
                return await this.extractPdfContent(source.content);
            case 'text':
                return source.content;
            case 'file':
                return await this.readFileContent(source.content);
            default:
                throw new Error(`Unknown source type: ${source.type}`);
        }
    }

    private async fetchUrlContent(url: string): Promise<string> {
        // TODO: Implement web scraping with puppeteer or similar
        const response = await fetch(url);
        const html = await response.text();
        // Basic HTML to text (should use proper parser in production)
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private async extractPdfContent(base64OrPath: string): Promise<string> {
        // TODO: Implement PDF extraction with pdf-parse or pdfjs-dist
        // For now, return placeholder
        hyperLog.logEvent('PDF_EXTRACTION_PENDING', { message: 'PDF extraction not yet implemented' });
        return `[PDF Content - extraction pending]`;
    }

    private async readFileContent(filePath: string): Promise<string> {
        const fs = await import('fs/promises');
        return await fs.readFile(filePath, 'utf-8');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 2: Chunking
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Split content into overlapping chunks for better context preservation
     */
    private splitIntoChunks(content: string, sourceId: string): ContentChunk[] {
        const chunks: ContentChunk[] = [];
        const words = content.split(/\s+/);
        
        // Approximate tokens (words * 1.3 is a rough estimate)
        const tokensPerWord = 1.3;
        const wordsPerChunk = Math.floor(this.MAX_CHUNK_TOKENS / tokensPerWord);
        const overlapWords = Math.floor(this.OVERLAP_TOKENS / tokensPerWord);

        let index = 0;
        let position = 0;

        while (position < words.length) {
            const chunkWords = words.slice(position, position + wordsPerChunk);
            const chunkContent = chunkWords.join(' ');
            
            const chunk: ContentChunk = {
                id: `${sourceId}_chunk_${index}`,
                index,
                content: chunkContent,
                tokenCount: Math.round(chunkWords.length * tokensPerWord),
                hash: this.hashContent(chunkContent),
                sourceId
            };

            chunks.push(chunk);
            index++;
            position += wordsPerChunk - overlapWords;
        }

        return chunks;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 3A: Left Brain (Vector Store)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Store chunk embedding in PostgreSQL with pgvector
     * Uses HuggingFace sentence-transformers for embedding generation
     */
    private async storeVector(chunk: ContentChunk): Promise<boolean> {
        try {
            const vectorStore = await getVectorStore();
            await vectorStore.initialize();

            // Store with auto-generated embedding
            await vectorStore.upsert({
                id: chunk.id,
                content: chunk.content,
                metadata: {
                    sourceId: chunk.sourceId,
                    index: chunk.index,
                    tokenCount: chunk.tokenCount,
                    hash: chunk.hash,
                    type: 'knowledge_chunk'
                },
                namespace: 'knowledge'
            });

            hyperLog.logEvent('VECTOR_STORED', { 
                chunkId: chunk.id,
                tokenCount: chunk.tokenCount
            });
            
            return true;
        } catch (error: any) {
            hyperLog.logEvent('VECTOR_STORE_ERROR', { chunkId: chunk.id, error: error.message });
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Search & Query Methods
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Semantic search across all acquired knowledge
     */
    async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
        try {
            const vectorStore = await getVectorStore();
            await vectorStore.initialize();

            const results = await vectorStore.search({
                text: query,
                limit,
                namespace: 'knowledge'
            });

            hyperLog.logEvent('SEMANTIC_SEARCH', { query, resultsCount: results.length });
            return results;
        } catch (error: any) {
            hyperLog.logEvent('SEMANTIC_SEARCH_ERROR', { query, error: error.message });
            return [];
        }
    }

    /**
     * Get vector store statistics
     */
    async getVectorStats(): Promise<any> {
        try {
            const vectorStore = await getVectorStore();
            await vectorStore.initialize();
            return await vectorStore.getStatistics();
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 3B: Right Brain (Entity Graph)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Extract entities from chunk using simple pattern matching
     * TODO: Replace with NER model for production
     */
    private async extractEntities(chunk: ContentChunk): Promise<ExtractedEntity[]> {
        const entities: ExtractedEntity[] = [];
        const content = chunk.content;

        // Simple pattern-based entity extraction
        // TODO: Replace with proper NER (spaCy, HuggingFace NER model)

        // Detect potential concepts (capitalized multi-word phrases)
        const conceptPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
        let match;
        while ((match = conceptPattern.exec(content)) !== null) {
            entities.push({
                name: match[1],
                type: 'Concept',
                confidence: 0.6,
                context: content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)
            });
        }

        // Detect technology terms (common patterns)
        const techTerms = ['API', 'REST', 'GraphQL', 'Docker', 'Kubernetes', 'React', 'Neo4j', 
                          'PostgreSQL', 'TypeScript', 'JavaScript', 'Python', 'Node.js'];
        for (const term of techTerms) {
            if (content.includes(term)) {
                entities.push({
                    name: term,
                    type: 'Technology',
                    confidence: 0.9,
                    context: `Technology mention in chunk ${chunk.index}`
                });
            }
        }

        return entities;
    }

    /**
     * Store chunk and entities in Neo4j knowledge graph
     */
    private async storeInGraph(
        chunk: ContentChunk, 
        entities: ExtractedEntity[],
        metadata?: AcquisitionSource['metadata']
    ): Promise<number> {
        let nodesCreated = 0;

        try {
            // Create Chunk node
            await neo4jAdapter.executeQuery(`
                MERGE (c:Chunk {id: $id})
                SET c.content = $content,
                    c.tokenCount = $tokenCount,
                    c.hash = $hash,
                    c.sourceId = $sourceId,
                    c.index = $index,
                    c.createdAt = datetime()
            `, {
                id: chunk.id,
                content: chunk.content.substring(0, 500), // Store preview only
                tokenCount: chunk.tokenCount,
                hash: chunk.hash,
                sourceId: chunk.sourceId,
                index: chunk.index
            });
            nodesCreated++;

            // Create Source Document node if metadata provided
            if (metadata?.title) {
                await neo4jAdapter.executeQuery(`
                    MERGE (d:Document {id: $sourceId})
                    SET d.title = $title,
                        d.author = $author,
                        d.source = $source,
                        d.category = $category,
                        d.createdAt = datetime()
                    MERGE (c:Chunk {id: $chunkId})
                    MERGE (d)-[:CONTAINS]->(c)
                `, {
                    sourceId: chunk.sourceId,
                    title: metadata.title,
                    author: metadata.author || 'Unknown',
                    source: metadata.source || 'Unknown',
                    category: metadata.category || 'General',
                    chunkId: chunk.id
                });
                nodesCreated++;
            }

            // Create Entity nodes and relationships
            for (const entity of entities) {
                await neo4jAdapter.executeQuery(`
                    MERGE (e:${entity.type} {name: $name})
                    SET e.confidence = CASE 
                        WHEN e.confidence IS NULL THEN $confidence 
                        WHEN $confidence > e.confidence THEN $confidence
                        ELSE e.confidence END
                    MERGE (c:Chunk {id: $chunkId})
                    MERGE (c)-[:MENTIONS {confidence: $confidence}]->(e)
                `, {
                    name: entity.name,
                    confidence: entity.confidence,
                    chunkId: chunk.id
                });
                nodesCreated++;
            }

            return nodesCreated;
        } catch (error: any) {
            hyperLog.logEvent('GRAPH_STORE_ERROR', { chunkId: chunk.id, error: error.message });
            return nodesCreated;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Utility Functions
    // ═══════════════════════════════════════════════════════════════════════

    private generateSourceId(source: AcquisitionSource): string {
        const content = source.type + source.content.substring(0, 100);
        return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
    }

    private hashContent(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Batch Processing
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Process multiple sources with progress tracking
     */
    async batchAcquire(sources: AcquisitionSource[]): Promise<AcquisitionResult[]> {
        const results: AcquisitionResult[] = [];
        
        hyperLog.logEvent('BATCH_ACQUISITION_START', { count: sources.length });

        for (let i = 0; i < sources.length; i++) {
            const result = await this.acquire(sources[i]);
            results.push(result);
            
            hyperLog.logEvent('BATCH_PROGRESS', { 
                current: i + 1, 
                total: sources.length,
                success: result.success 
            });
        }

        hyperLog.logEvent('BATCH_ACQUISITION_COMPLETE', {
            total: sources.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });

        return results;
    }

    /**
     * Acquire from Knowledge Targets (KNOWLEDGE_TARGETS.json)
     * The primary entry point for Operation Cognitive Awakening
     */
    async acquireFromTargets(targetIds?: string[]): Promise<AcquisitionResult[]> {
        const results: AcquisitionResult[] = [];
        
        try {
            // Read KNOWLEDGE_TARGETS.json
            const targetsPath = '../../docs/KNOWLEDGE_TARGETS.json';
            const fs = await import('fs/promises');
            const path = await import('path');
            const url = await import('url');
            
            // Resolve path relative to project root
            const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
            const projectRoot = path.resolve(__dirname, '../../../../');
            const fullPath = path.join(projectRoot, 'docs', 'KNOWLEDGE_TARGETS.json');
            
            const targetsContent = await fs.readFile(fullPath, 'utf-8');
            const targetsData = JSON.parse(targetsContent);
            
            hyperLog.logEvent('TARGETS_LOADED', { 
                mission: targetsData.meta?.mission,
                cortexAreas: targetsData.meta?.target_cortex?.length || 0,
                totalTargets: targetsData.targets?.reduce((sum: number, t: any) => sum + t.sources.length, 0) || 0
            });

            // Flatten all sources from all cortex areas
            const allSources: Array<{id: string; name: string; url: string; cortex: string}> = [];
            for (const cortex of targetsData.targets || []) {
                for (const source of cortex.sources || []) {
                    allSources.push({
                        ...source,
                        cortex: cortex.cortex
                    });
                }
            }

            // Filter by target IDs if specified
            const filteredSources = targetIds 
                ? allSources.filter(s => targetIds.includes(s.id))
                : allSources;

            hyperLog.logEvent('TARGET_ACQUISITION_START', { 
                totalSources: allSources.length,
                filteredCount: filteredSources.length,
                targetIds: targetIds || 'ALL'
            });

            // Process each source
            for (const source of filteredSources) {
                try {
                    const result = await this.acquire({
                        type: 'url',
                        content: source.url,
                        metadata: {
                            title: source.name,
                            source: source.url,
                            category: source.cortex,
                            author: 'WidgeTDC Omni-Harvester'
                        }
                    });

                    results.push(result);

                    hyperLog.logEvent('TARGET_ACQUIRED', {
                        id: source.id,
                        name: source.name,
                        cortex: source.cortex,
                        success: result.success,
                        chunks: result.chunks
                    });

                } catch (error: any) {
                    hyperLog.logEvent('TARGET_ACQUISITION_ERROR', {
                        id: source.id,
                        name: source.name,
                        error: error.message
                    });
                    
                    results.push({
                        sourceId: source.id,
                        success: false,
                        chunks: 0,
                        entitiesExtracted: 0,
                        vectorsStored: 0,
                        graphNodesCreated: 0,
                        errors: [error.message],
                        duration: 0
                    });
                }
            }

            hyperLog.logEvent('TARGET_ACQUISITION_COMPLETE', {
                total: filteredSources.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            });

        } catch (error: any) {
            hyperLog.logEvent('TARGETS_LOAD_ERROR', { error: error.message });
        }

        return results;
    }

    /**
     * Acquire a single target by ID (convenience method)
     */
    async acquireSingleTarget(targetId: string): Promise<AcquisitionResult | null> {
        const results = await this.acquireFromTargets([targetId]);
        return results.length > 0 ? results[0] : null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const knowledgeAcquisition = KnowledgeAcquisitionService.getInstance();
export { KnowledgeAcquisitionService };
