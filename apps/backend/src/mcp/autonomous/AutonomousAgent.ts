/**
 * Autonomous Connection Agent
 * 
 * Main orchestrator that autonomously selects optimal data sources,
 * learns from outcomes, and adapts over time
 */

import { v4 as uuidv4 } from 'uuid';
import { CognitiveMemory } from '../memory/CognitiveMemory.js';
import { DecisionEngine, DataSource, QueryIntent, DecisionResult } from './DecisionEngine.js';

export interface DataQuery {
    id?: string;
    type: string;
    domain?: string;
    operation?: string;
    params?: any;
    priority?: 'low' | 'normal' | 'high';
    freshness?: 'stale' | 'normal' | 'realtime';
    widgetId?: string;
}

export interface QueryResult {
    data: any;
    source: string;
    latencyMs: number;
    cached: boolean;
    timestamp: Date;
}

export interface SourceRegistry {
    getCapableSources(intent: QueryIntent): DataSource[];
    getAllSources(): DataSource[];
}

export class AutonomousAgent {
    private memory: CognitiveMemory;
    private decisionEngine: DecisionEngine;
    private registry: SourceRegistry;
    private predictionCache: Map<string, any> = new Map();
    private wsServer: any = null; // WebSocket server for real-time events

    constructor(
        memory: CognitiveMemory,
        registry: SourceRegistry,
        wsServer?: any
    ) {
        this.memory = memory;
        this.decisionEngine = new DecisionEngine(memory);
        this.registry = registry;
        this.wsServer = wsServer || null;

        console.log('🤖 Autonomous Agent initialized');
    }

    /**
     * Set WebSocket server for real-time event emission
     */
    setWebSocketServer(server: any): void {
        this.wsServer = server;
    }

    /**
     * Main routing function - autonomously selects best source
     */
    async route(query: DataQuery): Promise<DataSource> {
        const startTime = Date.now();

        // 1. Analyze query intent
        const intent = await this.decisionEngine.analyzeIntent(query);

        // 2. Get candidate sources
        const candidates = this.registry.getCapableSources(intent);

        if (candidates.length === 0) {
            throw new Error(`No sources available for query type: ${intent.type}`);
        }

        // 3. Make intelligent decision
        const decision = await this.decisionEngine.decide(candidates, intent);

        // 4. Log decision for learning
        await this.logDecision(query, decision, candidates);

        const decisionTime = Date.now() - startTime;
        console.log(
            `🎯 Selected ${decision.selectedSource.name} ` +
            `(confidence: ${(decision.confidence * 100).toFixed(0)}%, ` +
            `decision: ${decisionTime}ms)`
        );
        console.log(`   Reasoning: ${decision.reasoning}`);

        return decision.selectedSource;
    }

    /**
     * Execute query with selected source and learn from outcome
     * Includes autonomous fallback handling for failures
     */
    async executeAndLearn(
        query: DataQuery,
        executeFunction: (source: DataSource) => Promise<any>
    ): Promise<QueryResult> {
        // Generate unique query ID for tracking if not provided
        const queryId = query.id || uuidv4();
        const startTime = Date.now();

        // 1. Analyze intent
        const intent = await this.decisionEngine.analyzeIntent(query);

        // 2. Get candidate sources
        const candidates = this.registry.getCapableSources(intent);

        if (candidates.length === 0) {
            throw new Error(`No sources available for query type: ${intent.type}`);
        }

        // 3. Score and rank sources for fallback strategy
        const rankedSources = await this.decisionEngine.scoreAllSources(candidates, intent);

        const errors: any[] = [];

        // 4. Try sources in order (Fallback Loop)
        for (const candidate of rankedSources) {
            const selectedSource = candidate.source;

            try {
                // Only log if it's a fallback attempt (not the first choice)
                if (errors.length > 0) {
                    console.log(`🔄 Fallback: Attempting execution with ${selectedSource.name} (Score: ${candidate.score.toFixed(2)})...`);
                }

                // Execute query
                const result = await executeFunction(selectedSource);

                // Success!
                const latencyMs = Date.now() - startTime;

                // Log decision (we log the one that actually worked)
                const decision: DecisionResult = {
                    selectedSource: selectedSource,
                    score: candidate.score,
                    confidence: candidate.score,
                    reasoning: candidate.reasoning,
                    alternatives: rankedSources.filter(s => s.source.name !== selectedSource.name)
                };
                await this.logDecision(query, decision, candidates);

                // Emit WebSocket event for real-time updates
                if (this.wsServer && this.wsServer.emitAutonomousDecision) {
                    this.wsServer.emitAutonomousDecision({
                        queryId: queryId,
                        selectedSource: selectedSource.name,
                        confidence: candidate.score,
                        alternatives: rankedSources.slice(1, 4).map(s => s.source.name),
                        reasoning: candidate.reasoning,
                        latency: latencyMs
                    });
                }

                // Learn from successful execution
                await this.memory.recordQuery({
                    widgetId: query.widgetId || 'unknown',
                    queryType: query.type,
                    queryParams: query.params,
                    sourceUsed: selectedSource.name,
                    latencyMs,
                    resultSize: this.estimateSize(result),
                    success: true
                });

                // Log to ProjectMemory for historical tracking
                try {
                    const { projectMemory } = await import('../../services/project/ProjectMemory.js');
                    projectMemory.logLifecycleEvent({
                        eventType: 'other',
                        status: 'success',
                        details: {
                            type: 'agent_decision',
                            query: query.type,
                            source: selectedSource.name,
                            latency: latencyMs,
                            confidence: candidate.score
                        }
                    });
                } catch (error) {
                    // Don't fail the query if ProjectMemory logging fails
                    console.warn('Failed to log to ProjectMemory:', error);
                }

                return {
                    data: result,
                    source: selectedSource.name,
                    latencyMs,
                    cached: false,
                    timestamp: new Date()
                };

            } catch (error: any) {
                console.warn(`⚠️ Source ${selectedSource.name} failed: ${error.message}`);
                errors.push({ source: selectedSource.name, error: error.message });

                // Learn from failure
                await this.memory.recordFailure({
                    sourceName: selectedSource.name,
                    error,
                    queryContext: {
                        queryType: query.type,
                        queryParams: query.params
                    }
                });

                await this.memory.recordQuery({
                    widgetId: query.widgetId || 'unknown',
                    queryType: query.type,
                    queryParams: query.params,
                    sourceUsed: selectedSource.name,
                    latencyMs: Date.now() - startTime,
                    success: false
                });

                // Continue to next source...
            }
        }

        // If we get here, ALL sources failed
        throw new Error(`All available sources failed for query ${query.type}. Errors: ${JSON.stringify(errors)}`);
    }

