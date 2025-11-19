import { McpContext } from '@widget-tdc/mcp-types';
import { MemoryRepository } from '../services/memory/memoryRepository.js';
import { SragRepository } from '../services/srag/sragRepository.js';
import { EvolutionRepository } from '../services/evolution/evolutionRepository.js';
import { PalRepository } from '../services/pal/palRepository.js';
import { getLlmService } from '../services/llm/llmService.js';

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

  const systemContext = `You are an AI assistant with access to contextual memory. Use the provided context to give informed, personalized responses.`;

  const additionalContext = `
Context from memory:
${memoryContext}

Widget data:
${payload.widgetData || 'None'}
  `.trim();

  // Generate LLM response
  const llmService = getLlmService();
  const aiResponse = await llmService.generateContextualResponse(
    systemContext,
    payload.userQuery,
    additionalContext
  );

  return {
    response: aiResponse,
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

    // Generate LLM response for analytical query
    const llmService = getLlmService();
    const systemContext = `You are a data analyst. Analyze the structured facts and provide insights based on the user's analytical query.`;
    const factsContext = `Available facts:\n${JSON.stringify(facts, null, 2)}`;
    const aiResponse = await llmService.generateContextualResponse(
      systemContext,
      payload.naturalLanguageQuery,
      factsContext
    );

    return {
      type: 'analytical',
      response: aiResponse,
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

    // Generate LLM response for semantic query
    const llmService = getLlmService();
    const systemContext = `You are a document search assistant. Provide a summary and insights from the retrieved documents.`;
    const docsContext = `Retrieved documents:\n${JSON.stringify(documents, null, 2)}`;
    const aiResponse = await llmService.generateContextualResponse(
      systemContext,
      payload.naturalLanguageQuery,
      docsContext
    );

    return {
      type: 'semantic',
      response: aiResponse,
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

  // Generate LLM analysis of agent performance
  const llmService = getLlmService();
  const systemContext = `You are an AI performance analyst. Analyze agent performance metrics and provide recommendations for improvement.`;
  const metricsContext = `
Agent ID: ${payload.agentId}
Average KPI Delta: ${avgDelta}
Needs Refinement: ${avgDelta < 0}
Recent Run: ${JSON.stringify(payload, null, 2)}
  `.trim();
  const aiAnalysis = await llmService.generateContextualResponse(
    systemContext,
    'Analyze this agent performance and provide recommendations',
    metricsContext
  );

  return {
    runId,
    evaluation: {
      agentId: payload.agentId,
      needsRefinement: avgDelta < 0,
      averageKpiDelta: avgDelta,
      aiAnalysis,
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

  // Generate LLM insights about the event
  const llmService = getLlmService();
  const systemContext = `You are a personal AI assistant focused on user wellbeing. Analyze user events and provide supportive insights.`;
  const eventContext = `
Event Type: ${payload.eventType}
Stress Level: ${payload.detectedStressLevel || 'normal'}
Event Details: ${JSON.stringify(payload.payload, null, 2)}
  `.trim();
  const aiInsight = await llmService.generateContextualResponse(
    systemContext,
    'Provide a brief insight about this user event',
    eventContext
  );

  return {
    eventId,
    insight: aiInsight,
  };
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

  // Generate personalized AI recommendations
  const llmService = getLlmService();
  const systemContext = `You are a personal AI assistant focused on productivity and wellbeing. Provide brief, actionable recommendations.`;
  const userContext = `
User Profile: ${JSON.stringify(profile, null, 2)}
Focus Windows: ${focusWindows.length} configured
Stress Distribution (24h): ${JSON.stringify(stressDistribution, null, 2)}
High Stress Count: ${highStressCount}
Current Time: ${now.toISOString()}
In Focus Window: ${!!currentFocusWindow}
  `.trim();
  const aiRecommendations = await llmService.generateContextualResponse(
    systemContext,
    'Provide personalized recommendations for optimizing the user\'s widget board',
    userContext
  );

  return {
    boardAdjustments,
    aiRecommendations,
  };
}
