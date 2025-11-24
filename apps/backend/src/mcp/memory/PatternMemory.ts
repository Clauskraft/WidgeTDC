/**
 * Pattern Memory Service
 * 
 * Records and analyzes query patterns to enable:
 * - Learning which sources are best for which queries
 * - Predictive pre-fetching based on historical patterns
 * - Performance optimization recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface QueryPattern {
    id: string;
    widgetId: string;
    queryType: string;
    querySignature: string;
    sourceUsed: string;
    latencyMs: number;
    resultSize?: number;
    success: boolean;
    userContext?: {
        userId?: string;
        timeOfDay: number;
        dayOfWeek: number;
    };
    timestamp: Date;
}

export interface SimilarQuery {
    pattern: QueryPattern;
    similarity: number;
}

export interface UsagePattern {
    widgetId: string;
    commonSources: string[];
    averageLatency: number;
    timePatterns: {
        hour: number;
        frequency: number;
    }[];
}

export class PatternMemory {
    private db: any; // Will be injected

    constructor(database: any) {
        this.db = database;
    }

    /**
     * Record a query pattern for learning
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
        const id = uuidv4();
        const signature = this.generateSignature(params.queryType, params.queryParams);

        const userContext = {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };

        const pattern: QueryPattern = {
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

        try {
            await this.insertPattern(pattern);
            console.log(`📚 Pattern recorded: ${params.widgetId} → ${params.queryType} (${params.latencyMs}ms)`);
        } catch (error) {
            console.error('Failed to record pattern:', error);
        }
    }

    /**
     * Find similar queries based on signature
     */
    async findSimilarQueries(
        queryType: string,
        queryParams: any,
        limit: number = 10
    ): Promise<SimilarQuery[]> {
        const signature = this.generateSignature(queryType, queryParams);

        try {
            const patterns = await this.queryPatterns(`
        SELECT * FROM mcp_query_patterns
        WHERE query_signature = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `, [signature, limit]);

            return patterns.map(p => ({
                pattern: p,
                similarity: 1.0 // Exact match
            }));
        } catch (error) {
            console.error('Failed to find similar queries:', error);
            return [];
        }
    }

    /**
     * Get widget usage patterns
     */
    async getWidgetPatterns(widgetId: string): Promise<UsagePattern> {
        try {
            const patterns = await this.queryPatterns(`
        SELECT 
          source_used,
          AVG(latency_ms) as avg_latency,
          COUNT(*) as count,
          json_extract(user_context, '$.timeOfDay') as hour
        FROM mcp_query_patterns
        WHERE widget_id = ?
        AND success = 1
        AND timestamp > datetime('now', '-7 days')
        GROUP BY source_used, hour
        ORDER BY count DESC
      `, [widgetId]);

            // Aggregate by source
            const sourceCounts = new Map<string, number>();
            const timePatterns = new Map<number, number>();
            let totalLatency = 0;
            let totalCount = 0;

            for (const p of patterns) {
                sourceCounts.set(
                    p.source_used,
                    (sourceCounts.get(p.source_used) || 0) + p.count
                );

                const hour = parseInt(p.hour || '0');
                timePatterns.set(
                    hour,
                    (timePatterns.get(hour) || 0) + p.count
                );

                totalLatency += p.avg_latency * p.count;
                totalCount += p.count;
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
                averageLatency: totalCount > 0 ? totalLatency / totalCount : 0,
                timePatterns: timePatternArray
            };
        } catch (error) {
            console.error('Failed to get widget patterns:', error);
            return {
                widgetId,
                commonSources: [],
                averageLatency: 0,
                timePatterns: []
            };
        }
    }

    /**
     * Get average latency for a source
     */
    async getAverageLatency(sourceName: string): Promise<number> {
        try {
            const result = await this.queryOne(`
        SELECT AVG(latency_ms) as avg_latency
        FROM mcp_query_patterns
        WHERE source_used = ?
        AND success = 1
        AND timestamp > datetime('now', '-1 day')
      `, [sourceName]);

            return result?.avg_latency || 0;
        } catch (error) {
            console.error('Failed to get average latency:', error);
            return 0;
        }
    }

    /**
     * Get success rate for a source and query type
     */
    async getSuccessRate(sourceName: string, queryType: string): Promise<number> {
        try {
            const result = await this.queryOne(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
        FROM mcp_query_patterns
        WHERE source_used = ?
        AND query_type = ?
        AND timestamp > datetime('now', '-7 days')
      `, [sourceName, queryType]);

            if (!result || result.total === 0) return 0;
            return result.successful / result.total;
        } catch (error) {
            console.error('Failed to get success rate:', error);
            return 0;
        }
    }

    /**
     * Generate query signature for pattern matching
     */
    private generateSignature(queryType: string, queryParams: any): string {
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
    private normalizeParams(params: any): any {
        if (!params) return {};

        // Remove volatile params (timestamps, random IDs, etc.)
        const { timestamp, requestId, ...stable } = params;

        // Sort keys for consistent hashing
        const sorted: any = {};
        Object.keys(stable).sort().forEach(key => {
            sorted[key] = stable[key];
        });

        return sorted;
    }

    /**
     * Database helpers (abstract SQL.js or better-sqlite3)
     */
    private async insertPattern(pattern: QueryPattern): Promise<void> {
        if (this.db.prepare) {
            // better-sqlite3
            const stmt = this.db.prepare(`
        INSERT INTO mcp_query_patterns 
        (id, widget_id, query_type, query_signature, source_used, 
         latency_ms, result_size, success, user_context, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            stmt.run(
                pattern.id,
                pattern.widgetId,
                pattern.queryType,
                pattern.querySignature,
                pattern.sourceUsed,
                pattern.latencyMs,
                pattern.resultSize || null,
                pattern.success ? 1 : 0,
                JSON.stringify(pattern.userContext),
                pattern.timestamp.toISOString()
            );
        } else {
            // SQL.js (async)
            this.db.run(`
        INSERT INTO mcp_query_patterns 
        (id, widget_id, query_type, query_signature, source_used, 
         latency_ms, result_size, success, user_context, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                pattern.id,
                pattern.widgetId,
                pattern.queryType,
                pattern.querySignature,
                pattern.sourceUsed,
                pattern.latencyMs,
                pattern.resultSize || null,
                pattern.success ? 1 : 0,
                JSON.stringify(pattern.userContext),
                pattern.timestamp.toISOString()
            ]);
        }
    }

    private async queryPatterns(sql: string, params: any[]): Promise<any[]> {
        if (this.db.prepare) {
            // better-sqlite3
            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } else {
            // SQL.js
            const stmt = this.db.prepare(sql);
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        }
    }

    private async queryOne(sql: string, params: any[]): Promise<any> {
        if (this.db.prepare) {
            // better-sqlite3
            const stmt = this.db.prepare(sql);
            return stmt.get(...params);
        } else {
            // SQL.js
            const results = await this.queryPatterns(sql, params);
            return results[0] || null;
        }
    }
}
