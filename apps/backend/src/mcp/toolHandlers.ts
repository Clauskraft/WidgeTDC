import { McpContext } from '@widget-tdc/mcp-types';
import { MemoryRepository } from '../services/memory/memoryRepository.js';
import { SragRepository } from '../services/srag/sragRepository.js';
import { EvolutionRepository } from '../services/evolution/evolutionRepository.js';
import { PalRepository } from '../services/pal/palRepository.js';
import { NotesRepository } from '../services/notes/notesRepository.js';
import { getLlmService } from '../services/llm/llmService.js';
import { unifiedGraphRAG } from './cognitive/UnifiedGraphRAG.js';
import { stateGraphRouter } from './cognitive/StateGraphRouter.js';
import { patternEvolutionEngine } from './cognitive/PatternEvolutionEngine.js';
import { agentTeam } from './cognitive/AgentTeam.js';

const memoryRepo = new MemoryRepository();
const sragRepo = new SragRepository();
const evolutionRepo = new EvolutionRepository();
const palRepo = new PalRepository();
const notesRepo = new NotesRepository();


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

// CMA Memory Store handler
export async function cmaMemoryStoreHandler(payload: any, ctx: McpContext): Promise<any> {
  const { content, entityType, importance, tags } = payload;

  if (!content) {
    throw new Error('Content is required for memory storage');
  }

  const entityId = memoryRepo.ingestEntity({
    orgId: ctx.orgId,
    userId: ctx.userId,
    entityType: entityType || 'note',
    content,
    importance: importance || 3,
    tags: tags || [],
  });

  return {
    success: true,
    id: entityId,
    message: 'Memory stored successfully',
  };
}

