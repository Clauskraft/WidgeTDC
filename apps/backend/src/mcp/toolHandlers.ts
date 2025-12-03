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
import { unifiedMemorySystem } from './cognitive/UnifiedMemorySystem.js';
import { getNeo4jVectorStore } from '../platform/vector/Neo4jVectorStoreAdapter.js';
import { logger } from '../utils/logger.js';
import { hyperLog } from '../services/hyper-log.js';

// Vector types for Neo4jVectorStoreAdapter
type VectorRecord = {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  namespace?: string;
};
type VectorQuery = {
  vector?: number[];
  text?: string;
  limit?: number;
  filter?: Record<string, any>;
  namespace?: string;
};
import { projectMemory } from '../services/project/ProjectMemory.js';
import { getTaskRecorder } from './cognitive/TaskRecorder.js';
import { eventBus } from './EventBus.js';

const memoryRepo = new MemoryRepository();
const sragRepo = new SragRepository();
const evolutionRepo = new EvolutionRepository();
const palRepo = new PalRepository();
const notesRepo = new NotesRepository();

// CMA tool handlers
export async function cmaContextHandler(payload: any, _ctx: McpContext): Promise<any> {
  const ctx = _ctx;
  const memories = await memoryRepo.searchEntities({
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
    additionalContext,
    payload.model
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
  const entityId = await memoryRepo.ingestEntity({
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

  const entityId = await memoryRepo.ingestEntity({
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

  const memories = await memoryRepo.searchEntities({
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
// SRAG tool handlers
export async function sragQueryHandler(payload: any, ctx: McpContext): Promise<any> {
  console.log('🔍 sragQueryHandler called with:', JSON.stringify(payload));
  try {
    const rawQuery = payload.query || payload.naturalLanguageQuery || '';
    const query = rawQuery.toLowerCase();
    const model = payload.model;

    // Log thought process
    hyperLog.log('THOUGHT', 'NeuralCore', `Analyserer forespørgsel: "${rawQuery}"`, { model });

    const sqlKeywords = ['sum', 'count', 'average', 'total', 'group by', 'where'];
    const isAnalytical = sqlKeywords.some(keyword => query.includes(keyword));

    // SELF AWARENESS INJECTION
    const metrics = hyperLog.getMetrics();
    const selfAwareness = `
[SYSTEM SELF-AWARENESS]
- Active Agents: ${metrics.activeAgents}
- Thoughts Processed: ${metrics.totalThoughts}
- Intelligence Tool Usage: ${(Number(metrics.toolUsageRate) * 100).toFixed(1)}%
- Platform Status: ONLINE
`;

    if (isAnalytical) {
      console.log('📊 Processing as analytical query');
      const facts = await sragRepo.queryFacts(ctx.orgId);

      // Generate LLM response for analytical query
      const llmService = getLlmService();
      const systemContext = `You are a data analyst. Analyze the structured facts and provide insights based on the user's analytical query.\n${selfAwareness}`;
      const factsContext = `Available facts:\n${JSON.stringify(facts, null, 2)}`;

      console.log('🤖 Calling LLM for analytical response...');
      const aiResponse = await llmService.generateContextualResponse(
        systemContext,
        rawQuery,
        factsContext,
        model
      );
      console.log('✅ LLM response received');

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
      console.log('📚 Processing as semantic query');
      const keywords = query.split(' ').filter((w: string) => w.length > 3);
      const documents = keywords.length > 0
        ? await sragRepo.searchDocuments(ctx.orgId, keywords[0])
        : [];

      console.log(`📄 Found ${documents.length} documents`);

      // Generate LLM response for semantic query
      const llmService = getLlmService();
      const systemContext = `You are DOT AI, a document search assistant. Provide a summary and insights from the retrieved documents.\n${selfAwareness}`;
      const docsContext = `Retrieved documents:\n${JSON.stringify(documents, null, 2)}`;

      console.log('🤖 Calling LLM for semantic response...');
      const aiResponse = await llmService.generateContextualResponse(
        systemContext,
        rawQuery,
        docsContext,
        model
      );
      console.log('✅ LLM response received');

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
  } catch (error) {
    console.error('❌ Error in sragQueryHandler:', error);
    throw error;
  }
}

export async function sragGovernanceCheckHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { docId } = payload;
  const doc = await sragRepo.getDocumentById(parseInt(docId, 10));

  if (!doc) {
    return { compliant: false, reason: 'Document not found' };
  }

  // Simple governance check
  const hasMetadata = doc.metadata && Object.keys(doc.metadata as object).length > 0;
  const hasClassification = doc.classification && doc.classification.length > 0;

  return {
    compliant: hasMetadata && hasClassification,
    hasMetadata,
    hasClassification,
    docId,
  };
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
    metricsContext,
    payload.model
  );

  return {
    runId,
    averageKpiDelta: avgDelta,
    needsRefinement: avgDelta < 0,
    aiAnalysis,
  };
}

export async function evolutionGetPromptHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { agentId } = payload;
  const prompt = evolutionRepo.getLatestPrompt(agentId);
  return { prompt };
}

export async function evolutionAnalyzePromptsHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { agentId } = payload;
  const prompts = evolutionRepo.getAllPrompts(agentId).slice(0, 10);

  // Generate LLM analysis
  const llmService = getLlmService();
  const systemContext = `You are a prompt engineering expert. Analyze prompt evolution and suggest improvements.`;
  const promptsContext = `Prompt History:\n${JSON.stringify(prompts, null, 2)}`;
  const aiAnalysis = await llmService.generateContextualResponse(
    systemContext,
    'Analyze prompt evolution and suggest improvements',
    promptsContext,
    payload.model
  );

  return {
    prompts,
    aiAnalysis,
  };
}

// PAL tool handlers
export async function palEventHandler(payload: any, ctx: McpContext): Promise<any> {
  const { eventType, detectedStressLevel, payload: eventPayload } = payload;
  await palRepo.recordEvent({
    orgId: ctx.orgId,
    userId: ctx.userId,
    eventType,
    detectedStressLevel,
    payload: eventPayload,
  });

  return { success: true };
}

export async function palBoardActionHandler(payload: any, ctx: McpContext): Promise<any> {
  const { actionType, widgetId } = payload;
  // Record board action as a PAL event
  await palRepo.recordEvent({
    userId: ctx.userId,
    orgId: ctx.orgId,
    eventType: 'board_action',
    payload: { actionType, widgetId }
  });

  return { success: true };
}

export async function palOptimizeWorkflowHandler(payload: any, ctx: McpContext): Promise<any> {
  // Get focus windows as workflow recommendations
  const focusWindows = await palRepo.getFocusWindows(ctx.userId, ctx.orgId);
  const recommendations = focusWindows.map(fw => ({
    day: fw.weekday,
    startHour: fw.start_hour,
    endHour: fw.end_hour,
    type: 'focus_window'
  }));
  return { recommendations };
}

export async function palAnalyzeSentimentHandler(payload: any, ctx: McpContext): Promise<any> {
  const { text } = payload;
  // Simple sentiment analysis - in production would use NLP library
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'sad', 'angry'];
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  return { sentiment, score: positiveCount - negativeCount };
}

// Notes tool handlers
export async function notesListHandler(payload: any, ctx: McpContext): Promise<any> {
  const notes = notesRepo.getNotes(ctx.userId, ctx.orgId);
  return { notes };
}

export async function notesCreateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { title, content, tags } = payload;
  const noteId = notesRepo.createNote({
    orgId: ctx.orgId,
    userId: ctx.userId,
    source: 'manual',
    title,
    body: content || '',
    tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
    owner: ctx.userId,
    compliance: 'clean',
    retention: '90d',
    riskScore: 0,
    attachments: 0
  });
  return { id: noteId };
}

export async function notesUpdateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id, title, content, tags } = payload;
  notesRepo.updateNote(parseInt(id, 10), ctx.userId, ctx.orgId, {
    title,
    body: content,
    tags: Array.isArray(tags) ? tags.join(',') : tags
  });
  return { success: true };
}

export async function notesDeleteHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;
  notesRepo.deleteNote(parseInt(id, 10), ctx.userId, ctx.orgId);
  return { success: true };
}

export async function notesGetHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;
  const note = notesRepo.getNoteById(parseInt(id, 10), ctx.userId, ctx.orgId);
  return { note };
}

