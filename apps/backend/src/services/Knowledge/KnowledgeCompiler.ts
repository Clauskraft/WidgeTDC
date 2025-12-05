/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 * ║                           KNOWLEDGE COMPILER                                          ║
 * ║═══════════════════════════════════════════════════════════════════════════════════════║
 * ║                                                                                       ║
 * ║   Aggregerer viden fra hele systemet til en unified "System State Summary"            ║
 * ║                                                                                       ║
 * ║   DATAKILDER:                                                                         ║
 * ║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             ║
 * ║   │   HyperLog   │  │    Neo4j     │  │   Metrics    │  │  SelfHealing │             ║
 * ║   │   (Events)   │  │   (Graph)    │  │  (Counters)  │  │   (Status)   │             ║
 * ║   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             ║
 * ║          │                 │                 │                 │                      ║
 * ║          └────────────────┴────────────────┴────────────────┘                        ║
 * ║                                    │                                                  ║
 * ║                                    ▼                                                  ║
 * ║                      ┌─────────────────────────┐                                     ║
 * ║                      │   KNOWLEDGE COMPILER    │                                     ║
 * ║                      │   • compile()           │                                     ║
 * ║                      │   • getSystemSummary()  │                                     ║
 * ║                      │   • getInsights()       │                                     ║
 * ║                      └───────────┬─────────────┘                                     ║
 * ║                                  │                                                    ║
 * ║                                  ▼                                                    ║
 * ║                      ┌─────────────────────────┐                                     ║
 * ║                      │   CognitiveNode Widget  │                                     ║
 * ║                      │   (Visual Dashboard)    │                                     ║
 * ║                      └─────────────────────────┘                                     ║
 * ║                                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════╝
 */

import { hyperLog, HyperLog } from '../HyperLog.js';
import { selfHealing, SelfHealingAdapter } from '../SelfHealingAdapter.js';
import { neo4jAdapter } from '../../adapters/Neo4jAdapter.js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SystemStateSummary {
    timestamp: string;
    health: HealthStatus;
    activity: ActivitySummary;
    insights: Insight[];
    recommendations: Recommendation[];
    recentEvents: RecentEvent[];
    graphStats: GraphStats;
}

export interface HealthStatus {
    overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    score: number;  // 0-100
    services: ServiceHealth[];
    healingStats: {
        attempts: number;
        successes: number;
        failures: number;
        successRate: number;
    };
}

export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: string;
}

export interface ActivitySummary {
    last24h: {
        events: number;
        errors: number;
        healingAttempts: number;
        graphChanges: number;
    };
    topEventTypes: { type: string; count: number }[];
    activeAgents: string[];
}

export interface Insight {
    id: string;
    type: 'pattern' | 'anomaly' | 'trend' | 'recommendation';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    data?: Record<string, any>;
    timestamp: string;
}

export interface Recommendation {
    id: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
    reason: string;
    impact: string;
}

export interface RecentEvent {
    id: string;
    type: string;
    timestamp: string;
    summary: string;
    data?: Record<string, any>;
}