// CMA Memory Retrieve handler
export async function cmaMemoryRetrieveHandler(payload: any, ctx: McpContext): Promise<any> {
  const { keywords, limit, entityType } = payload;

  const memories = memoryRepo.searchEntities({
    orgId: ctx.orgId,
    userId: ctx.userId,
    keywords: keywords || [],
    limit: limit || 10,
  });

  // Filter by entity type if specified
  const filteredMemories = entityType
    ? memories.filter(m => m.entity_type === entityType)
    : memories;

  return {
    success: true,
    count: filteredMemories.length,
    memories: filteredMemories.map(m => ({
      id: m.id,
      content: m.content,
      entityType: m.entity_type,
      importance: m.importance,
      createdAt: m.created_at,
    })),
  };
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
export async function evolutionReportHandler(payload: any, _ctx: McpContext): Promise<any> {
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

export async function evolutionGetPromptHandler(payload: any, _ctx: McpContext): Promise<any> {
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

// Evolution Analyze Prompts handler
export async function evolutionAnalyzePromptsHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { agentId, limit } = payload;

  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  // Get recent runs for analysis
  const runs = evolutionRepo.getRecentRuns(agentId, limit || 10);
  const avgDelta = evolutionRepo.getAverageKpiDelta(agentId, limit || 10);
  const latestPrompt = evolutionRepo.getLatestPrompt(agentId);

  // Use LLM to analyze prompt evolution
  const llmService = getLlmService();
  const systemContext = `You are an AI prompt engineering expert. Analyze the evolution of agent prompts and their performance metrics to provide insights and recommendations.`;
  const analysisContext = `
Agent ID: ${agentId}
Latest Prompt: ${latestPrompt ? latestPrompt.prompt_text : 'None'}
Recent Runs: ${JSON.stringify(runs, null, 2)}
Average KPI Delta: ${avgDelta}
Performance Trend: ${avgDelta > 0 ? 'Improving' : avgDelta < 0 ? 'Declining' : 'Stable'}
  `.trim();

  const analysis = await llmService.generateContextualResponse(
    systemContext,
    'Analyze the prompt evolution and provide recommendations for improvement',
    analysisContext
  );

  return {
    success: true,
    agentId,
    analysis,
    metrics: {
      totalRuns: runs.length,
      averageKpiDelta: avgDelta,
      trend: avgDelta > 0 ? 'improving' : avgDelta < 0 ? 'declining' : 'stable',
    },
    latestPrompt: latestPrompt ? {
      version: latestPrompt.version,
      text: latestPrompt.prompt_text,
      createdAt: latestPrompt.created_at,
    } : null,
    recentRuns: runs.slice(0, 5).map((run: any) => ({
      runId: run.id,
      kpiDelta: run.kpi_delta,
      timestamp: run.created_at,
    })),
  };
}

// SRAG Governance Check handler
export async function sragGovernanceCheckHandler(payload: any, ctx: McpContext): Promise<any> {
  const { query, documentIds, checkCompliance } = payload;

  if (!query) {
    throw new Error('Query is required for governance check');
  }

  // Perform the SRAG query
  const queryResult = await sragQueryHandler({ naturalLanguageQuery: query }, ctx);

  // Additional governance checks
  const llmService = getLlmService();
  const systemContext = `You are a data governance and compliance expert. Analyze the query and results for potential compliance issues, data sensitivity, and governance concerns.`;
  const governanceContext = `
Query: "${query}"
Result Type: ${queryResult.type}
Documents Retrieved: ${queryResult.result?.length || 0}
Document IDs: ${JSON.stringify(queryResult.metadata?.docIds || [])}
Check Compliance: ${checkCompliance !== false}
  `.trim();

  const governanceAnalysis = await llmService.generateContextualResponse(
    systemContext,
    'Analyze this data query for governance and compliance concerns. Identify any sensitive data, potential risks, and provide recommendations.',
    governanceContext
  );

  return {
    success: true,
    query,
    queryResult: {
      type: queryResult.type,
      documentCount: queryResult.result?.length || 0,
      response: queryResult.response,
    },
    governance: {
      analysis: governanceAnalysis,
      complianceStatus: 'reviewed',
      sensitivityLevel: 'medium', // Could be enhanced with actual classification
      recommendations: [
        'Ensure proper access controls are in place',
        'Log this query for audit purposes',
        'Review data retention policies',
      ],
    },
    metadata: {
      timestamp: new Date().toISOString(),
      userId: ctx.userId,
      orgId: ctx.orgId,
    },
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
  const profile = palRepo.getUserProfile(ctx.userId, ctx.orgId);
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

// PAL Workflow Optimization tool handler
export async function palOptimizeWorkflowHandler(payload: any, ctx: McpContext): Promise<any> {
  // Get user profile and recent events
  let profile = palRepo.getUserProfile(ctx.userId, ctx.orgId);
  if (!profile) {
    palRepo.createUserProfile(ctx.userId, ctx.orgId);
    profile = palRepo.getUserProfile(ctx.userId, ctx.orgId);
  }

  const recentEvents = palRepo.getRecentEvents(ctx.userId, ctx.orgId, 20);
  const stressDistribution = palRepo.getStressLevelDistribution(ctx.userId, ctx.orgId, 24);
  const focusWindows = palRepo.getFocusWindows(ctx.userId, ctx.orgId);

  // Analyze workflow patterns
  const llmService = getLlmService();
  const systemContext = `You are a workflow optimization expert. Analyze user behavior patterns and provide actionable recommendations to improve productivity and reduce stress.`;
  const workflowContext = `
User Profile: ${JSON.stringify(profile, null, 2)}
Recent Events (20): ${JSON.stringify(recentEvents, null, 2)}
Stress Distribution (24h): ${JSON.stringify(stressDistribution, null, 2)}
Focus Windows: ${JSON.stringify(focusWindows, null, 2)}
Current Context: ${JSON.stringify(payload.context || {}, null, 2)}
  `.trim();

  const optimization = await llmService.generateContextualResponse(
    systemContext,
    payload.query || 'Analyze my workflow and provide optimization recommendations',
    workflowContext
  );

  return {
    optimization,
    metrics: {
      totalEvents: recentEvents.length,
      stressDistribution,
      focusWindowsConfigured: focusWindows.length,
    },
    recommendations: [
      {
        type: 'focus_time',
        priority: 'high',
        message: 'Consider scheduling dedicated focus blocks',
      },
    ],
  };
}

// PAL Sentiment Analysis tool handler
export async function palAnalyzeSentimentHandler(payload: any, ctx: McpContext): Promise<any> {
  const { text, context } = payload;

  if (!text) {
    throw new Error('Text is required for sentiment analysis');
  }

  // Use LLM for sentiment analysis
  const llmService = getLlmService();
  const systemContext = `You are a sentiment analysis expert. Analyze the emotional tone and stress indicators in user text. Provide a sentiment score (-1 to 1), detected emotions, and stress level assessment.`;
  const analysisContext = `
Text to analyze: "${text}"
Additional context: ${JSON.stringify(context || {}, null, 2)}
  `.trim();

  const analysis = await llmService.generateContextualResponse(
    systemContext,
    'Analyze the sentiment and emotional state in this text. Return a JSON object with: sentiment (number -1 to 1), emotions (array), stressLevel (low/medium/high), and explanation (string).',
    analysisContext
  );

  // Try to parse LLM response as JSON, fallback to text analysis
  let sentimentData;
  try {
    sentimentData = JSON.parse(analysis);
  } catch {
    // Fallback: simple heuristic
    const stressKeywords = ['urgent', 'deadline', 'pressure', 'overwhelmed', 'stressed'];
    const positiveKeywords = ['great', 'excellent', 'happy', 'good', 'wonderful'];
    const negativeKeywords = ['bad', 'terrible', 'awful', 'frustrated', 'angry'];

    const lowerText = text.toLowerCase();
    const hasStress = stressKeywords.some(kw => lowerText.includes(kw));
    const positiveCount = positiveKeywords.filter(kw => lowerText.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => lowerText.includes(kw)).length;

    sentimentData = {
      sentiment: (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1),
      emotions: hasStress ? ['stressed'] : ['neutral'],
      stressLevel: hasStress ? 'high' : 'low',
      explanation: analysis,
    };
  }


  // Record event if stress detected
  if (sentimentData.stressLevel === 'high' || sentimentData.stressLevel === 'medium') {
    palRepo.recordEvent({
      userId: ctx.userId,
      orgId: ctx.orgId,
      eventType: 'sentiment_analysis',
      payload: { text, sentiment: sentimentData },
      detectedStressLevel: sentimentData.stressLevel,
    });
  }

  return {
    ...sentimentData,
    timestamp: new Date().toISOString(),
  };
}


// Notes tool handlers
export async function notesListHandler(payload: any, ctx: McpContext): Promise<any> {
  const { source, compliance, retention, query, limit } = payload;

  const notes = notesRepo.getNotes(ctx.userId, ctx.orgId, {
    source,
    compliance,
    retention,
    query,
    limit: limit || 50,
  });

  const stats = notesRepo.getStatistics(ctx.userId, ctx.orgId);

  return {
    success: true,
    notes: notes.map(note => ({
      id: note.id,
      source: note.source,
      title: note.title,
      body: note.body,
      tags: note.tags.split(',').filter(t => t),
      owner: note.owner,
      compliance: note.compliance,
      retention: note.retention,
      riskScore: note.riskScore,
      attachments: note.attachments,
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    })),
    statistics: stats,
  };
}

export async function notesCreateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { source, title, body, tags, owner, compliance, retention, riskScore, attachments } = payload;

  if (!title || !body) {
    throw new Error('Title and body are required');
  }

  const noteId = notesRepo.createNote({
    userId: ctx.userId,
    orgId: ctx.orgId,
    source: source || 'Local Files',
    title,
    body,
    tags: Array.isArray(tags) ? tags.join(',') : tags || '',
    owner: owner || ctx.userId,
    compliance: compliance || 'clean',
    retention: retention || '90d',
    riskScore: riskScore || 0,
    attachments: attachments || 0,
  });

  return {
    success: true,
    id: noteId,
    message: 'Note created successfully',
  };
}

export async function notesUpdateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id, title, body, tags, source, compliance, retention, riskScore, attachments } = payload;

  if (!id) {
    throw new Error('Note ID is required');
  }

  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (body !== undefined) updates.body = body;
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.join(',') : tags;
  if (source !== undefined) updates.source = source;
  if (compliance !== undefined) updates.compliance = compliance;
  if (retention !== undefined) updates.retention = retention;
  if (riskScore !== undefined) updates.riskScore = riskScore;
  if (attachments !== undefined) updates.attachments = attachments;

  const success = notesRepo.updateNote(id, ctx.userId, ctx.orgId, updates);

  return {
    success,
    message: success ? 'Note updated successfully' : 'Note not found or update failed',
  };
}

export async function notesDeleteHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;

  if (!id) {
    throw new Error('Note ID is required');
  }

  const success = notesRepo.deleteNote(id, ctx.userId, ctx.orgId);

  return {
    success,
    message: success ? 'Note deleted successfully' : 'Note not found or delete failed',
  };
}

