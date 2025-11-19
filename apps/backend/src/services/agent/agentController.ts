import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  personas?: string[];
  confidence?: number;
}

interface AgentQueryRequest {
  query: string;
  userId?: string;
  context?: {
    activePersonas: string[];
    conversationHistory: Message[];
  };
}

interface AgentQueryResponse {
  response: string;
  personas_used: string[];
  confidence: number;
}

// L1 Director Agent Query Endpoint
router.post('/query', async (req: Request<{}, {}, AgentQueryRequest>, res: Response) => {
  try {
    const { query, userId, context } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required',
        message: 'Please provide a valid query string'
      });
    }

    // Log the incoming request
    console.log('Agent query received:', {
      userId: userId || 'anonymous',
      query: query.substring(0, 100),
      activePersonas: context?.activePersonas || [],
      historyLength: context?.conversationHistory?.length || 0
    });

    // TODO: Integrate with CGentCore L1 Director Agent
    // For now, return a mock response based on active personas
    const activePersonas = context?.activePersonas || [];
    const personasUsed = activePersonas.length > 0 ? activePersonas : ['architect'];

    // Simulate agent processing
    const responses: Record<string, string> = {
      architect: 'Fra et arkitektur-perspektiv anbefaler jeg at fokusere på modulær design og skalerbarhed.',
      security: 'Sikkerhedsmæssigt skal du være opmærksom på validering af input og autentificering.',
      backend: 'Backend-optimering bør fokusere på database-queries og API performance.',
      frontend: 'Frontend bør prioritere brugeroplevelse, tilgængelighed og responsive design.'
    };

    const personaResponses = personasUsed
      .map(p => responses[p] || '')
      .filter(Boolean);

    const response: AgentQueryResponse = {
      response: personaResponses.length > 0
        ? `${personaResponses.join('\n\n')}\n\nBaseret på din forespørgsel: "${query}"`
        : `Jeg har modtaget din forespørgsel: "${query}". Hvordan kan jeg hjælpe dig videre?`,
      personas_used: personasUsed,
      confidence: 0.85
    };

    res.json(response);
  } catch (error) {
    console.error('Agent query error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'agent',
    timestamp: new Date().toISOString()
  });
});

export { router as agentRouter };
