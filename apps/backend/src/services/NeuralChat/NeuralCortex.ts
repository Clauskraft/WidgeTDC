/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              NEURAL CORTEX                                            ║
 * ║═══════════════════════════════════════════════════════════════════════════════════════║
 * ║                                                                                       ║
 * ║   "If everything is connected, you can talk to anything and find all patterns"       ║
 * ║                                                          - CLAK, 2025                ║
 * ║                                                                                       ║
 * ║   ┌─────────────────────────────────────────────────────────────────────────────┐    ║
 * ║   │                   HYBRID NEURAL CORTEX ARCHITECTURE                         │    ║
 * ║   │                                                                             │    ║
 * ║   │    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐        │    ║
 * ║   │    │  AGENTS  │────▶│   CHAT   │────▶│  HYBRID  │────▶│ PATTERNS │        │    ║
 * ║   │    └──────────┘     └──────────┘     │  SEARCH  │     └──────────┘        │    ║
 * ║   │         │                │           └─────┬────┘          │               │    ║
 * ║   │         ▼                ▼                 │               ▼               │    ║
 * ║   │    ┌─────────┐      ┌─────────┐      ┌─────▼─────┐    ┌─────────┐        │    ║
 * ║   │    │  NEO4J  │◀────▶│ PGVECTR │      │ SEMANTIC  │    │ INSIGHT │        │    ║
 * ║   │    │ (Graph) │ link │ (Dense) │      │ MATCHING  │    │ ENGINE  │        │    ║
 * ║   │    └─────────┘      └─────────┘      └───────────┘    └─────────┘        │    ║
 * ║   │                                                                             │    ║
 * ║   │    CAPABILITIES:                                                            │    ║
 * ║   │    • Hybrid Search (Vector Similarity + Graph Traversal)                    │    ║
 * ║   │    • Chat with agents & documents                                           │    ║
 * ║   │    • Auto-link messages to relevant nodes                                   │    ║
 * ║   │    • Discover patterns across conversations                                 │    ║
 * ║   │    • Surface insights from connected data                                   │    ║
 * ║   │                                                                             │    ║
 * ║   └─────────────────────────────────────────────────────────────────────────────┘    ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════╝
 */

import { neo4jAdapter } from '../../adapters/Neo4jAdapter.js';
import { neuralChatService } from './ChatService.js';
import { AgentId, ChatMessage } from './types.js';
import { getVectorStore } from '../../platform/vector/index.js';

export interface CortexQuery {
    type: 'chat' | 'search' | 'pattern' | 'insight' | 'history';
    query: string;
    context?: {
        channel?: string;
        agent?: AgentId;
        timeRange?: { from: string; to: string };
        nodeTypes?: string[];
    };
}

export interface CortexResult {
    type: 'message' | 'node' | 'pattern' | 'insight' | 'connection';
    data: any;
    relevance: number;
    source: string;
    connections?: { type: string; target: string }[];
}

export interface DiscoveredPattern {
    id: string;
    name: string;
    description: string;
    occurrences: number;
    confidence: number;
    relatedNodes: string[];
    discoveredAt: string;
    examples: string[];
}

class NeuralCortex {
    private static instance: NeuralCortex;
    
    public static getInstance(): NeuralCortex {
        if (!NeuralCortex.instance) {
            NeuralCortex.instance = new NeuralCortex();
        }
        return NeuralCortex.instance;
    }