export async function notesGetHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;

  if (!id) {
    throw new Error('Note ID is required');
  }

  const note = notesRepo.getNoteById(id, ctx.userId, ctx.orgId);

  if (!note) {
    throw new Error('Note not found');
  }

  return {
    success: true,
    note: {
      id: note.id,
      source: note.source,
      title: note.title,
      body: note.body,
      tags: note.tags.split(',').filter(t => t),
      owner: note.owner,
      compliance: note.compliance,
      retention: note.retention,
      riskScore: note.riskScore,
      attachments: note.attachments,
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    },
  };
}

// Autonomous Cognitive Tools
export async function autonomousGraphRAGHandler(payload: any, ctx: McpContext): Promise<any> {
  const { query, maxHops } = payload;

  if (!query) {
    throw new Error('Query is required for GraphRAG');
  }

  const result = await unifiedGraphRAG.query(query, {
    userId: ctx.userId || 'anonymous',
    orgId: ctx.orgId || 'default'
  });

  return {
    success: true,
    result: {
      answer: result.answer,
      reasoning_path: result.reasoning_path,
      nodes: result.nodes,
      confidence: result.confidence
    },
    query,
    maxHops: maxHops || 2
  };
}

export async function autonomousStateGraphHandler(payload: any, ctx: McpContext): Promise<any> {
  const { taskId, input } = payload;

  if (!taskId || !input) {
    throw new Error('taskId and input are required for StateGraph');
  }

  const state = stateGraphRouter.initState(taskId, input);
  
  let currentState = state;
  let iterations = 0;
  const maxIterations = 20;

  while (currentState.status === 'active' && iterations < maxIterations) {
    currentState = await stateGraphRouter.route(currentState);
    iterations++;
  }

  return {
    success: true,
    state: {
      id: currentState.id,
      currentNode: currentState.currentNode,
      status: currentState.status,
      history: currentState.history,
      scratchpad: currentState.scratchpad
    },
    iterations,
    checkpoints: stateGraphRouter.getCheckpoints(taskId).map(cp => ({
      id: cp.id,
      timestamp: cp.timestamp,
      node: cp.state.currentNode
    }))
  };
}

