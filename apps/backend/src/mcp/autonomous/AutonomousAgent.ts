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

    constructor(
        memory: CognitiveMemory,
        registry: SourceRegistry
    ) {
        this.memory = memory;
        this.decisionEngine = new DecisionEngine(memory);
        this.registry = registry;

        console.log('🤖 Autonomous Agent initialized');
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
     */
    async executeAndLearn(
        query: DataQuery,
        executeFunction: (source: DataSource) => Promise<any>
    ): Promise<QueryResult> {
        const queryId = query.id || uuidv4();
        const startTime = Date.now();

        let selectedSource: DataSource;
        let result: any;
        let success = false;

        try {
            // Route to best source
            selectedSource = await this.route(query);

            // Execute query
            result = await executeFunction(selectedSource);
            success = true;

            const latencyMs = Date.now() - startTime;

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

            return {
                data: result,
                source: selectedSource.name,
                latencyMs,
                cached: false,
                timestamp: new Date()
            };

        } catch (error: any) {
            const latencyMs = Date.now() - startTime;

            // Learn from failure
            if (selectedSource!) {
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
                    latencyMs,
                    success: false
                });
            }

            throw error;
        }
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
        // This would analyze decision_log table and mark whether
        // selected sources performed as expected
        // For now, it's a placeholder for future ML model training
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
        allCandidates: DataSource[]
    ): Promise<void> {
        try {
            const sql = `
        INSERT INTO mcp_decision_log
        (id, query_intent, selected_source, decision_confidence, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `;

            const id = uuidv4();
            const intent = JSON.stringify({
                type: query.type,
                domain: query.domain,
                priority: query.priority
            });

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
