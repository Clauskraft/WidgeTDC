/**
 * Decision Engine - AI-Powered Source Selection
 * 
 * Makes intelligent decisions about which data source to use
 * based on learned patterns, current health, and context
 */

import { CognitiveMemory } from '../memory/CognitiveMemory.js';

export interface QueryIntent {
    type: string;
    domain: string;
    operation: string;
    params: any;
    priority?: 'low' | 'normal' | 'high';
    freshness?: 'stale' | 'normal' | 'realtime';
}

export interface DataSource {
    name: string;
    type: string;
    capabilities: string[];
    isHealthy: () => Promise<boolean>;
    estimatedLatency: number;
    costPerQuery: number;
}

export interface SourceScore {
    source: DataSource;
    score: number;
    breakdown: {
        performance: number;
        reliability: number;
        cost: number;
        freshness: number;
        history: number;
    };
    reasoning: string;
}

export interface DecisionResult {
    selectedSource: DataSource;
    score: number;
    confidence: number;
    reasoning: string;
    alternatives: SourceScore[];
}

export class DecisionEngine {
    private memory: CognitiveMemory;

    // Scoring weights (can be tuned based on priority)
    private weights = {
        performance: 0.30,
        reliability: 0.30,
        cost: 0.20,
        freshness: 0.10,
        history: 0.10
    };

    constructor(memory: CognitiveMemory) {
        this.memory = memory;
    }

    /**
     * Analyze query intent to understand requirements
     */
    async analyzeIntent(query: any): Promise<QueryIntent> {
        // Extract intent from query structure
        const intent: QueryIntent = {
            type: query.type || 'unknown',
            domain: query.domain || this.inferDomain(query),
            operation: query.operation || 'read',
            params: query.params || {},
            priority: query.priority || 'normal',
            freshness: query.freshness || 'normal'
        };

        return intent;
    }

    /**
     * Score all available sources for a query
     */
    async scoreAllSources(
        sources: DataSource[],
        intent: QueryIntent
    ): Promise<SourceScore[]> {
        const scores = await Promise.all(
            sources.map(source => this.scoreSource(source, intent))
        );

        // Sort by score descending
        return scores.sort((a, b) => b.score - a.score);
    }

    /**
     * Score a single source for this query
     */
    async scoreSource(
        source: DataSource,
        intent: QueryIntent
    ): Promise<SourceScore> {
        // Adjust weights based on priority
        const weights = this.getWeights(intent);

        // Calculate individual scores
        const performance = await this.scorePerformance(source, intent);
        const reliability = await this.scoreReliability(source, intent);
        const cost = this.scoreCost(source, intent);
        const freshness = this.scoreFreshness(source, intent);
        const history = await this.scoreHistory(source, intent);

        // Weighted total
        const totalScore =
            performance * weights.performance +
            reliability * weights.reliability +
            cost * weights.cost +
            freshness * weights.freshness +
            history * weights.history;

        // Generate reasoning
        const reasoning = this.generateReasoning({
            performance,
            reliability,
            cost,
            freshness,
            history
        }, weights);

        return {
            source,
            score: totalScore,
            breakdown: {
                performance,
                reliability,
                cost,
                freshness,
                history
            },
            reasoning
        };
    }

    /**
     * Make final decision from scored sources
     */
    async decide(
        sources: DataSource[],
        intent: QueryIntent
    ): Promise<DecisionResult> {
        const scored = await this.scoreAllSources(sources, intent);

        if (scored.length === 0) {
            throw new Error('No available sources for this query');
        }

        const best = scored[0];

        // Confidence is based on score gap between #1 and #2
        const confidence = scored.length > 1
            ? Math.min(1.0, (best.score - scored[1].score) / 0.3 + 0.5)
            : 1.0;

        return {
            selectedSource: best.source,
            score: best.score,
            confidence,
            reasoning: best.reasoning,
            alternatives: scored.slice(1, 4) // Top 3 alternatives
        };
    }

    /**
     * Score performance (latency, throughput)
     */
    private async scorePerformance(
        source: DataSource,
        intent: QueryIntent
    ): Promise<number> {
        // Get average latency from memory
        const avgLatency = await this.memory.getAverageLatency(source.name);

        // Normalize: 0-50ms = 1.0, 500ms+ = 0.0
        const latencyScore = Math.max(0, Math.min(1, 1 - (avgLatency / 500)));

        // For high priority queries, penalize slow sources more
        if (intent.priority === 'high' && avgLatency > 200) {
            return latencyScore * 0.5;
        }

        return latencyScore;
    }