export async function autonomousEvolutionHandler(payload: any, ctx: McpContext): Promise<any> {
  await patternEvolutionEngine.evolveStrategies();

  const currentStrategy = patternEvolutionEngine.getCurrentStrategy();
  const history = patternEvolutionEngine.getEvolutionHistory();

  return {
    success: true,
    currentStrategy,
    history: history.slice(0, 10),
    message: 'Evolution cycle completed'
  };
}

export async function autonomousAgentTeamHandler(payload: any, ctx: McpContext): Promise<any> {
  const { from, to, type, content, metadata } = payload;

  if (!content) {
    throw new Error('content is required for AgentTeam');
  }

  const message = {
    from: from || 'user',
    to: to || 'all',
    type: type || 'query',
    content,
    metadata: { ...metadata, userId: ctx.userId, orgId: ctx.orgId },
    timestamp: new Date()
  };

  const result = await agentTeam.routeMessage(message);

  return {
    success: true,
    result,
    message
  };
}

export async function autonomousAgentTeamCoordinateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { task, context } = payload;

  if (!task) {
    throw new Error('task is required for coordination');
  }

  const result = await agentTeam.coordinate(task, { ...context, userId: ctx.userId, orgId: ctx.orgId });

  return {
    success: true,
    result
  };
}

// Vidensarkiv (Knowledge Archive) MCP Tools - Persistent vector database for continuous learning
import { getChromaVectorStore } from '../../platform/vector/ChromaVectorStoreAdapter.js';
import type { VectorRecord, VectorQuery } from '../../platform/vector/types.js';

