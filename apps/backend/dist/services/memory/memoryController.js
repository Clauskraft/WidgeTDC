import { Router } from 'express';
import { MemoryRepository } from './memoryRepository.js';
export const memoryRouter = Router();
const memoryRepo = new MemoryRepository();
// Simple in-memory cache with TTL
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }
    set(key, data, ttlMs = 300000) {
        this.cache.set(key, { data, expiry: Date.now() + ttlMs });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    clear() {
        this.cache.clear();
    }
}
const contextCache = new SimpleCache();
// Ingest a memory entity
memoryRouter.post('/ingest', async (req, res) => {
    try {
        const input = req.body;
        if (!input.orgId || !input.entityType || !input.content) {
            return res.status(400).json({
                error: 'Missing required fields: orgId, entityType, content',
            });
        }
        const entityId = await memoryRepo.ingestEntity(input);
        // Clear context cache when new memory is added to ensure freshness
        contextCache.clear();
        res.json({
            success: true,
            id: entityId,
        });
    }
    catch (error) {
        console.error('Memory ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get contextual prompt with memories
memoryRouter.post('/contextual-prompt', async (req, res) => {
    try {
        const request = req.body;
        if (!request.orgId || !request.userId || !request.userQuery) {
            return res.status(400).json({
                error: 'Missing required fields: orgId, userId, userQuery',
            });
        }
        // Create cache key from request parameters
        const cacheKey = `${request.orgId}:${request.userId}:${request.userQuery}:${JSON.stringify(request.keywords || [])}:${request.widgetData || ''}`;
        // Check cache first
        const cachedResult = contextCache.get(cacheKey);
        if (cachedResult) {
            return res.json({
                success: true,
                ...cachedResult,
                cached: true,
            });
        }
        // Search for relevant memories with enhanced semantic search
        const memories = await memoryRepo.searchEntities({
            orgId: request.orgId,
            userId: request.userId,
            keywords: request.keywords || [],
            limit: 5,
        });
        // Build enhanced contextual prompt with semantic scoring
        const memoryContext = memories.map(m => {
            const score = m.semanticScore ? ` (semantic score: ${(m.semanticScore * 100).toFixed(1)}%)` : '';
            return `[${m.entity_type}] ${m.content} (importance: ${m.importance})${score}`;
        }).join('\n');
        const prompt = `
Context from memory (enhanced with semantic search):
${memoryContext}

Widget data:
${request.widgetData || 'None'}

User query:
${request.userQuery}

Please provide a hyper-contextual response considering the semantic relationships and importance scores above.
    `.trim();
        const result = {
            prompt,
            memories: memories.map(m => ({
                id: m.id,
                content: m.content,
                importance: m.importance,
                semanticScore: m.semanticScore,
            })),
        };
        // Cache the result for 5 minutes
        contextCache.set(cacheKey, result, 300000);
        res.json({
            success: true,
            ...result,
            cached: false,
        });
    }
    catch (error) {
        console.error('Contextual prompt error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Search memories
memoryRouter.post('/search', async (req, res) => {
    try {
        const query = req.body;
        const memories = await memoryRepo.searchEntities(query);
        res.json({
            success: true,
            memories,
            count: memories.length,
        });
    }
    catch (error) {
        console.error('Memory search error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