export interface GraphStats {
    totalNodes: number;
    totalRelationships: number;
    nodesByLabel: Record<string, number>;
    recentChanges: {
        added: number;
        modified: number;
        deleted: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE COMPILER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class KnowledgeCompiler {
    private static instance: KnowledgeCompiler;
    private lastCompilation: SystemStateSummary | null = null;
    private compilationInterval: NodeJS.Timeout | null = null;

    public static getInstance(): KnowledgeCompiler {
        if (!KnowledgeCompiler.instance) {
            KnowledgeCompiler.instance = new KnowledgeCompiler();
        }
        return KnowledgeCompiler.instance;
    }

    /**
     * Start automatic compilation at regular intervals
     */
    startAutoCompilation(intervalMs: number = 60000): void {
        if (this.compilationInterval) {
            clearInterval(this.compilationInterval);
        }
        
        // Initial compilation
        this.compile().catch(console.error);
        
        // Schedule regular compilations
        this.compilationInterval = setInterval(() => {
            this.compile().catch(console.error);
        }, intervalMs);
        
        console.log(`[KnowledgeCompiler] Auto-compilation started (every ${intervalMs/1000}s)`);
    }

    /**
     * Stop automatic compilation
     */
    stopAutoCompilation(): void {
        if (this.compilationInterval) {
            clearInterval(this.compilationInterval);
            this.compilationInterval = null;
        }
    }

    isAutoCompiling(): boolean {
        return Boolean(this.compilationInterval);
    }

    /**
     * MAIN COMPILATION METHOD
     * Aggregates all data sources into a unified summary
     */
    async compile(): Promise<SystemStateSummary> {
        console.log('[KnowledgeCompiler] Starting compilation...');
        const startTime = Date.now();

        try {
            // Gather data from all sources in parallel
            const [health, activity, graphStats, recentEvents] = await Promise.all([
                this.compileHealthStatus(),
                this.compileActivitySummary(),
                this.compileGraphStats(),
                this.compileRecentEvents()
            ]);

            // Generate insights based on compiled data
            const insights = this.generateInsights(health, activity, graphStats);
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(health, activity, insights);

            const summary: SystemStateSummary = {
                timestamp: new Date().toISOString(),
                health,
                activity,
                insights,
                recommendations,
                recentEvents,
                graphStats
            };

            this.lastCompilation = summary;
            
            const duration = Date.now() - startTime;
            console.log(`[KnowledgeCompiler] Compilation complete in ${duration}ms`);
            
            return summary;
        } catch (error) {
            console.error('[KnowledgeCompiler] Compilation failed:', error);
            throw error;
        }
    }

    /**
     * Get the last compiled summary (cached)
     */
    getLastCompilation(): SystemStateSummary | null {
        return this.lastCompilation;
    }

    /**
     * Get system summary (compile if needed)
     */
    async getSystemSummary(forceRefresh: boolean = false): Promise<SystemStateSummary> {
        if (forceRefresh || !this.lastCompilation) {
            return await this.compile();
        }
        return this.lastCompilation;
    }

    /**
     * Quick health check without full compilation
     */
    async quickHealth(): Promise<{ status: string; score: number; timestamp: string }> {
        const health = await this.compileHealthStatus();
        return {
            status: health.overall,
            score: health.score,
            timestamp: new Date().toISOString()
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA SOURCE COMPILATION METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Compile health status from SelfHealing + services
     */
    private async compileHealthStatus(): Promise<HealthStatus> {
        const systemStatus = selfHealing.getSystemStatus();
        const hyperLogData = hyperLog.exportForAnalysis();
        
        // Calculate healing stats from HyperLog
        const healingAttempts = hyperLogData.summary['HEALING_ATTEMPT'] || 0;
        const healingSuccesses = hyperLogData.summary['HEALING_SUCCESS'] || 0;
        const healingFailures = hyperLogData.summary['HEALING_CRASH'] || hyperLogData.summary['HEALING_FAILED'] || 0;
        
        const successRate = healingAttempts > 0 
            ? Math.round((healingSuccesses / healingAttempts) * 100) 
            : 100;

        // Calculate overall score
        let score = 100;
        if (systemStatus.overallHealth === 'DEGRADED') score = 70;
        if (systemStatus.overallHealth === 'CRITICAL') score = 30;
        score = Math.max(0, score - (healingFailures * 5));

        return {
            overall: systemStatus.overallHealth as 'HEALTHY' | 'DEGRADED' | 'CRITICAL',
            score: Math.max(0, Math.min(100, score)),
            services: systemStatus.services.map(s => ({
                name: s.name,
                status: s.status as 'healthy' | 'unhealthy' | 'unknown',
                lastCheck: new Date().toISOString()
            })),
            healingStats: {
                attempts: healingAttempts,
                successes: healingSuccesses,
                failures: healingFailures,
                successRate
            }
        };
    }

    /**
     * Compile activity summary from HyperLog
     */
    private async compileActivitySummary(): Promise<ActivitySummary> {
        const hyperLogData = hyperLog.exportForAnalysis();
        const recentEvents = hyperLog.getRecentEvents(1000);
        
        // Filter to last 24h
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const last24hEvents = recentEvents.filter(e => e.timestamp > oneDayAgo);
        
        // Count errors
        const errors = last24hEvents.filter(e => 
            e.eventType.includes('ERROR') || 
            e.eventType.includes('FAIL') ||
            e.eventType.includes('CRASH')
        ).length;

        // Count healing attempts
        const healingAttempts = last24hEvents.filter(e => 
            e.eventType.startsWith('HEALING_')
        ).length;

        // Top event types
        const eventCounts: Record<string, number> = {};
        for (const event of last24hEvents) {
            eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
        }
        const topEventTypes = Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([type, count]) => ({ type, count }));

        return {
            last24h: {
                events: last24hEvents.length,
                errors,
                healingAttempts,
                graphChanges: 0  // Will be populated from Neo4j
            },
            topEventTypes,
            activeAgents: ['claude', 'gemini', 'system']  // TODO: Track from messages
        };
    }

    /**
     * Compile graph statistics from Neo4j
     */
    private async compileGraphStats(): Promise<GraphStats> {
        try {
            // Get total counts
            const countResult = await neo4jAdapter.executeQuery(`
                MATCH (n)
                WITH count(n) as nodes
                MATCH ()-[r]->()
                RETURN nodes, count(r) as relationships
            `);

            // Get counts by label
            const labelResult = await neo4jAdapter.executeQuery(`
                MATCH (n)
                WITH labels(n) as nodeLabels
                UNWIND nodeLabels as label
                RETURN label, count(*) as count
                ORDER BY count DESC
            `);

            const nodesByLabel: Record<string, number> = {};
            for (const row of labelResult) {
                nodesByLabel[row.label] = row.count?.low || row.count || 0;
            }

            return {
                totalNodes: countResult[0]?.nodes?.low || countResult[0]?.nodes || 0,
                totalRelationships: countResult[0]?.relationships?.low || countResult[0]?.relationships || 0,
                nodesByLabel,
                recentChanges: {
                    added: 0,
                    modified: 0,
                    deleted: 0
                }
            };
        } catch (error) {
            console.warn('[KnowledgeCompiler] Failed to get graph stats:', error);
            return {
                totalNodes: 0,
                totalRelationships: 0,
                nodesByLabel: {},
                recentChanges: { added: 0, modified: 0, deleted: 0 }
            };
        }
    }

    /**
     * Compile recent events for display
     */
    private async compileRecentEvents(): Promise<RecentEvent[]> {
        const events = hyperLog.getRecentEvents(20);
        
        return events.map(e => ({
            id: e.id,
            type: e.eventType,
            timestamp: new Date(e.timestamp).toISOString(),
            summary: this.summarizeEvent(e.eventType, e.data),
            data: e.data
        })).reverse();  // Most recent first
    }

    /**
     * Generate human-readable event summary
     */
    private summarizeEvent(eventType: string, data: Record<string, any>): string {
        switch (eventType) {
            case 'HEALING_SUCCESS':
                return `System healed: ${data.strategy || 'unknown strategy'}`;
            case 'HEALING_CRASH':
            case 'HEALING_FAILED':
                return `Healing failed: ${data.originalError || 'unknown error'}`;
            case 'HEALING_ATTEMPT':
                return `Attempting to heal: ${data.strategy || 'unknown'}`;
            case 'ERROR_UNHANDLED':
                return `Unhandled error: ${data.message || data.code || 'unknown'}`;
            default:
                return `${eventType}: ${JSON.stringify(data).slice(0, 50)}...`;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INSIGHT & RECOMMENDATION GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate insights from compiled data
     */
    private generateInsights(
        health: HealthStatus, 
        activity: ActivitySummary, 
        graphStats: GraphStats
    ): Insight[] {
        const insights: Insight[] = [];

        // Health-based insights
        if (health.healingStats.failures > 0) {
            insights.push({
                id: `insight_healing_${Date.now()}`,
                type: 'anomaly',
                severity: health.healingStats.failures > 3 ? 'critical' : 'warning',
                title: 'Self-Healing Failures Detected',
                description: `${health.healingStats.failures} healing attempts have failed. Success rate: ${health.healingStats.successRate}%`,
                timestamp: new Date().toISOString()
            });
        }

        // Activity-based insights
        if (activity.last24h.errors > 10) {
            insights.push({
                id: `insight_errors_${Date.now()}`,
                type: 'anomaly',
                severity: 'warning',
                title: 'High Error Rate',
                description: `${activity.last24h.errors} errors detected in the last 24 hours`,
                data: { errorCount: activity.last24h.errors },
                timestamp: new Date().toISOString()
            });
        }

        // Graph-based insights
        if (graphStats.totalNodes > 10000) {
            insights.push({
                id: `insight_graph_${Date.now()}`,
                type: 'trend',
                severity: 'info',
                title: 'Large Knowledge Graph',
                description: `Knowledge graph has grown to ${graphStats.totalNodes.toLocaleString()} nodes`,
                timestamp: new Date().toISOString()
            });
        }

        // Pattern detection from top events
        const healingEvents = activity.topEventTypes.filter(e => e.type.startsWith('HEALING_'));
        if (healingEvents.length > 0) {
            const totalHealingEvents = healingEvents.reduce((sum, e) => sum + e.count, 0);
            if (totalHealingEvents > 5) {
                insights.push({
                    id: `insight_pattern_${Date.now()}`,
                    type: 'pattern',
                    severity: 'info',
                    title: 'Frequent Self-Healing Activity',
                    description: `System has triggered ${totalHealingEvents} healing events recently`,
                    data: { events: healingEvents },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return insights;
    }

    /**
     * Generate actionable recommendations
     */
    private generateRecommendations(
        health: HealthStatus,
        activity: ActivitySummary,
        insights: Insight[]
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Based on health
        if (health.overall === 'DEGRADED') {
            recommendations.push({
                id: `rec_health_${Date.now()}`,
                priority: 'high',
                action: 'Investigate degraded services',
                reason: 'System health is degraded',
                impact: 'Prevent potential system failures'
            });
        }

        if (health.healingStats.successRate < 80) {
            recommendations.push({
                id: `rec_healing_${Date.now()}`,
                priority: 'medium',
                action: 'Review self-healing strategies',
                reason: `Healing success rate is ${health.healingStats.successRate}%`,
                impact: 'Improve system resilience'
            });
        }

        // Based on activity
        if (activity.last24h.errors > 20) {
            recommendations.push({
                id: `rec_errors_${Date.now()}`,
                priority: 'high',
                action: 'Review error logs and implement fixes',
                reason: `${activity.last24h.errors} errors in last 24h`,
                impact: 'Reduce system instability'
            });
        }

        // Based on insights
        const criticalInsights = insights.filter(i => i.severity === 'critical');
        if (criticalInsights.length > 0) {
            recommendations.push({
                id: `rec_critical_${Date.now()}`,
                priority: 'high',
                action: 'Address critical insights immediately',
                reason: `${criticalInsights.length} critical issues detected`,
                impact: 'Prevent system failures'
            });
        }

        return recommendations;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const knowledgeCompiler = KnowledgeCompiler.getInstance();