    /**
     * Score reliability (uptime, success rate)
     */
    private async scoreReliability(
        source: DataSource,
        intent: QueryIntent
    ): Promise<number> {
        // Current health check
        const isHealthy = await source.isHealthy();
        if (!isHealthy) {
            return 0.0; // Unhealthy source gets zero score
        }

        // Historical success rate
        const successRate = await this.memory.getSuccessRate(
            source.name,
            intent.type
        );

        // Get failure intelligence
        const intelligence = await this.memory.getSourceIntelligence(source.name);

        // Penalize if there were recent failures
        const recentFailurePenalty = Math.min(0.3, intelligence.recentFailures * 0.05);

        return Math.max(0, successRate - recentFailurePenalty);
    }

    /**
     * Score cost (API costs, compute)
     */
    private scoreCost(source: DataSource, intent: QueryIntent): number {
        const cost = source.costPerQuery || 0;

        // Normalize: $0 = 1.0, $0.10+ = 0.0
        const costScore = Math.max(0, Math.min(1, 1 - (cost / 0.1)));

        // For low priority queries, strongly prefer free sources
        if (intent.priority === 'low' && cost > 0) {
            return costScore * 0.5;
        }

        return costScore;
    }

    /**
     * Score data freshness
     */
    private scoreFreshness(source: DataSource, intent: QueryIntent): number {
        // Database sources are typically fresher than cached/file sources
        const freshnessMap: Record<string, number> = {
            'database': 1.0,
            'api': 0.9,
            'cache': 0.5,
            'file': 0.3
        };

        const baseScore = freshnessMap[source.type] || 0.5;

        // Adjust based on required freshness
        if (intent.freshness === 'realtime') {
            return source.type === 'database' || source.type === 'api' ? 1.0 : 0.2;
        } else if (intent.freshness === 'stale') {
            return 1.0; // Don't care about freshness
        }

        return baseScore;
    }

    /**
     * Score based on historical patterns
     */
    private async scoreHistory(
        source: DataSource,
        intent: QueryIntent
    ): Promise<number> {
        // Check if this source has been successful for similar queries
        const historyScore = await this.memory.getSimilarQuerySuccess(
            intent.type,
            intent.params
        );

        return historyScore;
    }

    /**
     * Adjust weights based on query intent
     */
    private getWeights(intent: QueryIntent) {
        const weights = { ...this.weights };

        // High priority: favor performance and reliability
        if (intent.priority === 'high') {
            weights.performance = 0.40;
            weights.reliability = 0.40;
            weights.cost = 0.10;
            weights.freshness = 0.05;
            weights.history = 0.05;
        }

        // Low priority: favor cost
        else if (intent.priority === 'low') {
            weights.performance = 0.15;
            weights.reliability = 0.25;
            weights.cost = 0.40;
            weights.freshness = 0.10;
            weights.history = 0.10;
        }

        // Realtime freshness: favor databases/APIs
        if (intent.freshness === 'realtime') {
            weights.freshness = 0.30;
            weights.performance = 0.25;
            weights.reliability = 0.25;
            weights.cost = 0.15;
            weights.history = 0.05;
        }

        return weights;
    }

    /**
     * Generate human-readable reasoning
     */
    private generateReasoning(
        breakdown: SourceScore['breakdown'],
        weights: typeof this.weights
    ): string {
        const reasons: string[] = [];

        // Find strongest factor
        const factors = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
        const [topFactor, topScore] = factors[0];

        if (topScore > 0.8) {
            reasons.push(`Excellent ${topFactor} (${(topScore * 100).toFixed(0)}%)`);
        } else if (topScore > 0.6) {
            reasons.push(`Good ${topFactor} (${(topScore * 100).toFixed(0)}%)`);
        }

        // Note any weak factors
        for (const [factor, score] of factors) {
            if (score < 0.3 && weights[factor as keyof typeof weights] > 0.15) {
                reasons.push(`Low ${factor} (${(score * 100).toFixed(0)}%)`);
            }
        }

        return reasons.join(', ') || 'Balanced scores across all factors';
    }

    /**
     * Infer domain from query structure
     */
    private inferDomain(query: any): string {
        // Simple heuristics
        if (query.uri?.startsWith('agents://')) return 'agents';
        if (query.uri?.startsWith('security://')) return 'security';
        if (query.tool?.includes('search')) return 'search';
        if (query.tool?.includes('agent')) return 'agents';

        return 'general';
    }
}
