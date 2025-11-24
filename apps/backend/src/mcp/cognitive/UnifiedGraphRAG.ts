import { hybridSearchEngine } from './HybridSearchEngine.js';
import { getCognitiveMemory } from '../memory/CognitiveMemory.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';

interface GraphNode {
    id: string;
    type: string;
    content: string;
    score: number;
    depth: number;
    metadata: any;
    connections: GraphEdge[];
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
}

export class UnifiedGraphRAG {
    private maxHops: number = 2;
    private minScore: number = 0.3;

    /**
     * Perform multi-hop reasoning over the knowledge graph
     */
    public async query(query: string, context: { userId: string; orgId: string }): Promise<GraphRAGResult> {
        console.log(`🧠 [GraphRAG] Starting reasoning for: "${query}"`);

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

        // 3. Expand graph (Multi-hop traversal)
        for (let hop = 1; hop <= this.maxHops; hop++) {
            console.log(`🔍 [GraphRAG] Hop ${hop}: Expanding ${frontier.length} nodes`);
            const newFrontier: GraphNode[] = [];

            for (const node of frontier) {
                // Get related entities from Cognitive Memory (Pattern/Association lookup)
                // Note: This uses the pattern memory to find what usually co-occurs or is explicitly linked
                const connections = await this.expandNode(node);
                
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

        // 4. Synthesize Insight (Simplified for now - essentially gathering context)
        // In a full implementation, this would pass the sub-graph to an LLM for final answer generation
        const topNodes = knowledgeGraph.sort((a, b) => b.score - a.score).slice(0, 10);
        
        return {
            answer: "Reasoning complete. See nodes for details.", // Placeholder for LLM synthesis
            reasoning_path: reasoningPath,
            nodes: topNodes,
            confidence: topNodes.length > 0 ? topNodes[0].score : 0
        };
    }

    /**
     * Find connected nodes for a given node
     */
    private async expandNode(node: GraphNode): Promise<GraphNode[]> {
        const memory = getCognitiveMemory();
        
        // Strategy 1: Get patterns involving this widget/source
        // This simulates "edges" in our implicit graph
        const patterns = await memory.getWidgetPatterns(node.id); // Using ID as proxy for widget/source ID if applicable
        
        // Strategy 2: Use UnifiedMemory to find related episodic memories
        // e.g. "Find other events that happened in same context"
        // This is a simplified mock of graph expansion until we have explicit edge tables
        
        return patterns.map(p => ({
            id: `pattern-${p.patternId}`,
            type: 'pattern',
            content: `Pattern: ${p.queryType} -> ${p.sourceUsed}`,
            score: p.confidence * node.score, // Decay score over hops
            depth: node.depth + 1,
            metadata: { relation: 'has_pattern', confidence: p.confidence },
            connections: []
        }));
    }
}

export const unifiedGraphRAG = new UnifiedGraphRAG();