// Autonomous tool handlers
export async function autonomousGraphRAGHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { query, maxHops = 3 } = payload;
  const result = await unifiedGraphRAG.query(query, maxHops);
  return result;
}

export async function autonomousStateGraphHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { taskId, input } = payload;
  // Initialize state and route through graph
  const state = stateGraphRouter.initState(taskId || `task-${Date.now()}`, input || 'default task');
  const result = await stateGraphRouter.route(state);
  return result;
}

export async function autonomousEvolutionHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { _strategy, _context } = payload;
  // Evolve all strategies (no single-strategy evolution method)
  await patternEvolutionEngine.evolveStrategies();
  return { success: true, message: 'Strategies evolved' };
}

export async function autonomousAgentTeamHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { task, context } = payload;
  // Use coordinate method to handle tasks
  const result = await agentTeam.coordinate(task, context);
  return result;
}

export async function autonomousAgentTeamCoordinateHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { task, context } = payload;
  const result = await agentTeam.coordinate(task, context);
  return result;
}

// Vidensarkiv (PgVector) tool handlers
export async function vidensarkivSearchHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();
  const { query, limit = 10, namespace } = payload;

  const results = await vectorStore.search({
    text: query,
    limit,
    namespace: namespace || ctx.orgId,
  });

  return {
    success: true,
    results: results.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.similarity,
    })),
    count: results.length,
  };
}

