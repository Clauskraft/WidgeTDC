/**
 * Failure Memory Service
 * 
 * Records and learns from failures to enable:
 * - Self-healing by remembering successful recovery paths
 * - Avoiding known failure scenarios
 * - Predicting failures before they happen
 */

import { v4 as uuidv4 } from 'uuid';

export interface Failure {
    id: string;
    sourceName: string;
    errorType: string;
    errorMessage: string;
    errorContext: any;
    queryContext: any;
    recoveryAction?: string;
    recoverySuccess?: boolean;
    recoveryTimeMs?: number;
    occurredAt: Date;
}

export interface RecoveryPath {
    action: string;
    successRate: number;
    averageRecoveryTime: number;
    occurrences: number;
}

export class FailureMemory {
    private db: any;

    constructor(database: any) {
        this.db = database;
    }

    /**
     * Record a failure for learning
     */
    async recordFailure(params: {
        sourceName: string;
        error: Error;
        queryContext?: any;
        recoveryAction?: string;
        recoverySuccess?: boolean;
        recoveryTimeMs?: number;
    }): Promise<void> {
        const id = uuidv4();

        const failure: Failure = {
            id,
            sourceName: params.sourceName,
            errorType: params.error.name || 'Error',
            errorMessage: params.error.message,
            errorContext: {
                stack: params.error.stack,
                ...this.extractErrorContext(params.error)
            },
            queryContext: params.queryContext || {},
            recoveryAction: params.recoveryAction,
            recoverySuccess: params.recoverySuccess,
            recoveryTimeMs: params.recoveryTimeMs,
            occurredAt: new Date()
        };

        try {
            await this.insertFailure(failure);
            console.log(`💾 Failure recorded: ${params.sourceName} - ${params.error.message}`);
        } catch (error) {
            console.error('Failed to record failure:', error);
        }
    }

    /**
     * Get failure history for a source
     */
    async getFailureHistory(
        sourceName: string,
        limit: number = 50
    ): Promise<Failure[]> {
        try {
            const results = await this.query(`
        SELECT * FROM mcp_failure_memory
        WHERE source_name = ?
        ORDER BY occurred_at DESC
        LIMIT ?
      `, [sourceName, limit]);

            return results.map(this.parseFailure);
        } catch (error) {
            console.error('Failed to get failure history:', error);
            return [];
        }
    }

