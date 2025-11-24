/**
 * Cognitive Memory - Central Intelligence System
 * 
 * Combines pattern learning and failure memory to provide
 * autonomous decision-making capabilities
 */

import { PatternMemory, QueryPattern, UsagePattern } from './PatternMemory.js';
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
    private db: any;

    constructor(database: any) {
        this.db = database;
        this.patternMemory = new PatternMemory(database);
        this.failureMemory = new FailureMemory(database);

        console.log('🧠 Cognitive Memory initialized');
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

    // ========================================================================
    // Health Tracking
    // ========================================================================

    /**
     * Record health metrics for a source
     */
    async recordHealthMetrics(metrics: HealthMetrics): Promise<void> {
        try {
            const sql = `
        INSERT INTO mcp_source_health 
        (id, source_name, health_score, latency_p50, latency_p95, latency_p99,
         success_rate, request_count, error_count, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const id = `${metrics.sourceName}-${Date.now()}`;

            if (this.db.prepare) {
                const stmt = this.db.prepare(sql);
                stmt.run(
                    id,
                    metrics.sourceName,
                    metrics.healthScore,
                    metrics.latency.p50,
                    metrics.latency.p95,
                    metrics.latency.p99,
                    metrics.successRate,
                    metrics.requestCount,
                    metrics.errorCount,
                    metrics.timestamp.toISOString()
                );
            } else {
                this.db.run(sql, [
                    id,
                    metrics.sourceName,
                    metrics.healthScore,
                    metrics.latency.p50,
                    metrics.latency.p95,
                    metrics.latency.p99,
                    metrics.successRate,
                    metrics.requestCount,
                    metrics.errorCount,
                    metrics.timestamp.toISOString()
                ]);
            }
        } catch (error) {
            console.error('Failed to record health metrics:', error);
        }
    }

    /**
     * Get recent health history for trend analysis
     */
    async getHealthHistory(
        sourceName: string,
        limit: number = 100
    ): Promise<HealthMetrics[]> {
        try {
            const sql = `
        SELECT * FROM mcp_source_health
        WHERE source_name = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

            let results: any[];
            if (this.db.prepare) {
                const stmt = this.db.prepare(sql);
                results = stmt.all(sourceName, limit);
            } else {
                const stmt = this.db.prepare(sql);
                stmt.bind([sourceName, limit]);
                results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
            }

            return results.map(r => ({
                sourceName: r.source_name,
                healthScore: r.health_score,
                latency: {
                    p50: r.latency_p50,
                    p95: r.latency_p95,
                    p99: r.latency_p99
                },
                successRate: r.success_rate,
                requestCount: r.request_count,
                errorCount: r.error_count,
                timestamp: new Date(r.timestamp)
            }));
        } catch (error) {
            console.error('Failed to get health history:', error);
            return [];
        }
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
     * Clean old data (maintenance)
     */
    async cleanup(retentionDays: number = 30): Promise<void> {
        console.log(`🧹 Cleaning cognitive memory older than ${retentionDays} days...`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        try {
            // Clean old patterns
            const sql1 = `DELETE FROM mcp_query_patterns WHERE timestamp < ?`;
            const sql2 = `DELETE FROM mcp_failure_memory WHERE occurred_at < ?`;
            const sql3 = `DELETE FROM mcp_source_health WHERE timestamp < ?`;

            if (this.db.prepare) {
                this.db.prepare(sql1).run(cutoffDate.toISOString());
                this.db.prepare(sql2).run(cutoffDate.toISOString());
                this.db.prepare(sql3).run(cutoffDate.toISOString());
            } else {
                this.db.run(sql1, [cutoffDate.toISOString()]);
                this.db.run(sql2, [cutoffDate.toISOString()]);
                this.db.run(sql3, [cutoffDate.toISOString()]);
            }

            console.log('✅ Cleanup complete');
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
        }
    }
}

// Singleton instance
let instance: CognitiveMemory | null = null;

export function initCognitiveMemory(database: any): CognitiveMemory {
    if (!instance) {
        instance = new CognitiveMemory(database);
    }
    return instance;
}

export function getCognitiveMemory(): CognitiveMemory {
    if (!instance) {
        throw new Error('Cognitive Memory not initialized! Call initCognitiveMemory() first.');
    }
    return instance;
}
