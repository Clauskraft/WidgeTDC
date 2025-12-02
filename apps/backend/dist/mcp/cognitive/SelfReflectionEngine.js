import { neo4jService } from '../../database/Neo4jService';
export class SelfReflectionEngine {
    constructor() {
        this.performanceLog = [];
        this.insights = [];
    }
    /**
     * Log performance data
     */
    logPerformance(metrics) {
        this.performanceLog.push(metrics);
        // Keep only last 1000 entries
        if (this.performanceLog.length > 1000) {
            this.performanceLog.shift();
        }
    }
    /**
     * Analyze error patterns
     */
    analyzeErrorPatterns(agentId) {
        const errors = this.performanceLog.filter(log => !log.success && (!agentId || log.agentId === agentId));
        const errorCounts = new Map();
        errors.forEach(error => {
            if (error.errorType) {
                errorCounts.set(error.errorType, (errorCounts.get(error.errorType) || 0) + 1);
            }
        });
        return errorCounts;
    }
    /**
     * Evaluate strategy effectiveness
     */
    evaluateStrategyEffectiveness(strategy, timeWindow = 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
        const cutoff = new Date(Date.now() - timeWindow);
        const relevant = this.performanceLog.filter(log => log.timestamp > cutoff &&
            log.context.strategy === strategy);
        if (relevant.length === 0) {
            return { successRate: 0, avgDuration: 0, totalAttempts: 0 };
        }
        const successes = relevant.filter(log => log.success).length;
        const totalDuration = relevant.reduce((sum, log) => sum + log.duration, 0);
        return {
            successRate: successes / relevant.length,
            avgDuration: totalDuration / relevant.length,
            totalAttempts: relevant.length,
        };
    }
    /**
     * Generate improvement recommendations
     */
    async generateRecommendations(agentId) {
        const errorPatterns = this.analyzeErrorPatterns(agentId);
        const recommendations = [];
        // Analyze error patterns
        errorPatterns.forEach((count, errorType) => {
            if (count > 5) {
                recommendations.push({
                    pattern: `Frequent ${errorType} errors`,
                    frequency: count,
                    impact: 'negative',
                    recommendation: `Implement better error handling for ${errorType}`,
                    confidence: Math.min(count / 10, 1),
                });
            }
        });
        // Analyze performance trends
        const recentPerformance = this.performanceLog
            .filter(log => log.agentId === agentId)
            .slice(-50);
        if (recentPerformance.length > 10) {
            const successRate = recentPerformance.filter(log => log.success).length / recentPerformance.length;
            if (successRate < 0.7) {
                recommendations.push({
                    pattern: 'Low success rate',
                    frequency: recentPerformance.length,
                    impact: 'negative',
                    recommendation: 'Review task assignment criteria and agent capabilities',
                    confidence: 1 - successRate,
                });
            }
            else if (successRate > 0.95) {
                recommendations.push({
                    pattern: 'High success rate',
                    frequency: recentPerformance.length,
                    impact: 'positive',
                    recommendation: 'Consider taking on more complex tasks',
                    confidence: successRate,
                });
            }
        }
        this.insights = recommendations;
        return recommendations;
    }
    /**
     * Continuous improvement loop
     */
    async runImprovementCycle(agentId) {
        const recommendations = await this.generateRecommendations(agentId);
        // Store insights in Neo4j for long-term learning
        try {
            await neo4jService.connect();
            for (const insight of recommendations) {
                await neo4jService.runQuery(`MERGE (a:Agent {id: $agentId})
           CREATE (i:Insight {
             pattern: $pattern,
             recommendation: $recommendation,
             confidence: $confidence,
             timestamp: datetime()
           })
           CREATE (a)-[:HAS_INSIGHT]->(i)`, {
                    agentId,
                    pattern: insight.pattern,
                    recommendation: insight.recommendation,
                    confidence: insight.confidence,
                });
            }
            await neo4jService.disconnect();
        }
        catch (error) {
            console.error('Failed to store insights:', error);
        }
        console.log(`🔍 Generated ${recommendations.length} improvement recommendations for ${agentId}`);
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary(agentId, days = 7) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const relevant = this.performanceLog.filter(log => log.agentId === agentId && log.timestamp > cutoff);
        const successes = relevant.filter(log => log.success).length;
        const totalDuration = relevant.reduce((sum, log) => sum + log.duration, 0);
        return {
            totalTasks: relevant.length,
            successRate: relevant.length > 0 ? successes / relevant.length : 0,
            avgDuration: relevant.length > 0 ? totalDuration / relevant.length : 0,
            errorBreakdown: this.analyzeErrorPatterns(agentId),
        };
    }
}
export const selfReflectionEngine = new SelfReflectionEngine();
