import { Router } from 'express';
import { MemoryRepository } from './memoryRepository.js';
import { MemoryEntityInput, CmaContextRequest } from '@widget-tdc/mcp-types';

export const memoryRouter = Router();
const memoryRepo = new MemoryRepository();

// Ingest a memory entity
memoryRouter.post('/ingest', (req, res) => {
  try {
    const input: MemoryEntityInput = req.body;
    
    if (!input.orgId || !input.entityType || !input.content) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, entityType, content',
      });
    }

    const entityId = memoryRepo.ingestEntity(input);
    
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

// Get contextual prompt with memories
memoryRouter.post('/contextual-prompt', (req, res) => {
  try {
    const request: CmaContextRequest = req.body;
    
    if (!request.orgId || !request.userId || !request.userQuery) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, userId, userQuery',
      });
    }

    // Search for relevant memories
    const memories = memoryRepo.searchEntities({
      orgId: request.orgId,
      userId: request.userId,
      keywords: request.keywords || [],
      limit: 5,
    });

    // Build contextual prompt
    const memoryContext = memories.map(m => 
      `[${m.entity_type}] ${m.content} (importance: ${m.importance})`
    ).join('\n');

    const prompt = `
Context from memory:
${memoryContext}

Widget data:
${request.widgetData || 'None'}

User query:
${request.userQuery}

Please provide a response considering the above context.
    `.trim();

    res.json({
      success: true,
      prompt,
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        importance: m.importance,
      })),
    });
  } catch (error: any) {
    console.error('Contextual prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Search memories
memoryRouter.post('/search', (req, res) => {
  try {
    const query = req.body;
    const memories = memoryRepo.searchEntities(query);
    
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
