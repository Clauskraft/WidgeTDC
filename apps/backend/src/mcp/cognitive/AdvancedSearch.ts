import { graphMemoryService } from '../../memory/GraphMemoryService';
import { neo4jService } from '../../database/Neo4jService';

/**
 * Query Expansion - Expands user query with synonyms and related terms
 */
export class QueryExpander {
    private synonymMap: Map<string, string[]> = new Map([
        ['find', ['search', 'locate', 'discover', 'retrieve']],
        ['show', ['display', 'present', 'reveal', 'demonstrate']],
        ['create', ['make', 'build', 'generate', 'construct']],
        ['delete', ['remove', 'erase', 'eliminate', 'destroy']],
        ['update', ['modify', 'change', 'alter', 'revise']],
    ]);

    /**
     * Expand query with synonyms and related terms
     */
    async expandQuery(query: string): Promise<string[]> {
        const words = query.toLowerCase().split(/\s+/);
        const expandedTerms = new Set<string>([query]);

        // Add synonyms
        words.forEach(word => {
            const synonyms = this.synonymMap.get(word);
            if (synonyms) {
                synonyms.forEach(syn => {
                    const expandedQuery = query.replace(new RegExp(word, 'gi'), syn);
                    expandedTerms.add(expandedQuery);
                });
            }
        });

        // Add semantic variations using Neo4j graph
        try {
            await neo4jService.connect();

            // Find related concepts in the graph
            const relatedConcepts = await neo4jService.runQuery(
                `MATCH (n:Entity)
         WHERE toLower(n.name) CONTAINS $query OR toLower(n.content) CONTAINS $query
         MATCH (n)-[:RELATED_TO|SIMILAR_TO]-(related)
         RETURN DISTINCT related.name as concept
         LIMIT 5`,
                { query: query.toLowerCase() }
            );

            relatedConcepts.forEach(record => {
                if (record.concept) {
                    expandedTerms.add(`${query} ${record.concept}`);
                }
            });

            await neo4jService.disconnect();
        } catch (error) {
            console.warn('Query expansion from graph failed:', error);
        }

        return Array.from(expandedTerms);
    }

    /**
     * Extract key phrases from query
     */
    extractKeyPhrases(query: string): string[] {
        // Simple n-gram extraction (2-3 words)
        const words = query.toLowerCase().split(/\s+/);
        const phrases: string[] = [];

        // Bigrams
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(`${words[i]} ${words[i + 1]}`);
        }

        // Trigrams
        for (let i = 0; i < words.length - 2; i++) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }

        return phrases;
    }
}

/**
 * Result Re-ranker - Re-ranks search results using multiple signals
 */
export class ResultReRanker {
    /**
     * Re-rank results using multiple scoring signals
     */
    async rerank(
        query: string,
        results: Array<{ id: string; content: string; score: number; metadata?: any }>,
        options: {
            useRecency?: boolean;
            usePopularity?: boolean;
            useSemanticSimilarity?: boolean;
        } = {}
    ): Promise<Array<{ id: string; content: string; score: number; metadata?: any }>> {
        const scoredResults = await Promise.all(
            results.map(async result => {
                let finalScore = result.score;

                // Recency boost
                if (options.useRecency && result.metadata?.createdAt) {
                    const age = Date.now() - new Date(result.metadata.createdAt).getTime();
                    const daysSinceCreation = age / (1000 * 60 * 60 * 24);
                    const recencyBoost = Math.exp(-daysSinceCreation / 30); // Decay over 30 days
                    finalScore *= (1 + recencyBoost * 0.2);
                }

                // Popularity boost (based on connections in graph)
                if (options.usePopularity) {
                    try {
                        await neo4jService.connect();
                        const connections = await neo4jService.getNodeRelationships(result.id);
                        const popularityBoost = Math.min(connections.length / 10, 1); // Cap at 10 connections
                        finalScore *= (1 + popularityBoost * 0.3);
                        await neo4jService.disconnect();
                    } catch (error) {
                        // Ignore errors
                    }
                }

                // Exact match boost
                if (result.content.toLowerCase().includes(query.toLowerCase())) {
                    finalScore *= 1.5;
                }

                return { ...result, score: finalScore };
            })
        );

        // Sort by final score
        return scoredResults.sort((a, b) => b.score - a.score);
    }

    /**
     * Diversify results to avoid redundancy
     */
    diversify(
        results: Array<{ id: string; content: string; score: number }>,
        maxSimilarity: number = 0.8
    ): Array<{ id: string; content: string; score: number }> {
        const diversified: typeof results = [];

        for (const result of results) {
            // Check if too similar to already selected results
            const tooSimilar = diversified.some(selected => {
                const similarity = this.computeTextSimilarity(result.content, selected.content);
                return similarity > maxSimilarity;
            });

            if (!tooSimilar) {
                diversified.push(result);
            }

            // Stop if we have enough diverse results
            if (diversified.length >= 10) break;
        }

        return diversified;
    }

    private computeTextSimilarity(text1: string, text2: string): number {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size; // Jaccard similarity
    }
}

/**
 * Hybrid Search - Combines keyword and semantic search
 */
export class HybridSearch {
    private queryExpander = new QueryExpander();
    private reRanker = new ResultReRanker();

    /**
     * Perform hybrid search combining multiple strategies
     */
    async search(
        query: string,
        options: {
            limit?: number;
            useQueryExpansion?: boolean;
            useReranking?: boolean;
            useDiversification?: boolean;
        } = {}
    ): Promise<Array<{ id: string; content: string; score: number; metadata?: any }>> {
        const limit = options.limit || 10;
        let queries = [query];

        // Query expansion
        if (options.useQueryExpansion) {
            queries = await this.queryExpander.expandQuery(query);
        }

        // Execute searches for all query variations
        const allResults = new Map<string, any>();

        for (const q of queries) {
            const results = await graphMemoryService.searchEntities(q, limit * 2);

            results.forEach(result => {
                const existing = allResults.get(result.id);
                if (!existing || result.score > existing.score) {
                    allResults.set(result.id, result);
                }
            });
        }

        let results = Array.from(allResults.values());

        // Re-ranking
        if (options.useReranking) {
            results = await this.reRanker.rerank(query, results, {
                useRecency: true,
                usePopularity: true,
            });
        }

        // Diversification
        if (options.useDiversification) {
            results = this.reRanker.diversify(results);
        }

        return results.slice(0, limit);
    }
}

export const queryExpander = new QueryExpander();
export const resultReRanker = new ResultReRanker();
export const hybridSearch = new HybridSearch();