    /**
     * Get successful recovery paths for an error type
     */
    async getRecoveryPaths(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath[]> {
        try {
            const results = await this.query(`
        SELECT 
          recovery_action,
          COUNT(*) as occurrences,
          SUM(CASE WHEN recovery_success = 1 THEN 1 ELSE 0 END) as successes,
          AVG(recovery_time_ms) as avg_recovery_time
        FROM mcp_failure_memory
        WHERE source_name = ?
        AND error_type = ?
        AND recovery_action IS NOT NULL
        GROUP BY recovery_action
        ORDER BY successes DESC, occurrences DESC
      `, [sourceName, errorType]);

            return results.map(r => ({
                action: r.recovery_action,
                successRate: r.occurrences > 0 ? r.successes / r.occurrences : 0,
                averageRecoveryTime: r.avg_recovery_time || 0,
                occurrences: r.occurrences
            }));
        } catch (error) {
            console.error('Failed to get recovery paths:', error);
            return [];
        }
    }

    /**
     * Get most recent successful recovery for a source and error
     */
    async getLastSuccessfulRecovery(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath | null> {
        try {
            const result = await this.queryOne(`
        SELECT 
          recovery_action,
          recovery_time_ms
        FROM mcp_failure_memory
        WHERE source_name = ?
        AND error_type = ?
        AND recovery_success = 1
        AND recovery_action IS NOT NULL
        ORDER BY occurred_at DESC
        LIMIT 1
      `, [sourceName, errorType]);

            if (!result) return null;

            return {
                action: result.recovery_action,
                successRate: 1.0,
                averageRecoveryTime: result.recovery_time_ms || 0,
                occurrences: 1
            };
        } catch (error) {
            console.error('Failed to get last successful recovery:', error);
            return null;
        }
    }

    /**
     * Check if a failure pattern is recurring
     */
    async isRecurringFailure(
        sourceName: string,
        errorType: string,
        withinMinutes: number = 60
    ): Promise<boolean> {
        try {
            const result = await this.queryOne(`
        SELECT COUNT(*) as count
        FROM mcp_failure_memory
        WHERE source_name = ?
        AND error_type = ?
        AND occurred_at > datetime('now', ? || ' minutes')
      `, [sourceName, errorType, -withinMinutes]);

            return (result?.count || 0) >= 3; // 3+ failures in timeframe = recurring
        } catch (error) {
            console.error('Failed to check recurring failure:', error);
            return false;
        }
    }

    /**
     * Get failure statistics for a source
     */
    async getFailureStats(sourceName: string): Promise<{
        totalFailures: number;
        uniqueErrorTypes: number;
        recoverySuccessRate: number;
        averageRecoveryTime: number;
    }> {
        try {
            const result = await this.queryOne(`
        SELECT 
          COUNT(*) as total_failures,
          COUNT(DISTINCT error_type) as unique_errors,
          SUM(CASE WHEN recovery_success = 1 THEN 1 ELSE 0 END) as successful_recoveries,
          AVG(CASE WHEN recovery_success = 1 THEN recovery_time_ms END) as avg_recovery_time
        FROM mcp_failure_memory
        WHERE source_name = ?
        AND occurred_at > datetime('now', '-7 days')
      `, [sourceName]);

            return {
                totalFailures: result?.total_failures || 0,
                uniqueErrorTypes: result?.unique_errors || 0,
                recoverySuccessRate: result?.total_failures > 0
                    ? (result.successful_recoveries || 0) / result.total_failures
                    : 0,
                averageRecoveryTime: result?.avg_recovery_time || 0
            };
        } catch (error) {
            console.error('Failed to get failure stats:', error);
            return {
                totalFailures: 0,
                uniqueErrorTypes: 0,
                recoverySuccessRate: 0,
                averageRecoveryTime: 0
            };
        }
    }

    /**
     * Extract useful context from error
     */
    private extractErrorContext(error: any): any {
        const context: any = {};

        // Network errors
        if (error.code) {
            context.code = error.code;
        }
        if (error.errno) {
            context.errno = error.errno;
        }
        if (error.syscall) {
            context.syscall = error.syscall;
        }

        // HTTP errors
        if (error.statusCode) {
            context.statusCode = error.statusCode;
        }
        if (error.response) {
            context.responseStatus = error.response.status;
        }

        // Database errors
        if (error.sql) {
            context.sql = error.sql;
        }

        return context;
    }

    /**
     * Database helpers
     */
    private async insertFailure(failure: Failure): Promise<void> {
        const sql = `
      INSERT INTO mcp_failure_memory 
      (id, source_name, error_type, error_message, error_context, 
       recovery_action, recovery_success, recovery_time_ms, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            failure.id,
            failure.sourceName,
            failure.errorType,
            failure.errorMessage,
            JSON.stringify(failure.errorContext),
            failure.recoveryAction || null,
            failure.recoverySuccess !== undefined ? (failure.recoverySuccess ? 1 : 0) : null,
            failure.recoveryTimeMs || null,
            failure.occurredAt.toISOString()
        ];

        if (this.db.prepare) {
            const stmt = this.db.prepare(sql);
            stmt.run(...params);
        } else {
            this.db.run(sql, params);
        }
    }

    private parseFailure(row: any): Failure {
        return {
            id: row.id,
            sourceName: row.source_name,
            errorType: row.error_type,
            errorMessage: row.error_message,
            errorContext: JSON.parse(row.error_context || '{}'),
            queryContext: row.query_context ? JSON.parse(row.query_context) : {},
            recoveryAction: row.recovery_action,
            recoverySuccess: row.recovery_success === 1,
            recoveryTimeMs: row.recovery_time_ms,
            occurredAt: new Date(row.occurred_at)
        };
    }

    private async query(sql: string, params: any[]): Promise<any[]> {
        if (this.db.prepare) {
            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } else {
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
            const stmt = this.db.prepare(sql);
            return stmt.get(...params);
        } else {
            const results = await this.query(sql, params);
            return results[0] || null;
        }
    }
}
