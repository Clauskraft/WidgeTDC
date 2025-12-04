/**
 * Pattern Memory Service (In-Memory)
 *
 * Records and analyzes query patterns to enable:
 * - Learning which sources are best for which queries
 * - Predictive pre-fetching based on historical patterns
 * - Performance optimization recommendations
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
export class PatternMemory {
    constructor(_database) {
        this.patterns = [];
        this.MAX_PATTERNS = 10000;
        // Database parameter ignored - using in-memory storage
    }
    /**
     * Record a query pattern for learning
     */
    async recordQuery(params) {
        const id = uuidv4();
        const signature = this.generateSignature(params.queryType, params.queryParams);
        const userContext = {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };
        const pattern = {
            id,
            widgetId: params.widgetId,
            queryType: params.queryType,
            querySignature: signature,
            sourceUsed: params.sourceUsed,
            latencyMs: params.latencyMs,
            resultSize: params.resultSize,
            success: params.success,
            userContext,
            timestamp: new Date()
        };
        this.patterns.unshift(pattern);
        // Trim old patterns
        if (this.patterns.length > this.MAX_PATTERNS) {
            this.patterns = this.patterns.slice(0, this.MAX_PATTERNS);
        }
    }
    /**
     * Find similar queries based on signature
     */
    async findSimilarQueries(queryType, queryParams, limit = 10) {
        const signature = this.generateSignature(queryType, queryParams);
        const matching = this.patterns
            .filter(p => p.querySignature === signature)
            .slice(0, limit);
        return matching.map(p => ({
            pattern: p,
            similarity: 1.0 // Exact match
        }));
    }
    /**
     * Get widget usage patterns
     */
    async getWidgetPatterns(widgetId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const widgetPatterns = this.patterns.filter(p => p.widgetId === widgetId && p.success && p.timestamp > sevenDaysAgo);
        // Aggregate by source
        const sourceCounts = new Map();
        const timePatterns = new Map();
        let totalLatency = 0;
        for (const p of widgetPatterns) {
            sourceCounts.set(p.sourceUsed, (sourceCounts.get(p.sourceUsed) || 0) + 1);
            const hour = p.userContext?.timeOfDay || 0;
            timePatterns.set(hour, (timePatterns.get(hour) || 0) + 1);
            totalLatency += p.latencyMs;
        }
        // Sort sources by usage
        const commonSources = Array.from(sourceCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([source]) => source);
        // Format time patterns
        const timePatternArray = Array.from(timePatterns.entries())
            .map(([hour, frequency]) => ({ hour, frequency }))
            .sort((a, b) => b.frequency - a.frequency);
        return {
            widgetId,
            commonSources,
            averageLatency: widgetPatterns.length > 0 ? totalLatency / widgetPatterns.length : 0,
            timePatterns: timePatternArray
        };
    }
    /**
     * Get average latency for a source
     */
    async getAverageLatency(sourceName) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const sourcePatterns = this.patterns.filter(p => p.sourceUsed === sourceName && p.success && p.timestamp > oneDayAgo);
        if (sourcePatterns.length === 0)
            return 0;
        const totalLatency = sourcePatterns.reduce((sum, p) => sum + p.latencyMs, 0);
        return totalLatency / sourcePatterns.length;
    }
    /**
     * Get success rate for a source and query type
     */
    async getSuccessRate(sourceName, queryType) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const matching = this.patterns.filter(p => p.sourceUsed === sourceName &&
            p.queryType === queryType &&
            p.timestamp > sevenDaysAgo);
        if (matching.length === 0)
            return 0;
        const successCount = matching.filter(p => p.success).length;
        return successCount / matching.length;
    }
    /**
     * Generate query signature for pattern matching
     */
    generateSignature(queryType, queryParams) {
        const normalized = JSON.stringify({
            type: queryType,
            params: this.normalizeParams(queryParams)
        });
        return crypto.createHash('sha256')
            .update(normalized)
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Normalize query params for signature generation
     */
    normalizeParams(params) {
        if (!params)
            return {};
        // Remove volatile params (timestamps, random IDs, etc.)
        const { timestamp, requestId, ...stable } = params;
        // Sort keys for consistent hashing
        const sorted = {};
        Object.keys(stable).sort().forEach(key => {
            sorted[key] = stable[key];
        });
        return sorted;
    }
}