export async function vidensarkivAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();
  const { content, metadata = {}, namespace } = payload;

  // Create record - PgVector will auto-generate embeddings
  const recordToUpsert: VectorRecord = {
    id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    metadata: {
      ...metadata,
      orgId: ctx.orgId,
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
      namespace: namespace || ctx.orgId, // Include namespace in metadata
    },
    namespace: namespace || ctx.orgId,
  };

  await vectorStore.upsert(recordToUpsert);

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'vidensarkiv',
      action: 'add',
      recordId: recordToUpsert.id,
      namespace: recordToUpsert.namespace,
    },
  });

  return {
    success: true,
    id: recordToUpsert.id,
    message: 'Knowledge added to archive',
  };
}

export async function vidensarkivBatchAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();
  const { records, namespace } = payload;

  const vectorRecords: VectorRecord[] = records.map((r: any, idx: number) => ({
    id: r.id || `vid-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    content: r.content,
    metadata: {
      ...r.metadata,
      orgId: ctx.orgId,
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
      namespace: namespace || ctx.orgId, // Include namespace in metadata
    },
    namespace: namespace || ctx.orgId,
  }));

  await vectorStore.batchUpsert({ records: vectorRecords, namespace: namespace || ctx.orgId });

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'vidensarkiv',
      action: 'batch_add',
      count: vectorRecords.length,
      namespace: namespace || ctx.orgId,
    },
  });

  return {
    success: true,
    count: vectorRecords.length,
    message: `Added ${vectorRecords.length} records to archive`,
  };
}

export async function vidensarkivGetRelatedHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();
  const { id, content, limit = 5, namespace } = payload;

  // Support both id-based and content-based search for backward compatibility
  let searchText: string;
  let usedFallback = false;

  // Bug 2 Fix: Track whether we actually used fallback
  if (content) {
    // Content provided - use it directly (convert to string for safety)
    searchText = String(content);
  } else if (id) {
    // Only id provided - fallback to using id as search text
    searchText = String(id);
    usedFallback = true;
    logger.warn(`vidensarkiv.get_related: Using id "${id}" as search text. For better results, provide "content" parameter.`);
  } else {
    throw new Error('Either "content" or "id" is required for finding related records');
  }

  const related = await vectorStore.search({
    text: searchText,
    limit,
    namespace: namespace || ctx.orgId,
  });

  // Bug 1 Fix: Ensure searchText is string before substring
  const searchPreview = searchText.length > 50 ? searchText.substring(0, 50) + '...' : searchText;

  return {
    success: true,
    searchedFor: usedFallback
      ? { id, fallbackToTextSearch: true }
      : { content: searchPreview },
    related: related.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.similarity,
    })),
  };
}

export async function vidensarkivListHandler(payload: any, _ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();
  const { namespace } = payload;

  const stats = await vectorStore.getStatistics();
  const filtered = namespace ? stats.namespaces.filter(n => n === namespace) : stats.namespaces;

  return {
    success: true,
    namespaces: filtered,
    count: filtered.length,
  };
}

export async function vidensarkivStatsHandler(_payload: any, _ctx: McpContext): Promise<any> {
  const vectorStore = getNeo4jVectorStore();

  const stats = await vectorStore.getStatistics();

  return {
    success: true,
    statistics: {
      totalRecords: stats.totalRecords,
      namespaces: stats.namespaces.length,
      namespaceList: stats.namespaces
    },
    health: {
      status: 'healthy',
      collection: 'vidensarkiv'
    }
  };
}

// TaskRecorder MCP Tools - Observes tasks, learns patterns, suggests automation (requires approval)
/**
 * TaskRecorder: Get pending automation suggestions
 * Returns suggestions that require user approval
 */
export async function taskRecorderGetSuggestionsHandler(_payload: any, _ctx: McpContext): Promise<any> {
  const recorder = getTaskRecorder();
  const suggestions = recorder.getPendingSuggestions();

  return {
    success: true,
    suggestions: suggestions.map(s => ({
      id: s.id,
      taskType: s.taskType,
      suggestedAction: s.suggestedAction,
      confidence: s.confidence,
      observedCount: s.observedCount,
      estimatedBenefit: s.estimatedBenefit,
      requiresApproval: s.requiresApproval,
      createdAt: s.createdAt
    })),
    count: suggestions.length
  };
}

/**
 * TaskRecorder: Approve automation suggestion
 * CRITICAL: This is the ONLY way to approve automation
 */
export async function taskRecorderApproveHandler(payload: any, ctx: McpContext): Promise<any> {
  const { suggestionId } = payload;

  if (!suggestionId) {
    throw new Error('suggestionId is required');
  }

  const recorder = getTaskRecorder();
  await recorder.approveSuggestion(suggestionId, ctx.userId);

  return {
    success: true,
    message: 'Automation suggestion approved',
    suggestionId,
    approvedBy: ctx.userId,
    note: 'Task can now be executed, but still requires approval for each execution'
  };
}

/**
 * TaskRecorder: Reject automation suggestion
 */
export async function taskRecorderRejectHandler(payload: any, ctx: McpContext): Promise<any> {
  const { suggestionId } = payload;

  if (!suggestionId) {
    throw new Error('suggestionId is required');
  }

  const recorder = getTaskRecorder();
  await recorder.rejectSuggestion(suggestionId, ctx.userId);

  return {
    success: true,
    message: 'Automation suggestion rejected',
    suggestionId,
    rejectedBy: ctx.userId
  };
}

/**
 * TaskRecorder: Request task execution (requires approval)
 * CRITICAL: This checks approval status - never executes without approval
 */
export async function taskRecorderExecuteHandler(payload: any, ctx: McpContext): Promise<any> {
  const { suggestionId, taskSignature, taskType, params } = payload;

  if (!suggestionId || !taskSignature || !taskType) {
    throw new Error('suggestionId, taskSignature, and taskType are required');
  }

  const recorder = getTaskRecorder();

  // Request execution (will check approval status)
  const result = await recorder.requestTaskExecution({
    suggestionId,
    taskSignature,
    taskType,
    params: params || {},
    requestedBy: ctx.userId,
    requiresApproval: true // ALWAYS true for real tasks
  });

  if (!result.approved) {
    return {
      success: false,
      approved: false,
      message: 'Task execution requires approval. Please approve the suggestion first.',
      suggestionId
    };
  }

  return {
    success: true,
    approved: true,
    executionId: result.executionId,
    message: 'Task execution started (with approval)',
    note: 'Task is being executed as approved automation'
  };
}

/**
 * TaskRecorder: Get task patterns
 * Shows learned patterns and their frequencies
 */
export async function taskRecorderGetPatternsHandler(_payload: any, _ctx: McpContext): Promise<any> {
  const recorder = getTaskRecorder();
  const patterns = recorder.getAllPatterns();

  return {
    success: true,
    patterns: patterns.map(p => ({
      taskSignature: p.taskSignature,
      taskType: p.taskType,
      frequency: p.frequency,
      successRate: p.successRate,
      averageDuration: p.averageDuration,
      firstSeen: p.firstSeen,
      lastSeen: p.lastSeen,
      hasSuggestion: !!p.suggestedAutomation,
      suggestionStatus: p.suggestedAutomation?.status
    })),
    count: patterns.length
  };
}

// ---------------------------------------------------
// Widget Invocation Handlers - For autonomous widgets
// ---------------------------------------------------

/**
 * widgets.invoke - Invoke a widget's autonomous action
 */
export async function widgetsInvokeHandler(payload: any, ctx: McpContext): Promise<any> {
  const { widgetId, action, params } = payload;

  if (!widgetId || !action) {
    throw new Error('widgetId and action are required');
  }

  // Emit event for widget invocation
  eventBus.emit('widget:invoke', {
    widgetId,
    action,
    params,
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date().toISOString()
  });

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'widgets',
      action: 'invoke',
      widgetId,
      widgetAction: action
    }
  });

  return {
    success: true,
    widgetId,
    action,
    message: `Widget ${widgetId} action ${action} invoked`,
    eventId: `widget-${Date.now()}`
  };
}

/**
 * widgets.osint.investigate - Start OSINT email investigation
 */
export async function widgetsOsintInvestigateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { email, depth = 'full', threads = 10 } = payload;

  if (!email) {
    throw new Error('email is required for OSINT investigation');
  }

  // Initialize investigation
  const investigationId = `osint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record task for TaskRecorder learning
  const recorder = getTaskRecorder();
  await recorder.observeTask({
    taskType: 'osint.email.investigate',
    taskSignature: `osint:email:${email.split('@')[1]}`,
    params: { email, depth, threads },
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date(),
    success: true
  });

  // Emit investigation start event
  eventBus.emit('osint:investigation:start', {
    investigationId,
    email,
    depth,
    threads,
    userId: ctx.userId
  });

  return {
    success: true,
    investigationId,
    email,
    depth,
    threads,
    status: 'started',
    message: 'OSINT investigation initiated'
  };
}

/**
 * widgets.threat.hunt - Start threat hunting investigation
 */
export async function widgetsThreatHuntHandler(payload: any, ctx: McpContext): Promise<any> {
  const { target, category = 'all', autoRespond = false } = payload;

  if (!target) {
    throw new Error('target is required for threat hunting');
  }

  const huntId = `hunt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record task for learning
  const recorder = getTaskRecorder();
  await recorder.observeTask({
    taskType: 'threat.hunt',
    taskSignature: `threat:hunt:${category}`,
    params: { target, type: category, duration: 0 }, // Assuming 'type' and 'duration' are placeholders or derived from 'category'
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date(),
    success: true
  });

  // Emit hunt start event
  eventBus.emit('threat:hunt:start', {
    huntId,
    target,
    category,
    autoRespond,
    userId: ctx.userId
  });

  return {
    success: true,
    huntId,
    target,
    category,
    autoRespond,
    status: 'started',
    message: 'Threat hunt initiated'
  };
}

/**
 * widgets.orchestrator.coordinate - Start coordinated investigation
 */
export async function widgetsOrchestratorCoordinateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { target, type = 'combined', phases } = payload;

  if (!target) {
    throw new Error('target is required for orchestration');
  }

  const orchestrationId = `orch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Use AgentTeam for coordination
  const coordinationResult = await agentTeam.coordinate(
    `investigate:${type}:${target}`,
    { target, type, phases, userId: ctx.userId }
  );

  // Emit orchestration event
  eventBus.emit('orchestrator:coordinate:start', {
    orchestrationId,
    target,
    type,
    phases,
    userId: ctx.userId
  });

  return {
    success: true,
    orchestrationId,
    target,
    type,
    status: 'coordinating',
    coordinationResult,
    message: 'Orchestration started'
  };
}

// ---------------------------------------------------
// Document Generator Handlers - PowerPoint, Word, Excel
// ---------------------------------------------------

/**
 * docgen.powerpoint.create - Create PowerPoint presentation
 */
export async function docgenPowerpointCreateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { title, topic, audience, duration = 15, theme = 'corporate', includeImages = true } = payload;

  if (!title || !topic) {
    throw new Error('title and topic are required');
  }

  const presentationId = `pptx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record task for learning
  const recorder = getTaskRecorder();
  await recorder.observeTask({
    taskType: 'docgen.powerpoint.create',
    taskSignature: `pptx:${theme}:${duration}min`,
    params: { title, topic, audience },
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date(),
    success: true
  });

  // Emit generation event
  eventBus.emit('docgen:powerpoint:create', {
    presentationId,
    title,
    topic,
    audience,
    duration,
    theme,
    includeImages,
    userId: ctx.userId
  });

  return {
    success: true,
    presentationId,
    title,
    topic,
    estimatedSlides: Math.ceil(duration * 1.5),
    status: 'generating',
    message: 'PowerPoint generation started'
  };
}

/**
 * docgen.word.create - Create Word document
 */
export async function docgenWordCreateHandler(payload: any, ctx: McpContext): Promise<any> {
  const {
    title,
    type = 'report',
    topic,
    targetWordCount = 3000,
    includeExecutiveSummary = true,
    tone = 'professional'
  } = payload;

  if (!title || !topic) {
    throw new Error('title and topic are required');
  }

  const documentId = `docx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record task for learning
  const recorder = getTaskRecorder();
  await recorder.observeTask({
    taskType: 'docgen.word.create',
    taskSignature: `docx:${type}:${tone}`,
    params: { title, topic, type },
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date(),
    success: true
  });

  // Emit generation event
  eventBus.emit('docgen:word:create', {
    documentId,
    title,
    type,
    topic,
    targetWordCount,
    includeExecutiveSummary,
    tone,
    userId: ctx.userId
  });

  return {
    success: true,
    documentId,
    title,
    type,
    topic,
    estimatedSections: type === 'report' ? 8 : 6,
    status: 'generating',
    message: 'Word document generation started'
  };
}

/**
 * docgen.excel.create - Create Excel workbook
 */
export async function docgenExcelCreateHandler(payload: any, ctx: McpContext): Promise<any> {
  const {
    title,
    analysisType = 'financial',
    dataSource,
    includeCharts = true,
    includeFormulas = true,
    includeDashboard = true
  } = payload;

  if (!title) {
    throw new Error('title is required');
  }

  const workbookId = `xlsx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record task for learning
  const recorder = getTaskRecorder();
  await recorder.observeTask({
    taskType: 'docgen.excel.create',
    taskSignature: `xlsx:${analysisType}`,
    params: { title, analysisType, dataSource, includeCharts },
    userId: ctx.userId,
    orgId: ctx.orgId,
    timestamp: new Date(),
    success: true
  });

  // Emit generation event
  eventBus.emit('docgen:excel:create', {
    workbookId,
    title,
    analysisType,
    dataSource,
    includeCharts,
    includeFormulas,
    includeDashboard,
    userId: ctx.userId
  });

  return {
    success: true,
    workbookId,
    title,
    analysisType,
    estimatedSheets: includeDashboard ? 5 : 4,
    status: 'generating',
    message: 'Excel workbook generation started'
  };
}

/**
 * docgen.status - Get document generation status
 */
export async function docgenStatusHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { documentId } = payload;

  if (!documentId) {
    throw new Error('documentId is required');
  }

  // In production, this would check actual generation status
  // For now, return mock status
  const type = documentId.startsWith('pptx') ? 'powerpoint' :
    documentId.startsWith('docx') ? 'word' : 'excel';

  return {
    success: true,
    documentId,
    type,
    status: 'completed',
    progress: 100,
    filePath: `/documents/${documentId}.${type === 'powerpoint' ? 'pptx' : type === 'word' ? 'docx' : 'xlsx'}`
  };
}

// ---------------------------------------------------
// Email RAG Handler – wraps autonomousGraphRAG for email content
// ---------------------------------------------------
export async function emailRagHandler(payload: any, ctx: McpContext): Promise<any> {
  // Expected payload: { email: { subject: string, body: string } }
  const { email } = payload;
  if (!email?.body) {
    throw new Error('Email body is required for RAG');
  }
  // Reuse the existing Graph RAG handler logic
  const result = await autonomousGraphRAGHandler({ query: email.body, topK: 5 }, ctx);
  return result;
}

// ---------------------------------------------------
// Agentic Workflow Execution Handler
// Uses MCP registry directly instead of external adapter
// ---------------------------------------------------
export async function agenticRunHandler(payload: any, ctx: McpContext): Promise<any> {
  // Expected payload: { workflow: { nodes: [], edges: [] } }
  if (!payload?.workflow) {
    throw new Error('Missing workflow definition');
  }

  // Simple execution: run the first tool node in the workflow via MCP
  const firstTool = payload.workflow.nodes.find((n: any) => n.type === 'tool');
  if (!firstTool) {
    throw new Error('No tool node found in workflow');
  }

  // Route through MCP registry
  const { mcpRegistry } = await import('./mcpRegistry.js');
  const result = await mcpRegistry.route({
    id: `agentic-${Date.now()}`,
    sourceId: 'agentic-handler',
    targetId: firstTool.name,
    tool: firstTool.name,
    payload: {
      ...(firstTool.payload || {}),
      orgId: ctx.orgId,
      userId: ctx.userId
    },
    createdAt: new Date().toISOString()
  });

  // Log execution for audit (project memory)
  const { projectMemory } = await import('../services/project/ProjectMemory.js');
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      action: 'agentic.run',
      tool: firstTool.name,
      result
    },
  });

  return { result };
}

// ---------------------------------------------------
// Widget State Update Handler (Nervebanen til hjernen)
// ---------------------------------------------------
export async function widgetsUpdateStateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { widgetId, state } = payload;
  
  if (!widgetId) {
    throw new Error('widgetId required');
  }

  // Send data direkte til UnifiedMemory
  await unifiedMemorySystem.updateWidgetState(ctx, widgetId, state);

  // Log to HyperLog (Neural Stream)
  hyperLog.log('THOUGHT', 'Cortex', `Synkroniserer ${widgetId}`, { stateKeys: Object.keys(state) });

  return { success: true };
}

// ---------------------------------------------------
// Audio Transcription Handler
// ---------------------------------------------------
export async function widgetsAudioTranscribeHandler(payload: any, ctx: McpContext): Promise<any> {
  const { audioData, mimeType } = payload;

  if (!audioData || !mimeType) {
    throw new Error('audioData (base64) and mimeType are required');
  }

  const llmService = getLlmService();
  // This will fail if Google API key is missing, which is expected for now
  const transcription = await llmService.transcribeAudio(audioData, mimeType);

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'audio-transcriber',
      action: 'transcribe',
      userId: ctx.userId
    }
  });

  return {
    success: true,
    transcription
  };
}

// ---------------------------------------------------
// Image Analysis Handler
// ---------------------------------------------------
export async function widgetsImageAnalyzeHandler(payload: any, ctx: McpContext): Promise<any> {
  const { imageData, mimeType, prompt } = payload;

  if (!imageData || !mimeType) {
    throw new Error('imageData (base64) and mimeType are required');
  }

  const llmService = getLlmService();
  const analysis = await llmService.analyzeImage(imageData, mimeType, prompt || "Describe this image");

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'image-analyzer',
      action: 'analyze',
      userId: ctx.userId
    }
  });

  return {
    success: true,
    analysis
  };
}

// ---------------------------------------------------
// Visionary Diagram Generator Handler
// ---------------------------------------------------
export async function visionaryGenerateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { prompt, diagramType, memories } = payload;

  if (!prompt) {
    throw new Error('Prompt is required for diagram generation');
  }

  const llmService = getLlmService();
  
  const systemContext = `
You are The Visionary, an expert system architect and visualization specialist.
Your goal is to generate valid Mermaid.js diagram code based on user requests.

RULES:
1. Return ONLY the raw Mermaid.js code. Do not use markdown code blocks (no \`\`\`mermaid).
2. Ensure syntax is strictly valid for the requested diagram type.
3. Use the "dark" theme compatible styling (e.g., avoid light colors on light backgrounds if possible, but Mermaid handles themes mostly).
4. Be concise but comprehensive.
5. If the user provides "memories", incorporate those preferences or patterns.

Supported Types: flowchart, sequence, class, state, erDiagram, gantt, pie, mindmap
Requested Type: ${diagramType || 'flowchart'}
  `.trim();

  const userPrompt = `
Request: ${prompt}

Context/Memories:
${(memories || []).join('\n')}
  `.trim();

  // Use a model capable of code generation (e.g., Gemini Pro or GPT-4)
  // We'll let the service pick the default if not specified
  const mermaidCode = await llmService.generateContextualResponse(
    systemContext,
    userPrompt,
    "Generate the Mermaid.js code now.",
    payload.model
  );

  // Clean up potential markdown formatting if the LLM adds it despite instructions
  const cleanCode = mermaidCode
    .replace(/```mermaid/g, '')
    .replace(/```/g, '')
    .trim();

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'visionary',
      action: 'generate',
      diagramType: diagramType || 'flowchart',
      userId: ctx.userId
    }
  });

  return {
    success: true,
    code: cleanCode,
    diagramType: diagramType || 'flowchart'
  };
}
