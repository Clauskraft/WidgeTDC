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
import { getChromaVectorStore } from '../platform/vector/ChromaVectorStoreAdapter.js';
// Vector types are imported from ChromaVectorStoreAdapter's types
// Using inline types to avoid path issues
type VectorRecord = {
    id: string;
    embedding: number[];
    content?: string;
    metadata: Record<string, any>;
    namespace?: string;
    createdAt: Date;
    updatedAt: Date;
};
type VectorQuery = {
    embedding: number[];
    topK: number;
    namespace?: string;
    filters?: any[];
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

export async function sragGovernanceCheckHandler(payload: any, ctx: McpContext): Promise<any> {
  const { docId } = payload;
  const doc = sragRepo.getDocumentById(parseInt(docId, 10));
  
  if (!doc) {
    return { compliant: false, reason: 'Document not found' };
  }

  // Simple governance check
  const hasMetadata = doc.metadata && Object.keys(doc.metadata).length > 0;
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
    metricsContext
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
    promptsContext
  );

  return {
    prompts,
    aiAnalysis,
  };
}

// PAL tool handlers
export async function palEventHandler(payload: any, ctx: McpContext): Promise<any> {
  const { eventType, detectedStressLevel, payload: eventPayload } = payload;
  palRepo.recordEvent({
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
  palRepo.recordEvent({
    userId: ctx.userId,
    orgId: ctx.orgId,
    eventType: 'board_action',
    payload: { actionType, widgetId }
  });

  return { success: true };
}

export async function palOptimizeWorkflowHandler(payload: any, ctx: McpContext): Promise<any> {
  // Get focus windows as workflow recommendations
  const focusWindows = palRepo.getFocusWindows(ctx.userId, ctx.orgId);
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
    attachments: 0
  });
  return { id: noteId };
}

export async function notesUpdateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id, title, content, tags } = payload;
  notesRepo.updateNote(id, { title, content, tags });
  return { success: true };
}

export async function notesDeleteHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;
  notesRepo.deleteNote(id);
  return { success: true };
}

export async function notesGetHandler(payload: any, ctx: McpContext): Promise<any> {
  const { id } = payload;
  const note = notesRepo.getNote(id);
  return { note };
}

// Autonomous tool handlers
export async function autonomousGraphRAGHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { query, maxHops = 3 } = payload;
  const result = await unifiedGraphRAG.query(query, maxHops);
  return result;
}

export async function autonomousStateGraphHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { initialState, goal } = payload;
  const result = await stateGraphRouter.route(initialState, goal);
  return result;
}

export async function autonomousEvolutionHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { strategy, context } = payload;
  const result = await patternEvolutionEngine.evolveStrategy(strategy, context);
  return result;
}

export async function autonomousAgentTeamHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { task, role } = payload;
  const result = await agentTeam.assignTask(task, role);
  return result;
}

export async function autonomousAgentTeamCoordinateHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { task } = payload;
  const result = await agentTeam.coordinateTask(task);
  return result;
}

// Vidensarkiv (ChromaDB) tool handlers
export async function vidensarkivSearchHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getChromaVectorStore();
  const { query, limit = 10, namespace } = payload;

  const results = await vectorStore.search({
    query,
    limit,
    namespace: namespace || ctx.orgId,
  });

  return {
    success: true,
    results: results.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.score,
    })),
    count: results.length,
  };
}

export async function vidensarkivAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getChromaVectorStore();
  const { content, metadata = {}, namespace } = payload;

  const record: VectorRecord = {
    id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    metadata: {
      ...metadata,
      orgId: ctx.orgId,
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
    },
    namespace: namespace || ctx.orgId,
  };

  await vectorStore.upsert(record);

  // Log to ProjectMemory
  projectMemory.logLifecycleEvent({
    eventType: 'other',
    status: 'success',
    details: {
      component: 'vidensarkiv',
      action: 'add',
      recordId: record.id,
      namespace: record.namespace,
    },
  });

  return {
    success: true,
    id: record.id,
    message: 'Knowledge added to archive',
  };
}

export async function vidensarkivBatchAddHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getChromaVectorStore();
  const { records, namespace } = payload;

  const vectorRecords: VectorRecord[] = records.map((r: any, idx: number) => ({
    id: r.id || `vid-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    content: r.content,
    metadata: {
      ...r.metadata,
      orgId: ctx.orgId,
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
    },
    namespace: namespace || ctx.orgId,
  }));

  await vectorStore.batchUpsert(vectorRecords);

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
  const vectorStore = getChromaVectorStore();
  const { id, limit = 5, namespace } = payload;

  const record = await vectorStore.getById(id, namespace || ctx.orgId);
  if (!record) {
    throw new Error(`Record ${id} not found`);
  }

  const related = await vectorStore.search({
    query: record.content,
    limit,
    namespace: namespace || ctx.orgId,
  });

  return {
    success: true,
    record,
    related: related.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.score,
    })),
  };
}

export async function vidensarkivListHandler(payload: any, ctx: McpContext): Promise<any> {
  const vectorStore = getChromaVectorStore();
  const { namespace } = payload;

  const namespaces = await vectorStore.listNamespaces();
  const filtered = namespace ? namespaces.filter(n => n === namespace) : namespaces;

  return {
    success: true,
    namespaces: filtered,
    count: filtered.length,
  };
}

export async function vidensarkivStatsHandler(payload: any, _ctx: McpContext): Promise<any> {
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
