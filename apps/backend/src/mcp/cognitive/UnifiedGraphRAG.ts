import { hybridSearchEngine } from './HybridSearchEngine.js';
import { getCognitiveMemory } from '../memory/CognitiveMemory.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { getLlmService } from '../../services/llm/llmService.js';
import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { getChromaVectorStore } from '../../platform/vector/ChromaVectorStoreAdapter.js';

interface GraphNode {
    id: string;
    type: string;
    content: string;
    score: number;
    depth: number;
    metadata: any;
    connections: GraphEdge[];
    embedding?: number[]; // For semantic similarity
}

interface GraphEdge {
    targetId: string;
    relation: string;
    weight: number;
}

interface GraphRAGResult {
    answer: string;
    reasoning_path: string[];
    nodes: GraphNode[];
    confidence: number;
    sources?: Array<{ id: string; content: string; score: number }>;
}

export class UnifiedGraphRAG {
    private maxHops: number = 2;
    private minScore: number = 0.3;
    private memoryRepo: MemoryRepository;

    constructor() {
        this.memoryRepo = new MemoryRepository();
    }

    /**
     * Perform multi-hop reasoning over the knowledge graph
     * Enhanced with LLM synthesis, semantic similarity, and CMA graph integration
     */
    public async query(query: string, context: { userId: string; orgId: string; maxHops?: number }): Promise<GraphRAGResult> {
        console.log(`🧠 [GraphRAG] Starting reasoning for: "${query}"`);

        const maxHops = context.maxHops || this.maxHops;

        // 1. Get seed nodes from Hybrid Search (High precision entry points)
        const seedResults = await hybridSearchEngine.search(query, {
            ...context,
            limit: 5,
            timestamp: new Date()
        });

        if (seedResults.length === 0) {
            return {
                answer: "No sufficient data found to reason about this query.",
                reasoning_path: [],
                nodes: [],
                confidence: 0
            };
        }

        // 2. Convert search results to graph nodes
        let frontier: GraphNode[] = seedResults.map(r => ({
            id: r.id,
            type: r.type,
            content: r.content,
            score: r.score,
            depth: 0,
            metadata: r.metadata,
            connections: []
        }));

        const visited = new Set<string>(frontier.map(n => n.id));
        const knowledgeGraph: GraphNode[] = [...frontier];
        const reasoningPath: string[] = [`Found ${frontier.length} starting points: ${frontier.map(n => n.id).join(', ')}`];

        // 3. Expand graph (Multi-hop traversal with semantic similarity)
        for (let hop = 1; hop <= maxHops; hop++) {
            console.log(`🔍 [GraphRAG] Hop ${hop}: Expanding ${frontier.length} nodes`);
            const newFrontier: GraphNode[] = [];

            for (const node of frontier) {
                // Enhanced expansion: Use CMA graph relations + semantic similarity
                const connections = await this.expandNode(node, query, context);
                
                for (const conn of connections) {
                    if (!visited.has(conn.id) && conn.score > this.minScore) {
                        visited.add(conn.id);
                        newFrontier.push(conn);
                        knowledgeGraph.push(conn);
                        
                        // Track edge in parent node
                        node.connections.push({
                            targetId: conn.id,
                            relation: conn.metadata.relation || 'related_to',
                            weight: conn.score
                        });
                    }
                }
            }

            if (newFrontier.length > 0) {
                reasoningPath.push(`Hop ${hop}: Discovered ${newFrontier.length} new related concepts.`);
                frontier = newFrontier;
            } else {
                break; // No more connections found
            }
        }

        // 4. Synthesize Answer using LLM (Inspired by CgentCore's L1 Director Agent)
        const topNodes = knowledgeGraph.sort((a, b) => b.score - a.score).slice(0, 10);
        const answer = await this.synthesizeAnswer(query, topNodes, context);
        
        return {
            answer,
            reasoning_path: reasoningPath,
            nodes: topNodes,
            confidence: topNodes.length > 0 ? topNodes[0].score : 0,
            sources: topNodes.slice(0, 5).map(n => ({
                id: n.id,
                content: n.content.substring(0, 200),
                score: n.score
            }))
        };
    }