    /**
     * Process a message and connect it to the knowledge graph AND vector store
     */
    async processMessage(message: ChatMessage): Promise<{
        entities: string[];
        concepts: string[];
        linkedNodes: string[];
        vectorStored: boolean;
    }> {
        const entities = this.extractEntities(message.body);
        const concepts = this.extractConcepts(message.body);
        
        // 1. Create message node in GRAPH (Neo4j)
        await neo4jAdapter.runQuery(`
            CREATE (m:Message {
                id: $id,
                from_agent: $from,
                channel: $channel,
                body: $body,
                timestamp: $timestamp,
                type: $type
            })
            WITH m
            
            // Link to sender agent
            MERGE (a:Agent {name: $from})
            MERGE (a)-[:SENT]->(m)
            
            // Link to channel
            MERGE (c:Channel {name: $channel})
            MERGE (m)-[:IN_CHANNEL]->(c)
        `, {
            id: message.id,
            from: message.from,
            channel: message.channel,
            body: message.body,
            timestamp: message.timestamp,
            type: message.type || 'chat'
        });

        // 2. Link to mentioned entities in GRAPH
        const linkedNodes: string[] = [];
        for (const entity of entities) {
            const linked = await this.linkToEntity(message.id, entity);
            if (linked) linkedNodes.push(linked);
        }

        // 3. Link to concepts in GRAPH
        for (const concept of concepts) {
            await this.linkToConcept(message.id, concept);
        }

        // 4. Store embedding in VECTOR STORE (pgvector)
        // This enables "fuzzy" semantic search later
        let vectorStored = false;
        try {
            const vectorStore = await getVectorStore();
            await vectorStore.upsert({
                id: message.id,
                content: message.body,
                metadata: {
                    type: 'message',
                    channel: message.channel,
                    from: message.from,
                    timestamp: message.timestamp,
                    entities: entities,
                    concepts: concepts
                },
                namespace: 'neural_chat'
            });
            vectorStored = true;
        } catch (error) {
            console.warn('Failed to store vector for message:', error);
        }

        return { entities, concepts, linkedNodes, vectorStored };
    }

    /**
     * Extract entities from message (agents, files, components, etc.)
     */
    private extractEntities(text: string): string[] {
        const entities: string[] = [];
        
        // @mentions
        const mentions = text.match(/@(\w+)/g);
        if (mentions) entities.push(...mentions.map(m => m.slice(1)));
        
        // File paths
        const files = text.match(/[\w-]+\.(ts|js|tsx|jsx|json|md|py|yaml|yml|sql)/gi);
        if (files) entities.push(...files);
        
        // Component/Class names (PascalCase)
        const components = text.match(/\b[A-Z][a-zA-Z]+(?:Widget|Service|Controller|Adapter|Component|Provider|Handler)\b/g);
        if (components) entities.push(...components);
        
        // URLs
        const urls = text.match(/https?:\/\/[^\s]+/g);
        if (urls) entities.push(...urls);
        
        return [...new Set(entities)];
    }

    /**
     * Extract concepts from message (topics, actions, technologies)
     */
    private extractConcepts(text: string): string[] {
        const concepts: string[] = [];
        const textLower = text.toLowerCase();
        
        // Technologies
        const techs = ['neo4j', 'react', 'typescript', 'docker', 'kubernetes', 'api', 'websocket', 'mcp', 'graphql', 'rest', 'postgresql', 'redis', 'vector', 'rag'];
        techs.forEach(t => { if (textLower.includes(t)) concepts.push(t); });
        
        // Actions
        const actions = ['deploy', 'review', 'test', 'refactor', 'implement', 'fix', 'create', 'delete', 'update', 'analyze', 'research', 'architect'];
        actions.forEach(a => { if (textLower.includes(a)) concepts.push(a); });
        
        // Domains
        const domains = ['security', 'performance', 'architecture', 'authentication', 'authorization', 'database', 'frontend', 'backend', 'infrastructure', 'ai', 'agents'];
        domains.forEach(d => { if (textLower.includes(d)) concepts.push(d); });
        
        return [...new Set(concepts)];
    }

    /**
     * Link message to existing entity in graph
     */
    private async linkToEntity(messageId: string, entity: string): Promise<string | null> {
        try {
            const result = await neo4jAdapter.runQuery(`
                MATCH (m:Message {id: $messageId})
                MATCH (e) WHERE e.name = $entity OR e.path CONTAINS $entity OR e.id = $entity
                MERGE (m)-[:MENTIONS]->(e)
                RETURN e.name as linked
            `, { messageId, entity });
            
            return result[0]?.linked || null;
        } catch {
            return null;
        }
    }

    /**
     * Link message to concept (create if not exists)
     */
    private async linkToConcept(messageId: string, concept: string): Promise<void> {
        try {
            await neo4jAdapter.runQuery(`
                MATCH (m:Message {id: $messageId})
                MERGE (c:Concept {name: $concept})
                ON CREATE SET c.created_at = datetime()
                MERGE (m)-[:RELATES_TO]->(c)
                WITH c
                SET c.mention_count = coalesce(c.mention_count, 0) + 1
            `, { messageId, concept });
        } catch (error) {
            console.warn('Failed to link concept:', error);
        }
    }