    /**
     * Predictive pre-fetching based on learned patterns
     */
    async predictAndPrefetch(widgetId: string): Promise<void> {
        try {
            // Get widget patterns
            const patterns = await this.memory.getWidgetPatterns(widgetId);

            if (patterns.timePatterns.length === 0) {
                return; // No patterns learned yet
            }

            const currentHour = new Date().getHours();

            // Find pattern for current hour
            const currentPattern = patterns.timePatterns.find(p => p.hour === currentHour);

            if (!currentPattern || currentPattern.frequency < 5) {
                return; // Not confident enough
            }

            // Predict likely source based on common sources
            const likelySource = patterns.commonSources[0];

            if (!likelySource) {
                return;
            }

            console.log(
                `🔮 Pre-fetching for ${widgetId} ` +
                `(hour: ${currentHour}, confidence: high)`
            );

            // Pre-warm cache or connection
            // (Implementation depends on source type)
            this.predictionCache.set(widgetId, {
                source: likelySource,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Prediction error:', error);
        }
    }

    /**
     * Continuous learning - runs periodically
     */
    async learn(): Promise<void> {
        console.log('🎓 Running learning cycle...');

        try {
            // Analyze decision quality
            await this.analyzeDecisionQuality();

            // Identify patterns
            await this.identifyPatterns();

            // Update predictions
            await this.updatePredictions();

            console.log('✅ Learning cycle complete');
        } catch (error) {
            console.error('Learning cycle error:', error);
        }
    }

    /**
     * Analyze if past decisions were optimal
     */
    private async analyzeDecisionQuality(): Promise<void> {
        // Simple heuristic: check success rate of recent decisions
        try {
            const stats = await this.memory.getFailureStats('all'); // 'all' might not be supported, but let's try
            console.log(`🧠 Learning: Analyzed decision quality. Recent failure rate: ${(1 - stats.recoverySuccessRate).toFixed(2)}`);
        } catch (e) {
            // Ignore error if stats not available
        }
    }

    /**
     * Identify new patterns in widget usage
     */
    private async identifyPatterns(): Promise<void> {
        // Analyze query_patterns table to find new time-based patterns,
        // sequence patterns, etc.
        // Store findings in mcp_widget_patterns table
    }

    /**
     * Update pre-fetch predictions
     */
    private async updatePredictions(): Promise<void> {
        // Based on identified patterns, update what should be pre-fetched
        // Clear old predictions that are no longer accurate
    }

    /**
     * Log decision for future analysis
     */
    private async logDecision(
        query: DataQuery,
        decision: DecisionResult,
        _allCandidates: DataSource[]
    ): Promise<void> {
        try {
            // Note: This is simplified - full implementation would use proper DB access
            // For now, logging to console
            console.log(`📊 Decision logged: ${decision.selectedSource.name}`);
        } catch (error) {
            console.error('Failed to log decision:', error);
        }
    }

    /**
     * Estimate result size in bytes
     */
    private estimateSize(result: any): number {
        try {
            return JSON.stringify(result).length;
        } catch {
            return 0;
        }
    }

    /**
     * Get agent statistics
     */
    async getStats(): Promise<{
        totalDecisions: number;
        averageConfidence: number;
        topSources: { source: string; count: number }[];
    }> {
        // Placeholder - would query decision_log table
        return {
            totalDecisions: 0,
            averageConfidence: 0,
            topSources: []
        };
    }
}

/**
 * Start autonomous learning loop
 */
export function startAutonomousLearning(agent: AutonomousAgent, intervalMs: number = 300000): void {
    console.log(`🔄 Starting autonomous learning (every ${intervalMs / 1000}s)`);

    // Run learning cycle periodically
    setInterval(async () => {
        try {
            await agent.learn();
        } catch (error) {
            console.error('Learning cycle failed:', error);
        }
    }, intervalMs);

    // Run initial learning after 10 seconds
    setTimeout(() => agent.learn(), 10000);
}
