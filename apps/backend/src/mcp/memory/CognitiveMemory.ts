/**
 * Cognitive Memory - Central Intelligence System (In-Memory)
 *
 * Combines pattern learning and failure memory to provide
 * autonomous decision-making capabilities
 */

import { PatternMemory, UsagePattern } from './PatternMemory.js';
import { FailureMemory, Failure, RecoveryPath } from './FailureMemory.js';

export interface HealthMetrics {
    sourceName: string;
    healthScore: number;
    latency: {
        p50: number;
        p95: number;
        p99: number;
    };
    successRate: number;
    requestCount: number;
    errorCount: number;
    timestamp: Date;
}

export interface UserContext {
    userId?: string;
    timeOfDay: number;
    dayOfWeek: number;
    recentActivity?: string[];
}

export class CognitiveMemory {
    private patternMemory: PatternMemory;
    private failureMemory: FailureMemory;
    private healthHistory: Map<string, HealthMetrics[]> = new Map();
    private readonly MAX_HEALTH_RECORDS = 1000;

    constructor(_database?: any) {
        // Database parameter ignored - using in-memory storage
        this.patternMemory = new PatternMemory();
        this.failureMemory = new FailureMemory();

        console.log('🧠 Cognitive Memory initialized (in-memory mode)');
    }

    // ========================================================================
    // Pattern Memory Interface
    // ========================================================================

    /**
     * Record a successful query for pattern learning
     */
    async recordQuery(params: {
        widgetId: string;
        queryType: string;
        queryParams: any;
        sourceUsed: string;
        latencyMs: number;
        resultSize?: number;
        success: boolean;
    }): Promise<void> {
        return this.patternMemory.recordQuery(params);
    }

    /**
     * Get usage patterns for a widget
     */
    async getWidgetPatterns(widgetId: string): Promise<UsagePattern> {
        return this.patternMemory.getWidgetPatterns(widgetId);
    }

    /**
     * Get average latency for a source
     */
    async getAverageLatency(sourceName: string): Promise<number> {
        return this.patternMemory.getAverageLatency(sourceName);
    }

    /**
     * Get success rate for a specific source and query combination
     */
    async getSuccessRate(sourceName: string, queryType: string): Promise<number> {
        return this.patternMemory.getSuccessRate(sourceName, queryType);
    }

    /**
     * Find similar historical queries
     */
    async getSimilarQuerySuccess(queryType: string, queryParams: any): Promise<number> {
        const similar = await this.patternMemory.findSimilarQueries(queryType, queryParams, 10);

        if (similar.length === 0) return 0.5; // No data, neutral score

        const successCount = similar.filter(q => q.pattern.success).length;
        return successCount / similar.length;
    }

    // ========================================================================
    // Failure Memory Interface
    // ========================================================================

    /**
     * Record a failure with optional recovery information
     */
    async recordFailure(params: {
        sourceName: string;
        error: Error;
        queryContext?: any;
        recoveryAction?: string;
        recoverySuccess?: boolean;
        recoveryTimeMs?: number;
    }): Promise<void> {
        return this.failureMemory.recordFailure(params);
    }

    /**
     * Get known recovery paths for a specific error
     */
    async getRecoveryPaths(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath[]> {
        return this.failureMemory.getRecoveryPaths(sourceName, errorType);
    }

    /**
     * Get the last successful recovery action
     */
    async getLastSuccessfulRecovery(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath | null> {
        return this.failureMemory.getLastSuccessfulRecovery(sourceName, errorType);
    }

    /**
     * Check if failures are recurring (indicates deeper issue)
     */
    async isRecurringFailure(
        sourceName: string,
        errorType: string
    ): Promise<boolean> {
        return this.failureMemory.isRecurringFailure(sourceName, errorType);
    }

    /**
     * Get failure statistics for a source
     */
    async getFailureStats(sourceName: string) {
        return this.failureMemory.getFailureStats(sourceName);
    }

    // ========================================================================
    // Health Tracking
    // ========================================================================

    /**
     * Record health metrics for a source
     */
    async recordHealthMetrics(metrics: HealthMetrics): Promise<void> {
        const sourceName = metrics.sourceName;

        if (!this.healthHistory.has(sourceName)) {
            this.healthHistory.set(sourceName, []);
        }

        const history = this.healthHistory.get(sourceName)!;
        history.unshift(metrics);

        // Trim old records
        if (history.length > this.MAX_HEALTH_RECORDS) {
            this.healthHistory.set(sourceName, history.slice(0, this.MAX_HEALTH_RECORDS));
        }
    }

    /**
     * Get recent health history for trend analysis
     */
    async getHealthHistory(
        sourceName: string,
        limit: number = 100
    ): Promise<HealthMetrics[]> {
        const history = this.healthHistory.get(sourceName) || [];
        return history.slice(0, limit);
    }

    /**
     * Get source health metrics
     */
    async getSourceHealth(sourceName: string): Promise<HealthMetrics | null> {
        const history = await this.getHealthHistory(sourceName, 1);
        return history.length > 0 ? history[0] : null;
    }

    // ========================================================================
    // Context Awareness
    // ========================================================================

    /**
     * Get current user context for decision making
     */
    getCurrentUserContext(): UserContext {
        const now = new Date();
        return {
            timeOfDay: now.getHours(),
            dayOfWeek: now.getDay()
        };
    }

    /**
     * Get comprehensive intelligence summary for a source
     */
    async getSourceIntelligence(sourceName: string): Promise<{
        averageLatency: number;
        overallSuccessRate: number;
        recentFailures: number;
        lastFailure?: Failure;
        knownRecoveryPaths: Map<string, RecoveryPath[]>;
    }> {
        const [avgLatency, failureHistory, failureStats] = await Promise.all([
            this.getAverageLatency(sourceName),
            this.failureMemory.getFailureHistory(sourceName, 10),
            this.failureMemory.getFailureStats(sourceName)
        ]);

        // Get recovery paths for each unique error type
        const errorTypes = new Set(failureHistory.map(f => f.errorType));
        const recoveryPaths = new Map<string, RecoveryPath[]>();

        for (const errorType of errorTypes) {
            const paths = await this.getRecoveryPaths(sourceName, errorType);
            if (paths.length > 0) {
                recoveryPaths.set(errorType, paths);
            }
        }

        return {
            averageLatency: avgLatency,
            overallSuccessRate: 1 - (failureStats.totalFailures > 0
                ? failureStats.totalFailures / (failureStats.totalFailures + 1000)
                : 0),
            recentFailures: failureHistory.length,
            lastFailure: failureHistory[0],
            knownRecoveryPaths: recoveryPaths
        };
    }

    /**
     * Clean old data (maintenance) - no-op for in-memory storage
     */
    async cleanup(_retentionDays: number = 30): Promise<void> {
        console.log('🧹 Cognitive memory cleanup (in-memory - automatic via limits)');
    }
}

// Singleton instance
let instance: CognitiveMemory | null = null;

export function initCognitiveMemory(_database?: any): CognitiveMemory {
    if (!instance) {
        instance = new CognitiveMemory();
    }
    return instance;
}

export function getCognitiveMemory(): CognitiveMemory {
    if (!instance) {
        throw new Error('Cognitive Memory not initialized! Call initCognitiveMemory() first.');
    }
    return instance;
}