    /**
     * Query the cortex in natural language using Hybrid Strategy
     */
    async query(input: CortexQuery): Promise<CortexResult[]> {
        const results: CortexResult[] = [];
        
        switch (input.type) {
            case 'search':
                return await this.hybridSearch(input.query, input.context);
            
            case 'pattern':
                return await this.findPatterns(input.query, input.context);
            
            case 'insight':
                return await this.generateInsights(input.query, input.context);
            
            case 'history':
                return await this.getDecisionHistory(input.query, input.context);
            
            case 'chat':
            default:
                // 1. Search Chat History (Vector + Keyword)
                const chatResults = await this.searchMessages(input.query);
                // 2. Search Knowledge Graph (Keyword/Hybrid)
                const graphResults = await this.hybridSearch(input.query, input.context);
                
                return [...chatResults, ...graphResults].sort((a, b) => b.relevance - a.relevance);
        }
    }

    /**
     * Search messages using Vector Similarity (Semantic) + Graph (Keyword)
     */
    private async searchMessages(query: string): Promise<CortexResult[]> {
        try {
            const results: CortexResult[] = [];

            // A. Semantic Search (Vector)
            try {
                const vectorStore = await getVectorStore();
                const vectorResults = await vectorStore.search({
                    text: query,
                    limit: 10,
                    namespace: 'neural_chat'
                });

                results.push(...vectorResults.map(r => ({
                    type: 'message' as const,
                    data: {
                        id: r.id,
                        body: r.content,
                        metadata: r.metadata,
                        from: r.metadata?.from,
                        timestamp: r.metadata?.timestamp
                    },
                    relevance: r.similarity,
                    source: 'vector_memory'
                })));
            } catch (err) {
                console.warn('Vector search failed, falling back to graph only', err);
            }

            // B. Keyword Search (Graph) - if vector search didn't yield enough
            if (results.length < 5) {
                const graphResults = await neo4jAdapter.runQuery(`
                    MATCH (m:Message)
                    WHERE toLower(m.body) CONTAINS toLower($query)
                    OPTIONAL MATCH (a:Agent)-[:SENT]->(m)
                    RETURN m, a.name as agent
                    ORDER BY m.timestamp DESC
                    LIMIT 10
                `, { query });

                const existingIds = new Set(results.map(r => r.data.id));

                for (const r of graphResults) {
                    if (!existingIds.has(r.m.properties.id)) {
                         results.push({
                            type: 'message' as const,
                            data: {
                                id: r.m.properties.id,
                                body: r.m.properties.body,
                                from: r.agent,
                                timestamp: r.m.properties.timestamp
                            },
                            relevance: this.calculateRelevance(query, r.m.properties.body),
                            source: 'graph_memory'
                        });
                    }
                }
            }

            return results;
        } catch {
            return [];
        }
    }