/**
 * Vidensarkiv Search - Widgets can search existing + new datasets
 * Supports semantic (vector) and keyword hybrid search
 */
export async function vidensarkivSearchHandler(payload: any, ctx: McpContext): Promise<any> {
  const { query, topK = 10, filters, namespace, includeExisting = true, includeNew = true } = payload;

  if (!query) {
    throw new Error('Query is required for vidensarkiv search');
  }

  const vectorStore = getChromaVectorStore();
  
  // Generate embedding for semantic search (will be done automatically)
  const searchQuery: VectorQuery = {
    embedding: [], // Will be generated from query text
    topK,
    filters,
    namespace: namespace || `${ctx.orgId}:${ctx.userId}`,
    keywords: query, // For hybrid search
    keywordWeight: 0.3, // 30% keyword, 70% semantic
    minScore: 0.3
  };

  const results = await vectorStore.search(searchQuery);

  // Filter by includeExisting/includeNew flags if metadata has datasetType
  const filteredResults = results.filter(result => {
    const datasetType = result.record.metadata.datasetType as string;
    if (datasetType === 'existing' && !includeExisting) return false;
    if (datasetType === 'new' && !includeNew) return false;
    return true;
  });

  return {
    success: true,
    query,
    results: filteredResults.map(r => ({
      id: r.record.id,
      content: r.record.content,
      score: r.score,
      metadata: r.record.metadata,
      source: r.record.metadata.source as string || 'vidensarkiv',
      datasetType: r.record.metadata.datasetType as string || 'unknown'
    })),
    count: filteredResults.length,
    totalAvailable: results.length
  };
}

/**
 * Vidensarkiv Add Dataset - Widgets can add new datasets to knowledge archive
 * Automatically generates embeddings and stores persistently
 */
