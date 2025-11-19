import { McpContext } from '@widget-tdc/mcp-types';
import { MemoryRepository } from '../services/memory/memoryRepository.js';
import { SragRepository } from '../services/srag/sragRepository.js';
import { EvolutionRepository } from '../services/evolution/evolutionRepository.js';
import { PalRepository } from '../services/pal/palRepository.js';

const memoryRepo = new MemoryRepository();
const sragRepo = new SragRepository();
const evolutionRepo = new EvolutionRepository();
const palRepo = new PalRepository();

// CMA tool handlers
export async function cmaContextHandler(payload: any, _ctx: McpContext): Promise<any> {
  const ctx = _ctx;
  const memories = memoryRepo.searchEntities({
    orgId: ctx.orgId,
    userId: ctx.userId,
    keywords: payload.keywords || [],
    limit: 5,
  });

  const memoryContext = memories.map(m => 
    `[${m.entity_type}] ${m.content} (importance: ${m.importance})`
  ).join('\n');

  const prompt = `
Context from memory:
${memoryContext}

Widget data:
${payload.widgetData || 'None'}

User query:
${payload.userQuery}

Please provide a response considering the above context.
  `.trim();

  return {
    prompt,
    memories: memories.map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
    })),
  };
}

export async function cmaIngestHandler(payload: any, _ctx: McpContext): Promise<any> {
  const ctx = _ctx;
  const entityId = memoryRepo.ingestEntity({
    orgId: ctx.orgId,
    userId: ctx.userId,
    entityType: payload.entityType,
    content: payload.content,
    importance: payload.importance,
    tags: payload.tags,
  });

  return { id: entityId };
}

// SRAG tool handlers
export async function sragQueryHandler(payload: any, ctx: McpContext): Promise<any> {
  const query = payload.naturalLanguageQuery.toLowerCase();
  const sqlKeywords = ['sum', 'count', 'average', 'total', 'group by', 'where'];
  const isAnalytical = sqlKeywords.some(keyword => query.includes(keyword));

  if (isAnalytical) {
    const facts = sragRepo.queryFacts(ctx.orgId);
    return {
      type: 'analytical',
      result: facts,
      sqlQuery: 'SELECT * FROM structured_facts WHERE org_id = ?',
      metadata: {
        traceId: Math.random().toString(36),
        docIds: facts.map(f => f.doc_id).filter(Boolean),
      },
    };
  } else {
    const keywords = query.split(' ').filter((w: string) => w.length > 3);
    const documents = keywords.length > 0 
      ? sragRepo.searchDocuments(ctx.orgId, keywords[0])
      : [];
    
    return {
      type: 'semantic',
      result: documents,
      sqlQuery: null,
      metadata: {
        traceId: Math.random().toString(36),
        docIds: documents.map(d => d.id),
      },
    };
  }
}

// Evolution tool handlers
export async function evolutionReportHandler(payload: any, ctx: McpContext): Promise<any> {
  const runId = evolutionRepo.recordRun(payload);
  const avgDelta = evolutionRepo.getAverageKpiDelta(payload.agentId, 10);
  
  return {
    runId,
    evaluation: {
      agentId: payload.agentId,
      needsRefinement: avgDelta < 0,
      averageKpiDelta: avgDelta,
    },
  };
}

export async function evolutionGetPromptHandler(payload: any, ctx: McpContext): Promise<any> {
  const prompt = evolutionRepo.getLatestPrompt(payload.agentId);
  
  if (!prompt) {
    throw new Error('No prompt found for agent');
  }

  return {
    agentId: prompt.agent_id,
    version: prompt.version,
    promptText: prompt.prompt_text,
    createdAt: prompt.created_at,
    createdBy: prompt.created_by,
  };
}

// PAL tool handlers
export async function palEventHandler(payload: any, ctx: McpContext): Promise<any> {
  const eventId = palRepo.recordEvent({
    userId: ctx.userId,
    orgId: ctx.orgId,
    eventType: payload.eventType,
    payload: payload.payload,
    detectedStressLevel: payload.detectedStressLevel,
  });

  return { eventId };
}

export async function palBoardActionHandler(payload: any, ctx: McpContext): Promise<any> {
  // Get recommendations
  let profile = palRepo.getUserProfile(ctx.userId, ctx.orgId);
  if (!profile) {
    palRepo.createUserProfile(ctx.userId, ctx.orgId);
  }

  const focusWindows = palRepo.getFocusWindows(ctx.userId, ctx.orgId);
  const stressDistribution = palRepo.getStressLevelDistribution(ctx.userId, ctx.orgId, 24);

  const highStressCount = stressDistribution.find((d: any) => d.detected_stress_level === 'high')?.count || 0;
  
  const boardAdjustments = [];

  if (highStressCount > 3) {
    boardAdjustments.push({
      actionType: 'mute_notifications',
      message: 'You seem stressed. Would you like to mute notifications?',
    });
  }

  const now = new Date();
  const currentWeekday = now.getDay() || 7;
  const currentHour = now.getHours();
  
  const currentFocusWindow = focusWindows.find((fw: any) => 
    fw.weekday === currentWeekday && 
    fw.start_hour <= currentHour && 
    fw.end_hour > currentHour
  );

  if (currentFocusWindow) {
    boardAdjustments.push({
      actionType: 'isolate_widget_view',
      message: 'You\'re in a focus window.',
    });
  }

  return { boardAdjustments };
}