    /**
     * Hybrid Search: Vector -> Graph Entry -> Traversal
     */
    private async hybridSearch(query: string, context?: CortexQuery['context']): Promise<CortexResult[]> {
        try {
            const nodeTypes = context?.nodeTypes?.join('|') || 'File|Component|Service|Document|Concept|Agent';
            const results: CortexResult[] = [];

            // 1. Vector Search (Find conceptually related nodes)
            // Assuming we have documents/nodes in 'knowledge' namespace
            try {
                const vectorStore = await getVectorStore();
                const vectorResults = await vectorStore.search({
                    text: query,
                    limit: 10,
                    namespace: 'knowledge' // Search acquired knowledge too
                });

                results.push(...vectorResults.map(r => ({
                    type: 'node' as const,
                    data: {
                        name: r.metadata?.title || r.id,
                        description: r.content.substring(0, 200) + '...',
                        labels: [r.metadata?.type || 'Unknown']
                    },
                    relevance: r.similarity,
                    source: 'semantic_search'
                })));

            } catch (e) { /* ignore vector error */ }

            // 2. Graph Search (Exact/Fuzzy string match)
            const graphResults = await neo4jAdapter.runQuery(`
                MATCH (n)
                WHERE any(label IN labels(n) WHERE label IN split($nodeTypes, '|'))
                AND (
                    toLower(n.name) CONTAINS toLower($query) OR
                    toLower(coalesce(n.description, '')) CONTAINS toLower($query) OR
                    toLower(coalesce(n.path, '')) CONTAINS toLower($query)
                )
                OPTIONAL MATCH (n)-[r]-(connected)
                RETURN n, labels(n) as types, 
                       collect(DISTINCT {type: type(r), target: coalesce(connected.name, connected.id)}) as connections
                LIMIT 20
            `, { query, nodeTypes });

             // Merge results (simple dedup by name)
             const existingNames = new Set(results.map(r => r.data.name));
             
             for (const r of graphResults) {
                 const name = r.n.properties.name || r.n.properties.id;
                 if (!existingNames.has(name)) {
                     results.push({
                        type: 'node' as const,
                        data: {
                            name: name,
                            labels: r.types,
                            properties: r.n.properties
                        },
                        relevance: this.calculateRelevance(query, name),
                        source: 'knowledge_graph',
                        connections: r.connections.filter((c: any) => c.target)
                    });
                 }
             }

            return results;
        } catch {
            return [];
        }
    }

    /**
     * Find patterns across conversations and code
     */
    private async findPatterns(query: string, context?: CortexQuery['context']): Promise<CortexResult[]> {
        try {
            // Find frequently co-occurring concepts
            const conceptPatterns = await neo4jAdapter.runQuery(`
                MATCH (m:Message)-[:RELATES_TO]->(c1:Concept)
                MATCH (m)-[:RELATES_TO]->(c2:Concept)
                WHERE c1 <> c2 AND id(c1) < id(c2)
                WITH c1, c2, count(m) as cooccurrences
                WHERE cooccurrences >= 2
                RETURN c1.name as concept1, c2.name as concept2, cooccurrences
                ORDER BY cooccurrences DESC
                LIMIT 10
            `);

            // Find agent collaboration patterns
            const collabPatterns = await neo4jAdapter.runQuery(`
                MATCH (a1:Agent)-[:SENT]->(m1:Message)-[:IN_CHANNEL]->(ch:Channel)<-[:IN_CHANNEL]-(m2:Message)<-[:SENT]-(a2:Agent)
                WHERE a1 <> a2 AND m1.timestamp < m2.timestamp
                AND duration.between(datetime(m1.timestamp), datetime(m2.timestamp)).minutes < 30
                WITH a1, a2, count(*) as interactions
                RETURN a1.name as agent1, a2.name as agent2, interactions
                ORDER BY interactions DESC
            `);

            // Find decision patterns (messages with action words followed by changes)
            const decisionPatterns = await neo4jAdapter.runQuery(`
                MATCH (m:Message)
                WHERE any(word IN ['besluttet', 'approved', 'godkendt', 'implement', 'deploy', 'fix'] 
                         WHERE toLower(m.body) CONTAINS word)
                OPTIONAL MATCH (m)-[:MENTIONS]->(e)
                RETURN m.body as decision, m.from_agent as by, m.timestamp as when, 
                       collect(e.name) as affected
                ORDER BY m.timestamp DESC
                LIMIT 10
            `);

            const patterns: CortexResult[] = [];

            if (conceptPatterns.length > 0) {
                patterns.push({
                    type: 'pattern',
                    data: {
                        name: 'Concept Relationships',
                        description: 'Frequently discussed together',
                        items: conceptPatterns.map((p: any) => `${p.concept1} ↔ ${p.concept2} (${p.cooccurrences}x)`)
                    },
                    relevance: 0.9,
                    source: 'pattern_analysis'
                });
            }

            if (collabPatterns.length > 0) {
                patterns.push({
                    type: 'pattern',
                    data: {
                        name: 'Agent Collaboration',
                        description: 'Who works together most',
                        items: collabPatterns.map((p: any) => `${p.agent1} ↔ ${p.agent2} (${p.interactions} interactions)`)
                    },
                    relevance: 0.85,
                    source: 'pattern_analysis'
                });
            }

            if (decisionPatterns.length > 0) {
                patterns.push({
                    type: 'pattern',
                    data: {
                        name: 'Recent Decisions',
                        description: 'Actions taken by the team',
                        items: decisionPatterns.map((p: any) => ({
                            decision: p.decision.substring(0, 100) + '...',
                            by: p.by,
                            when: p.when,
                            affected: p.affected
                        }))
                    },
                    relevance: 0.95,
                    source: 'pattern_analysis'
                });
            }

            return patterns;
        } catch (error) {
            console.warn('Pattern finding failed:', error);
            return [];
        }
    }

