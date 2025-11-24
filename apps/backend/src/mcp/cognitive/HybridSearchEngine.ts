// HybridSearchEngine – Phase 1 Week 3
// Combines keyword, semantic, and graph search with Reciprocal Rank Fusion

import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { SragRepository } from '../../services/srag/sragRepository.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { McpContext } from '@widget-tdc/mcp-types';

export interface SearchContext extends McpContext {
    limit?: number;
    filters?: Record<string, any>;
    timestamp?: Date;
}

export interface SearchResult {
    id: string;
    type: 'memory' | 'document' | 'graph' | 'pattern';
    score: number;
    content: any;
    source: string;
}

export class HybridSearchEngine {
    private memoryRepo: MemoryRepository;
    private sragRepo: SragRepository;

    constructor() {
        this.memoryRepo = new MemoryRepository();
        this.sragRepo = new SragRepository();
    }

    /**
     * Perform hybrid search across keyword, semantic, and graph sources
     */
    async search(query: string, ctx: SearchContext): Promise<SearchResult[]> {
        const limit = ctx.limit || 20;

        // Run all search types in parallel
        const [keywordResults, semanticResults, graphResults] = await Promise.all([
            this.keywordSearch(query, ctx, limit * 2),
            this.semanticSearch(query, ctx, limit * 2),
            this.graphTraversal(query, ctx, limit * 2)
        ]);

        // Reciprocal Rank Fusion
        const fusedResults = this.fuseResults([
            keywordResults,
            semanticResults,
            graphResults
        ]);

        // Return top results
        return fusedResults.slice(0, limit);
    }

    /**
     * Keyword-based search (exact matches, FTS)
     */
    private async keywordSearch(
        query: string,
        ctx: SearchContext,
        limit: number
    ): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        try {
            // Search memory entities
            const memoryResults = this.memoryRepo.searchEntities({
                orgId: ctx.orgId,
                userId: ctx.userId,
                keywords: query.split(/\s+/).filter(w => w.length > 2),
                limit
            });

            memoryResults.forEach((entity: any, index: number) => {
                results.push({
                    id: `memory-${entity.id}`,
                    type: 'memory',
                    score: 1.0 - (index / limit), // Rank-based score
                    content: entity,
                    source: 'memory_repository'
                });
            });

            // Search SRAG documents
            const sragResults = this.sragRepo.searchDocuments(ctx.orgId, query);
            sragResults.forEach((doc: any, index: number) => {
                results.push({
                    id: `srag-${doc.id}`,
                    type: 'document',
                    score: 1.0 - (index / limit),
                    content: doc,
                    source: 'srag_repository'
                });
            });
        } catch (error) {
            console.warn('Keyword search error:', error);
        }

        return results;
    }

    /**
     * Semantic search using embeddings
     */
    private async semanticSearch(
        query: string,
        ctx: SearchContext,
        limit: number
    ): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        try {
            // Use MemoryRepository's vector search
            const memoryResults = this.memoryRepo.searchEntities({
                orgId: ctx.orgId,
                userId: ctx.userId,
                keywords: [],
                limit,
                semanticQuery: query // Trigger semantic search
            });

            memoryResults.forEach((entity: any, index: number) => {
                results.push({
                    id: `semantic-${entity.id}`,
                    type: 'memory',
                    score: entity.similarity || (1.0 - index / limit),
                    content: entity,
                    source: 'semantic_search'
                });
            });
        } catch (error) {
            console.warn('Semantic search error:', error);
        }

        return results;
    }

    /**
     * Graph traversal search (knowledge graph patterns)
     */
    private async graphTraversal(
        query: string,
        ctx: SearchContext,
        limit: number
    ): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        try {
            // Use UnifiedMemorySystem to find holographic patterns
            const patterns = await unifiedMemorySystem.findHolographicPatterns(ctx);

            patterns.forEach((pattern: any, index: number) => {
                // Check if pattern matches query keywords
                const queryWords = query.toLowerCase().split(/\s+/);
                const patternText = JSON.stringify(pattern).toLowerCase();
                const matchCount = queryWords.filter(word => 
                    patternText.includes(word)
                ).length;

                if (matchCount > 0) {
                    results.push({
                        id: `pattern-${pattern.keyword || index}`,
                        type: 'pattern',
                        score: (matchCount / queryWords.length) * pattern.frequency,
                        content: pattern,
                        source: 'graph_traversal'
                    });
                }
            });
        } catch (error) {
            console.warn('Graph traversal error:', error);
        }

        return results;
    }

    /**
     * Reciprocal Rank Fusion (RRF) to combine results from multiple sources
     */
    private fuseResults(resultSets: SearchResult[][]): SearchResult[] {
        const rrfScores = new Map<string, { result: SearchResult; score: number }>();

        // Calculate RRF scores for each result set
        resultSets.forEach((resultSet, setIndex) => {
            resultSet.forEach((result, rank) => {
                const existing = rrfScores.get(result.id);
                const rrfScore = 1 / (rank + 60); // RRF formula: 1/(rank + k), k=60

                if (existing) {
                    // Combine scores: RRF + original score
                    existing.score += rrfScore;
                } else {
                    rrfScores.set(result.id, {
                        result,
                        score: rrfScore + (result.score * 0.1) // Weight original score
                    });
                }
            });
        });

        // Sort by combined score and return
        return Array.from(rrfScores.values())
            .sort((a, b) => b.score - a.score)
            .map(item => ({
                ...item.result,
                score: item.score
            }));
    }
}

export const hybridSearchEngine = new HybridSearchEngine();

