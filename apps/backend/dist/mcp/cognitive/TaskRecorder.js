/**
 * TaskRecorder - Observes, learns, and suggests automation
 *
 * CRITICAL RULE: Agents NEVER commit real tasks without user approval
 *
 * Features:
 * - Observes all tasks performed by users/agents
 * - Learns patterns from repeated tasks
 * - Suggests automation after observing N times
 * - Requires explicit user approval before automation
 * - Never auto-executes real tasks
 */
import { projectMemory } from '../../services/project/ProjectMemory.js';
import { eventBus } from '../EventBus.js';
import { getDatabase } from '../../database/index.js';
export class TaskRecorder {
    constructor() {
        this.observations = new Map(); // signature -> observations
        this.patterns = new Map(); // signature -> pattern
        this.suggestions = new Map(); // suggestionId -> suggestion
        this.MIN_OBSERVATIONS_FOR_SUGGESTION = 3; // Suggest after 3 observations
        this.MIN_CONFIDENCE_FOR_SUGGESTION = 0.7; // 70% success rate minimum
        this.db = getDatabase();
        this.initializeDatabase();
        this.setupEventListeners();
    }
    /**
     * Initialize database tables for task recording
     */
    initializeDatabase() {
        try {
            // Create task_observations table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS task_observations (
                    id TEXT PRIMARY KEY,
                    task_type TEXT NOT NULL,
                    task_signature TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    org_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    duration INTEGER,
                    success INTEGER NOT NULL,
                    result TEXT,
                    context TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // Create task_patterns table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS task_patterns (
                    task_signature TEXT PRIMARY KEY,
                    task_type TEXT NOT NULL,
                    frequency INTEGER NOT NULL DEFAULT 1,
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    success_rate REAL NOT NULL,
                    average_duration REAL,
                    contexts TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // Create automation_suggestions table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS automation_suggestions (
                    id TEXT PRIMARY KEY,
                    task_signature TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    observed_count INTEGER NOT NULL,
                    suggested_action TEXT NOT NULL,
                    requires_approval INTEGER NOT NULL DEFAULT 1,
                    estimated_benefit TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    approved_by TEXT,
                    approved_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (task_signature) REFERENCES task_patterns(task_signature)
                )
            `);
            // Create task_executions table (for approved automations)
            this.db.run(`
                CREATE TABLE IF NOT EXISTS task_executions (
                    id TEXT PRIMARY KEY,
                    suggestion_id TEXT,
                    task_signature TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    params TEXT NOT NULL,
                    requested_by TEXT NOT NULL,
                    approved_by TEXT NOT NULL,
                    executed_at TEXT NOT NULL,
                    success INTEGER,
                    result TEXT,
                    FOREIGN KEY (suggestion_id) REFERENCES automation_suggestions(id)
                )
            `);
            console.log('✅ TaskRecorder database initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize TaskRecorder database:', error);
        }
    }
    /**
     * Setup event listeners for task observation
     */
    setupEventListeners() {
        // Listen for MCP tool executions
        eventBus.onEvent('mcp.tool.executed', async (event) => {
            await this.observeTask({
                taskType: event.tool || 'unknown',
                taskSignature: this.generateSignature(event.tool, event.payload),
                userId: event.userId || 'system',
                orgId: event.orgId || 'default',
                timestamp: new Date(),
                success: event.success !== false,
                result: event.result,
                context: {
                    source: 'mcp_tool',
                    tool: event.tool,
                    payload: event.payload
                }
            });
        });
        // Listen for autonomous agent tasks
        eventBus.onEvent('autonomous.task.executed', async (event) => {
            await this.observeTask({
                taskType: event.taskType || 'autonomous_task',
                taskSignature: this.generateSignature(event.taskType, event.payload),
                userId: event.userId || 'system',
                orgId: event.orgId || 'default',
                timestamp: new Date(),
                success: event.success !== false,
                result: event.result,
                context: {
                    source: 'autonomous_agent',
                    taskType: event.taskType
                }
            });
        });
        console.log('👁️ TaskRecorder event listeners setup complete');
    }
    /**
     * Observe a task execution
     */
    async observeTask(observation) {
        const id = `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullObservation = { ...observation, id };
        // Store in memory
        const signature = observation.taskSignature;
        if (!this.observations.has(signature)) {
            this.observations.set(signature, []);
        }
        this.observations.get(signature).push(fullObservation);
        // Persist to database
        try {
            this.db.run(`
                INSERT INTO task_observations 
                (id, task_type, task_signature, user_id, org_id, timestamp, duration, success, result, context)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                observation.taskType,
                signature,
                observation.userId,
                observation.orgId,
                observation.timestamp.toISOString(),
                observation.duration || null,
                observation.success ? 1 : 0,
                observation.result ? JSON.stringify(observation.result) : null,
                observation.context ? JSON.stringify(observation.context) : null
            ]);
        }
        catch (error) {
            console.error('Failed to persist task observation:', error);
        }
        // Update pattern
        await this.updatePattern(fullObservation);
        // Check if we should suggest automation
        await this.checkAndSuggestAutomation(signature);
        console.log(`👁️ [TaskRecorder] Observed: ${observation.taskType} (${signature.substring(0, 8)}...)`);
    }
    /**
     * Update pattern from observation
     */
    async updatePattern(observation) {
        const signature = observation.taskSignature;
        const existing = this.patterns.get(signature);
        if (existing) {
            // Update existing pattern
            existing.frequency += 1;
            existing.lastSeen = observation.timestamp;
            existing.successRate = this.calculateSuccessRate(signature);
            existing.averageDuration = this.calculateAverageDuration(signature);
            // Update context patterns
            if (observation.context) {
                for (const [key, value] of Object.entries(observation.context)) {
                    const contextKey = `${key}:${value}`;
                    existing.contexts[contextKey] = (existing.contexts[contextKey] || 0) + 1;
                }
            }
            // Update database
            try {
                this.db.run(`
                    UPDATE task_patterns
                    SET frequency = ?,
                        last_seen = ?,
                        success_rate = ?,
                        average_duration = ?,
                        contexts = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE task_signature = ?
                `, [
                    existing.frequency,
                    existing.lastSeen.toISOString(),
                    existing.successRate,
                    existing.averageDuration || null,
                    JSON.stringify(existing.contexts),
                    signature
                ]);
            }
            catch (error) {
                console.error('Failed to update pattern:', error);
            }
        }
        else {
            // Create new pattern
            const pattern = {
                taskSignature: signature,
                taskType: observation.taskType,
                frequency: 1,
                firstSeen: observation.timestamp,
                lastSeen: observation.timestamp,
                successRate: observation.success ? 1.0 : 0.0,
                averageDuration: observation.duration,
                contexts: observation.context ?
                    Object.fromEntries(Object.entries(observation.context).map(([k, v]) => [`${k}:${v}`, 1])) :
                    {}
            };
            this.patterns.set(signature, pattern);
            // Insert into database
            try {
                this.db.run(`
                    INSERT INTO task_patterns
                    (task_signature, task_type, frequency, first_seen, last_seen, success_rate, average_duration, contexts)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    signature,
                    pattern.taskType,
                    pattern.frequency,
                    pattern.firstSeen.toISOString(),
                    pattern.lastSeen.toISOString(),
                    pattern.successRate,
                    pattern.averageDuration || null,
                    JSON.stringify(pattern.contexts)
                ]);
            }
            catch (error) {
                console.error('Failed to insert pattern:', error);
            }
        }
    }
    /**
     * Check if automation should be suggested
     */
    async checkAndSuggestAutomation(signature) {
        const pattern = this.patterns.get(signature);
        if (!pattern)
            return;
        // Check if we've observed enough times
        if (pattern.frequency < this.MIN_OBSERVATIONS_FOR_SUGGESTION) {
            return;
        }
        // Check if success rate is high enough
        if (pattern.successRate < this.MIN_CONFIDENCE_FOR_SUGGESTION) {
            return;
        }
        // Check if suggestion already exists
        const existingSuggestion = Array.from(this.suggestions.values())
            .find(s => s.taskSignature === signature && s.status === 'pending');
        if (existingSuggestion) {
            return; // Already suggested
        }
        // Create automation suggestion
        const suggestion = {
            id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            taskSignature: signature,
            taskType: pattern.taskType,
            confidence: pattern.successRate,
            observedCount: pattern.frequency,
            suggestedAction: `Automate "${pattern.taskType}" task (observed ${pattern.frequency} times with ${(pattern.successRate * 100).toFixed(0)}% success rate)`,
            requiresApproval: true, // ALWAYS require approval for real tasks
            estimatedBenefit: pattern.averageDuration
                ? `Saves ~${pattern.averageDuration}ms per execution`
                : 'Reduces manual repetition',
            createdAt: new Date(),
            status: 'pending'
        };
        this.suggestions.set(suggestion.id, suggestion);
        pattern.suggestedAutomation = suggestion;
        // Persist suggestion
        try {
            this.db.run(`
                INSERT INTO automation_suggestions
                (id, task_signature, task_type, confidence, observed_count, suggested_action, requires_approval, estimated_benefit, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                suggestion.id,
                signature,
                suggestion.taskType,
                suggestion.confidence,
                suggestion.observedCount,
                suggestion.suggestedAction,
                1, // requires_approval = true
                suggestion.estimatedBenefit,
                'pending'
            ]);
        }
        catch (error) {
            console.error('Failed to persist suggestion:', error);
        }
        // Emit event for UI notification
        eventBus.emit('taskrecorder.suggestion.created', {
            suggestion,
            pattern
        });
        // Log to ProjectMemory
        try {
            projectMemory.logLifecycleEvent({
                eventType: 'other',
                status: 'success',
                details: {
                    component: 'TaskRecorder',
                    action: 'automation_suggested',
                    suggestionId: suggestion.id,
                    taskType: pattern.taskType,
                    observedCount: pattern.frequency,
                    confidence: pattern.successRate
                }
            });
        }
        catch (err) {
            console.warn('Could not log suggestion to ProjectMemory:', err);
        }
        console.log(`💡 [TaskRecorder] Automation suggested: ${suggestion.suggestedAction}`);
    }
    /**
     * Request task execution (requires approval)
     */
    async requestTaskExecution(request) {
        // CRITICAL: Always require approval for real tasks
        if (!request.requiresApproval) {
            throw new Error('All real tasks require approval - cannot execute without approval');
        }
        const suggestion = this.suggestions.get(request.suggestionId);
        if (!suggestion) {
            throw new Error(`Suggestion ${request.suggestionId} not found`);
        }
        // Check if suggestion is approved
        if (suggestion.status !== 'approved') {
            return {
                approved: false,
                executionId: undefined
            };
        }
        // Execute task (with approval)
        const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.db.run(`
                INSERT INTO task_executions
                (id, suggestion_id, task_signature, task_type, params, requested_by, approved_by, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                executionId,
                request.suggestionId,
                request.taskSignature,
                request.taskType,
                JSON.stringify(request.params),
                request.requestedBy,
                suggestion.approvedBy || 'system',
                new Date().toISOString()
            ]);
            // Emit execution event
            eventBus.emit('taskrecorder.execution.started', {
                executionId,
                request,
                suggestion
            });
            return {
                approved: true,
                executionId
            };
        }
        catch (error) {
            console.error('Failed to record execution:', error);
            throw error;
        }
    }
    /**
     * Approve automation suggestion
     */
    async approveSuggestion(suggestionId, approvedBy) {
        const suggestion = this.suggestions.get(suggestionId);
        if (!suggestion) {
            throw new Error(`Suggestion ${suggestionId} not found`);
        }
        suggestion.status = 'approved';
        suggestion.approvedBy = approvedBy;
        suggestion.approvedAt = new Date();
        // Update database
        try {
            this.db.run(`
                UPDATE automation_suggestions
                SET status = 'approved',
                    approved_by = ?,
                    approved_at = ?
                WHERE id = ?
            `, [
                approvedBy,
                suggestion.approvedAt.toISOString(),
                suggestionId
            ]);
        }
        catch (error) {
            console.error('Failed to update suggestion:', error);
        }
        // Emit event
        eventBus.emit('taskrecorder.suggestion.approved', {
            suggestion
        });
        console.log(`✅ [TaskRecorder] Suggestion approved: ${suggestion.suggestedAction}`);
    }
    /**
     * Reject automation suggestion
     */
    async rejectSuggestion(suggestionId, rejectedBy) {
        const suggestion = this.suggestions.get(suggestionId);
        if (!suggestion) {
            throw new Error(`Suggestion ${suggestionId} not found`);
        }
        suggestion.status = 'rejected';
        // Update database
        try {
            this.db.run(`
                UPDATE automation_suggestions
                SET status = 'rejected'
                WHERE id = ?
            `, [suggestionId]);
        }
        catch (error) {
            console.error('Failed to update suggestion:', error);
        }
        console.log(`❌ [TaskRecorder] Suggestion rejected: ${suggestion.suggestedAction}`);
    }
    /**
     * Get all pending suggestions
     */
    getPendingSuggestions() {
        return Array.from(this.suggestions.values())
            .filter(s => s.status === 'pending')
            .sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Get pattern by signature
     */
    getPattern(signature) {
        return this.patterns.get(signature);
    }
    /**
     * Get all patterns
     */
    getAllPatterns() {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.frequency - a.frequency);
    }
    /**
     * Generate signature from task type and params
     */
    generateSignature(taskType, params) {
        const normalized = {
            type: taskType,
            params: this.normalizeParams(params)
        };
        const str = JSON.stringify(normalized);
        // Use simple hash for signature
        return `sig-${this.simpleHash(str)}`;
    }
    /**
     * Normalize params for consistent signatures
     */
    normalizeParams(params) {
        if (!params || typeof params !== 'object') {
            return params;
        }
        const normalized = {};
        for (const [key, value] of Object.entries(params)) {
            // Ignore timestamps, IDs, and other variable fields
            if (['timestamp', 'id', 'createdAt', 'updatedAt', 'userId', 'orgId'].includes(key)) {
                continue;
            }
            normalized[key] = value;
        }
        return normalized;
    }
    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Calculate success rate for a pattern
     */
    calculateSuccessRate(signature) {
        const observations = this.observations.get(signature) || [];
        if (observations.length === 0)
            return 0;
        const successful = observations.filter(o => o.success).length;
        return successful / observations.length;
    }
    /**
     * Calculate average duration for a pattern
     */
    calculateAverageDuration(signature) {
        const observations = this.observations.get(signature) || [];
        const withDuration = observations.filter(o => o.duration !== undefined);
        if (withDuration.length === 0)
            return undefined;
        const sum = withDuration.reduce((acc, o) => acc + (o.duration || 0), 0);
        return sum / withDuration.length;
    }
}
// Singleton instance
let taskRecorderInstance = null;
export function getTaskRecorder() {
    if (!taskRecorderInstance) {
        taskRecorderInstance = new TaskRecorder();
    }
    return taskRecorderInstance;
}