    /**
     * Generate insights from the knowledge graph
     */
    private async generateInsights(query: string, context?: CortexQuery['context']): Promise<CortexResult[]> {
        try {
            const insights: CortexResult[] = [];

            // Most active areas
            const activeAreas = await neo4jAdapter.runQuery(`
                MATCH (c:Concept)<-[:RELATES_TO]-(m:Message)
                WITH c.name as concept, count(m) as activity
                ORDER BY activity DESC
                LIMIT 5
                RETURN concept, activity
            `);

            // Knowledge gaps (mentioned but not documented)
            const gaps = await neo4jAdapter.runQuery(`
                MATCH (m:Message)-[:MENTIONS]->(name)
                WHERE NOT (name)-[:DOCUMENTED_IN]->(:Document)
                AND NOT name:Agent
                WITH name.name as entity, count(m) as mentions
                WHERE mentions >= 2
                RETURN entity, mentions
                ORDER BY mentions DESC
                LIMIT 5
            `);

            // Cross-cutting concerns (concepts that touch many areas)
            const crossCutting = await neo4jAdapter.runQuery(`
                MATCH (c:Concept)<-[:RELATES_TO]-(m:Message)-[:IN_CHANNEL]->(ch:Channel)
                WITH c.name as concept, count(DISTINCT ch) as channels
                WHERE channels >= 2
                RETURN concept, channels
                ORDER BY channels DESC
                LIMIT 5
            `);

            if (activeAreas.length > 0) {
                insights.push({
                    type: 'insight',
                    data: {
                        title: '🔥 Hottest Topics',
                        description: 'Most discussed areas right now',
                        items: activeAreas.map((a: any) => `${a.concept}: ${a.activity} mentions`)
                    },
                    relevance: 0.9,
                    source: 'insight_engine'
                });
            }

            if (crossCutting.length > 0) {
                insights.push({
                    type: 'insight',
                    data: {
                        title: '🔗 Cross-Cutting Concerns',
                        description: 'Topics that span multiple channels',
                        items: crossCutting.map((c: any) => `${c.concept}: ${c.channels} channels`)
                    },
                    relevance: 0.85,
                    source: 'insight_engine'
                });
            }

            return insights;
        } catch {
            return [];
        }
    }
    
    /**
     * Calculate relevance score (0-1) for a result
     */
    private calculateRelevance(query: string, text: string): number {
        if (!text) return 0;
        const queryTerms = query.toLowerCase().split(' ');
        const textLower = text.toLowerCase();
        
        let matches = 0;
        for (const term of queryTerms) {
            if (textLower.includes(term)) matches++;
        }
        
        return matches / queryTerms.length;
    }

    /**
     * Retrieve decision history
     */
    private async getDecisionHistory(query: string, context?: CortexQuery['context']): Promise<CortexResult[]> {
        try {
             const history = await neo4jAdapter.runQuery(`
                MATCH (m:Message)
                WHERE any(word IN ['decision', 'approved', 'rejected', 'selected', 'chose'] 
                         WHERE toLower(m.body) CONTAINS word)
                AND toLower(m.body) CONTAINS toLower($query)
                RETURN m, m.from_agent as agent
                ORDER BY m.timestamp DESC
                LIMIT 20
             `, { query });

             return history.map((h: any) => ({
                 type: 'message',
                 data: {
                     id: h.m.properties.id,
                     body: h.m.properties.body,
                     agent: h.agent,
                     timestamp: h.m.properties.timestamp
                 },
                 relevance: 1,
                 source: 'history'
             }));
        } catch {
            return [];
        }
    }
}

// Singleton export
export const neuralCortex = new NeuralCortex();