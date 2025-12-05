import { Router } from 'express';
import { MemoryRepository } from './memoryRepository.js';
import { MemoryEntityInput, CmaContextRequest } from '@widget-tdc/mcp-types';

export const memoryRouter = Router();
const memoryRepo = new MemoryRepository();

class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const contextCache = new SimpleCache();

const validateRequiredFields = (obj: Record<string, any>, fields: string[]): string | null => {
  for (const field of fields) {
    if (!obj[field]) return field;
  }
  return null;
};

memoryRouter.post('/ingest', async (req, res) => {
  try {
    const input: MemoryEntityInput = req.body;
    const missingField = validateRequiredFields(input, ['orgId', 'entityType', 'content']);
    if (missingField) {
      return res.status(400).json({
        error: `Missing required field: ${missingField}`,
      });
    }

    const entityId = await memoryRepo.ingestEntity(input);
    contextCache.clear();

    res.json({
      success: true,
      id: entityId,
    });
  } catch (error: any) {
    console.error('Memory ingest error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

memoryRouter.post('/contextual-prompt', async (req, res) => {
  try {
    const request: CmaContextRequest = req.body;
    const missingField = validateRequiredFields(request, ['orgId', 'userId', 'userQuery']);
    if (missingField) {
      return res.status(400).json({
        error: `Missing required field: ${missingField}`,
      });
    }

    const cacheKey = `${request.orgId}:${request.userId}:${request.userQuery}:${JSON.stringify(request.keywords || [])}:${request.widgetData || ''}`;
    const cachedResult = contextCache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        ...cachedResult,
        cached: true,
      });
    }

    const memories = await memoryRepo.searchEntities({
      orgId: request.orgId,
      userId: request.userId,
      keywords: request.keywords || [],
      limit: 5,
    });

    const memoryContext = memories.map(m => {
      const score = m.semanticScore ? ` (semantic score: ${(m.semanticScore * 100).toFixed(1)}%)` : '';
      return `[${m.entity_type}] ${m.content} (importance: ${m.importance})${score}`;
    }).join('\n');

    const prompt = `Context from memory (enhanced with semantic search):
${memoryContext}

Widget data:
${request.widgetData || 'None'}

User query:
${request.userQuery}

Please provide a hyper-contextual response considering the semantic relationships and importance scores above.`.trim();

    const result = {
      prompt,
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        importance: m.importance,
        semanticScore: m.semanticScore,
      })),
    };

    contextCache.set(cacheKey, result, 300000);

    res.json({
      success: true,
      ...result,
      cached: false,
    });
  } catch (error: any) {
    console.error('Contextual prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

memoryRouter.post('/search', async (req, res) => {
  try {
    const query = req.body;
    const memories = await memoryRepo.searchEntities(query);

    res.json({
      success: true,
      memories,
      count: memories.length,
    });
  } catch (error: any) {
    console.error('Memory search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});