// ... existing code ...

// TaskRecorder MCP Tools
import { getTaskRecorder } from './cognitive/TaskRecorder.js';

/**
 * TaskRecorder: Get pending automation suggestions
 * Returns suggestions that require user approval
 */
export async function taskRecorderGetSuggestionsHandler(payload: any, ctx: McpContext): Promise<any> {
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
export async function taskRecorderGetPatternsHandler(payload: any, ctx: McpContext): Promise<any> {
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
