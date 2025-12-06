import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neuralCortex, CortexQuery } from '../../src/services/NeuralChat/NeuralCortex';
import { neo4jAdapter } from '../../src/adapters/Neo4jAdapter';

// Mock dependencies
vi.mock('../../src/adapters/Neo4jAdapter', () => ({
    neo4jAdapter: {
        runQuery: vi.fn(),
    },
}));

// Mock Vector Store
const mockVectorStore = {
    upsert: vi.fn(),
    search: vi.fn(),
    initialize: vi.fn(),
};

vi.mock('../../src/platform/vector/index', () => ({
    getVectorStore: vi.fn().mockResolvedValue(mockVectorStore),
}));

describe('NeuralCortex (Hybrid RAG)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('processMessage', () => {
        it('should store message in both Graph and Vector store', async () => {
            const message = {
                id: 'msg-123',
                from: 'gemini',
                channel: 'core-dev',
                body: 'We should use pgvector for semantic search and Neo4j for graphs.',
                timestamp: new Date().toISOString(),
                type: 'chat',
            };

            // Mock Graph response
            (neo4jAdapter.runQuery as any).mockResolvedValue([]);

            const result = await neuralCortex.processMessage(message);

            // Verify Graph interactions
            expect(neo4jAdapter.runQuery).toHaveBeenCalledTimes(1); // Create message node
            // It might be called more for entities/concepts, but at least once for the message

            // Verify Vector interaction
            expect(mockVectorStore.upsert).toHaveBeenCalledWith(expect.objectContaining({
                id: 'msg-123',
                content: message.body,
                namespace: 'neural_chat',
                metadata: expect.objectContaining({
                    type: 'message',
                    from: 'gemini',
                    concepts: expect.arrayContaining(['pgvector', 'neo4j'])
                })
            }));

            expect(result.vectorStored).toBe(true);
            expect(result.concepts).toContain('pgvector');
            expect(result.concepts).toContain('neo4j');
        });
    });

    describe('query (Hybrid Search)', () => {
        it('should combine results from Vector and Graph search', async () => {
            const query: CortexQuery = {
                type: 'search',
                query: 'database architecture',
            };

            // Mock Vector Results (Semantic)
            mockVectorStore.search.mockResolvedValue([
                {
                    id: 'doc-1',
                    content: 'PostgreSQL is a relational database.',
                    similarity: 0.9,
                    metadata: { title: 'Postgres Guide', type: 'Document' }
                }
            ]);

            // Mock Graph Results (Keyword/Structural)
            (neo4jAdapter.runQuery as any).mockResolvedValue([
                {
                    n: { properties: { name: 'Neo4j', id: 'node-2' } },
                    types: ['Technology'],
                    connections: []
                }
            ]);

            const results = await neuralCortex.query(query);

            // Should have 2 results
            expect(results).toHaveLength(2);

            // Check sources
            const vectorResult = results.find(r => r.source === 'semantic_search');
            const graphResult = results.find(r => r.source === 'knowledge_graph');

            expect(vectorResult).toBeDefined();
            expect(vectorResult?.data.name).toBe('Postgres Guide');
            expect(vectorResult?.relevance).toBe(0.9);

            expect(graphResult).toBeDefined();
            expect(graphResult?.data.name).toBe('Neo4j');
        });

        it('should fallback gracefully if vector store fails', async () => {
            const query: CortexQuery = {
                type: 'search',
                query: 'resilient system',
            };

            // Mock Vector Failure
            mockVectorStore.search.mockRejectedValue(new Error('Vector DB offline'));

            // Mock Graph Success
            (neo4jAdapter.runQuery as any).mockResolvedValue([
                {
                    n: { properties: { name: 'SelfHealingAdapter', id: 'node-3' } },
                    types: ['Service'],
                    connections: []
                }
            ]);

            const results = await neuralCortex.query(query);

            // Should still return graph results
            expect(results).toHaveLength(1);
            expect(results[0].data.name).toBe('SelfHealingAdapter');
            expect(results[0].source).toBe('knowledge_graph');
        });
    });
});