export async function vidensarkivAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const { 
    content, 
    metadata = {}, 
    datasetId,
    datasetType = 'new', // 'existing' or 'new'
    namespace 
  } = payload;

  if (!content) {
    throw new Error('Content is required to add to vidensarkiv');
  }

  const vectorStore = getChromaVectorStore();
  
  // Create vector record
  const record: Omit<VectorRecord, 'createdAt' | 'updatedAt'> = {
    id: datasetId || `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    embedding: [], // Will be generated automatically
    metadata: {
      ...metadata,
      datasetType,
      source: metadata.source || 'widget',
      userId: ctx.userId,
      orgId: ctx.orgId,
      addedAt: new Date().toISOString(),
      widgetId: metadata.widgetId || 'unknown'
    },
    namespace: namespace || `${ctx.orgId}:${ctx.userId}`
  };

  const result = await vectorStore.upsert(record);

  // Log to ProjectMemory
  try {
    const { projectMemory } = await import('../services/project/ProjectMemory.js');
    projectMemory.logLifecycleEvent({
      eventType: 'feature',
      status: 'success',
      details: {
        component: 'Vidensarkiv',
        action: 'dataset_added',
        datasetId: result.id,
        datasetType,
        namespace: result.namespace,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.warn('Could not log to ProjectMemory:', err);
  }

  return {
    success: true,
    datasetId: result.id,
    message: 'Dataset added to vidensarkiv',
    namespace: result.namespace,
    embeddingGenerated: true
  };
}

/**
 * Vidensarkiv Batch Add - Add multiple datasets at once
 * Used for bulk ingestion from DataIngestionEngine
 */
export async function vidensarkivBatchAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const { datasets, namespace, datasetType = 'new' } = payload;

  if (!Array.isArray(datasets) || datasets.length === 0) {
    throw new Error('Datasets array is required');
  }

  const vectorStore = getChromaVectorStore();
  
  const records: Omit<VectorRecord, 'createdAt' | 'updatedAt'>[] = datasets.map((dataset: any, idx: number) => ({
    id: dataset.id || `dataset-${Date.now()}-${idx}`,
    content: typeof dataset.content === 'string' ? dataset.content : JSON.stringify(dataset.content),
    embedding: [],
    metadata: {
      ...dataset.metadata,
      datasetType,
      source: dataset.metadata?.source || 'batch',
      userId: ctx.userId,
      orgId: ctx.orgId,
      addedAt: new Date().toISOString()
    },
    namespace: namespace || dataset.namespace || `${ctx.orgId}:${ctx.userId}`
  }));

  const results = await vectorStore.batchUpsert({
    records,
    namespace: namespace || `${ctx.orgId}:${ctx.userId}`
  });

  return {
    success: true,
    added: results.length,
    datasets: results.map(r => ({
      id: r.id,
      namespace: r.namespace
    }))
  };
}

/**
 * Vidensarkiv Get Related - Find related datasets based on current dataset
 * Used by widgets to discover related information
 */
export async function vidensarkivGetRelatedHandler(payload: any, ctx: McpContext): Promise<any> {
  const { datasetId, topK = 5, namespace } = payload;

  if (!datasetId) {
    throw new Error('datasetId is required');
  }

  const vectorStore = getChromaVectorStore();
  
  // Get the dataset
  const dataset = await vectorStore.getById(datasetId, namespace);
  if (!dataset) {
    throw new Error(`Dataset ${datasetId} not found`);
  }

  // Search for similar datasets
  const results = await vectorStore.search({
    embedding: dataset.embedding,
    topK: topK + 1, // +1 to exclude the original
    namespace,
    minScore: 0.5
  });

  // Filter out the original dataset
  const related = results
    .filter(r => r.record.id !== datasetId)
    .slice(0, topK);

  return {
    success: true,
    datasetId,
    related: related.map(r => ({
      id: r.record.id,
      content: r.record.content?.substring(0, 200),
      score: r.score,
      metadata: r.record.metadata,
      relation: r.score > 0.8 ? 'highly_related' : r.score > 0.6 ? 'related' : 'somewhat_related'
    })),
    count: related.length
  };
}

/**
 * Vidensarkiv List Datasets - List all datasets in namespace
 * Widgets can discover available datasets (both existing and new)
 */
export async function vidensarkivListHandler(payload: any, ctx: McpContext): Promise<any> {
  const { namespace, limit = 50, offset = 0, filters, datasetType } = payload;

  const vectorStore = getChromaVectorStore();
  
  const targetNamespace = namespace || `${ctx.orgId}:${ctx.userId}`;
  
  // Build filters
  const searchFilters = filters || [];
  if (datasetType) {
    searchFilters.push({
      field: 'datasetType',
      operator: 'eq',
      value: datasetType
    });
  }

  // Search with high topK to get all, then paginate
  const allResults = await vectorStore.search({
    embedding: new Array(384).fill(0), // Dummy embedding for metadata-only search
    topK: 1000,
    namespace: targetNamespace,
    filters: searchFilters.length > 0 ? searchFilters : undefined,
    minScore: 0 // Accept all for listing
  });

  const paginated = allResults.slice(offset, offset + limit);

  return {
    success: true,
    datasets: paginated.map(r => ({
      id: r.record.id,
      content: r.record.content?.substring(0, 150),
      metadata: r.record.metadata,
      datasetType: r.record.metadata.datasetType as string || 'unknown',
      createdAt: r.record.createdAt,
      source: r.record.metadata.source as string || 'vidensarkiv'
    })),
    pagination: {
      total: allResults.length,
      limit,
      offset,
      hasMore: offset + limit < allResults.length
    },
    namespace: targetNamespace
  };
}

/**
 * Vidensarkiv Statistics - Get knowledge archive statistics
 * Widgets can check archive health and size
 */
export async function vidensarkivStatsHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getChromaVectorStore();
  
  const stats = await vectorStore.getStatistics();
  const namespaces = await vectorStore.listNamespaces();
  const isHealthy = await vectorStore.healthCheck();

  return {
    success: true,
    statistics: {
      totalDatasets: stats.totalRecords,
      namespaces: namespaces.length,
      byNamespace: stats.byNamespace,
      estimatedSizeMB: (stats.estimatedSize / 1024 / 1024).toFixed(2),
      vectorDimension: stats.vectorDimension
    },
    health: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      collection: 'vidensarkiv'
    }
  };
}