    /**
     * Enhanced node expansion with CMA graph integration and semantic similarity
     * Inspired by CgentCore's hybrid search approach
     */
    private async expandNode(node: GraphNode, query: string, context: { userId: string; orgId: string }): Promise<GraphNode[]> {
        const memory = getCognitiveMemory();
        const expandedNodes: GraphNode[] = [];

        // Strategy 1: Get patterns involving this widget/source (existing)
        const patterns = await memory.getWidgetPatterns(node.id);
        
        for (const p of patterns) {
            expandedNodes.push({
                id: `pattern-${p.patternId}`,
                type: 'pattern',
                content: `Pattern: ${p.queryType} -> ${p.sourceUsed}`,
                score: p.confidence * node.score * 0.8, // Decay score over hops
                depth: node.depth + 1,
                metadata: { relation: 'has_pattern', confidence: p.confidence },
                connections: []
            });
        }

        // Strategy 2: Use CMA memory relations (Direct graph edges)
        // Inspired by CgentCore's memory_relations table
        const relatedMemories = this.memoryRepo.searchEntities({
            orgId: context.orgId,
            userId: context.userId,
            keywords: this.extractKeywords(node.content),
            limit: 5
        });

        for (const mem of relatedMemories) {
            // Check if memory is semantically related to query
            const semanticScore = await this.computeSemanticSimilarity(query, mem.content);
            
            if (semanticScore > this.minScore) {
                expandedNodes.push({
                    id: `memory-${mem.id}`,
                    type: mem.entity_type || 'memory',
                    content: mem.content,
                    score: (mem.importance || 0.5) * semanticScore * node.score * 0.7,
                    depth: node.depth + 1,
                    metadata: {
                        relation: 'memory_relation',
                        importance: mem.importance,
                        semanticScore
                    },
                    connections: []
                });
            }
        }

        // Strategy 3: Use UnifiedMemorySystem for episodic memory connections
        const workingMemory = await unifiedMemorySystem.getWorkingMemory({
            userId: context.userId,
            orgId: context.orgId,
            timestamp: new Date()
        });

        // Find related events/features based on semantic similarity
        const relatedEvents = (workingMemory.recentEvents || []).slice(0, 3);
        for (const event of relatedEvents) {
            const eventContent = JSON.stringify(event);
            const semanticScore = await this.computeSemanticSimilarity(query, eventContent);
            
            if (semanticScore > this.minScore) {
                expandedNodes.push({
                    id: `event-${event.id || Date.now()}`,
                    type: 'episodic',
                    content: eventContent.substring(0, 200),
                    score: semanticScore * node.score * 0.6,
                    depth: node.depth + 1,
                    metadata: {
                        relation: 'episodic_memory',
                        semanticScore
                    },
                    connections: []
                });
            }
        }

        return expandedNodes.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 per node
    }

    /**
     * LLM-based answer synthesis
     * Inspired by CgentCore's L1 Director Agent response generation
     */
    private async synthesizeAnswer(query: string, nodes: GraphNode[], context: { userId: string; orgId: string }): Promise<string> {
        try {
            const llmService = getLlmService();
            
            // Build context from graph nodes
            const graphContext = nodes.map((n, idx) => 
                `[${idx + 1}] ${n.type}: ${n.content.substring(0, 300)} (confidence: ${n.score.toFixed(2)})`
            ).join('\n\n');

            const reasoningPath = nodes.map(n => `${n.id} (depth: ${n.depth})`).join(' -> ');

            const systemContext = `You are an advanced reasoning assistant. Synthesize a comprehensive answer based on the knowledge graph context provided. 
Use the reasoning path to explain how you arrived at the answer. Be precise, cite sources, and indicate confidence levels.`;

            const userPrompt = `Query: ${query}

Knowledge Graph Context:
${graphContext}

Reasoning Path: ${reasoningPath}

Provide a comprehensive answer synthesizing the information from the knowledge graph. Include:
1. Direct answer to the query
2. Key insights from the graph
3. Confidence assessment
4. Sources referenced`;

            const answer = await llmService.generateContextualResponse(
                systemContext,
                userPrompt,
                `User: ${context.userId}, Org: ${context.orgId}`
            );

            return answer || "Reasoning complete. See nodes for details.";
        } catch (error) {
            console.error('[GraphRAG] LLM synthesis error:', error);
            // Fallback to simple synthesis
            return `Based on ${nodes.length} related concepts found: ${nodes.slice(0, 3).map(n => n.content.substring(0, 100)).join('; ')}...`;
        }
    }

    /**
     * Compute semantic similarity using ChromaDB vector search
     * Uses proper embeddings via HuggingFace for true semantic similarity
     */
    private async computeSemanticSimilarity(query: string, content: string): Promise<number> {
        try {
            // Use ChromaDB for proper vector similarity
            const vectorStore = getChromaVectorStore();
            
            // Search for similar content using query
            const results = await vectorStore.search({
                embedding: [], // Will be generated from query
                topK: 1,
                keywords: query,
                minScore: 0.0
            });

            // If we have results, use the similarity score
            if (results.length > 0) {
                // Check if content matches
                const matchingResult = results.find(r => 
                    r.record.content?.toLowerCase().includes(content.toLowerCase().substring(0, 100))
                );
                
                if (matchingResult) {
                    return matchingResult.score;
                }
            }

            // Fallback to keyword similarity if vector search doesn't find match
            const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
            const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 2));
            
            const intersection = new Set([...queryWords].filter(w => contentWords.has(w)));
            const union = new Set([...queryWords, ...contentWords]);
            
            const jaccard = intersection.size / union.size;
            const phraseMatch = content.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
            
            return Math.min(1.0, jaccard + phraseMatch);
        } catch (error) {
            console.warn('[GraphRAG] Vector similarity failed, using keyword fallback:', error);
            
            // Fallback to keyword similarity
            const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
            const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 2));
            
            const intersection = new Set([...queryWords].filter(w => contentWords.has(w)));
            const union = new Set([...queryWords, ...contentWords]);
            
            const jaccard = intersection.size / union.size;
            const phraseMatch = content.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
            
            return Math.min(1.0, jaccard + phraseMatch);
        }
    }

    /**
     * Extract keywords from content for memory search
     */
    private extractKeywords(content: string): string[] {
        // Simple keyword extraction (can be enhanced with NLP)
        const words = content.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(w))
            .slice(0, 5);
        
        return words;
    }
}

export const unifiedGraphRAG = new UnifiedGraphRAG();
