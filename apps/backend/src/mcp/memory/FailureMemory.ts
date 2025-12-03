/**
 * Failure Memory Service (In-Memory)
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
    private failures: Failure[] = [];
    private readonly MAX_FAILURES = 5000;

    constructor(_database?: any) {
        // Database parameter ignored - using in-memory storage
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

        this.failures.unshift(failure);

        // Trim old failures
        if (this.failures.length > this.MAX_FAILURES) {
            this.failures = this.failures.slice(0, this.MAX_FAILURES);
        }
    }

    /**
     * Get failure history for a source
     */
    async getFailureHistory(
        sourceName: string,
        limit: number = 50
    ): Promise<Failure[]> {
        return this.failures
            .filter(f => f.sourceName === sourceName)
            .slice(0, limit);
    }

    /**
     * Get successful recovery paths for an error type
     */
    async getRecoveryPaths(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath[]> {
        const matching = this.failures.filter(
            f => f.sourceName === sourceName &&
                f.errorType === errorType &&
                f.recoveryAction
        );

        // Group by recovery action
        const actionGroups = new Map<string, Failure[]>();
        for (const f of matching) {
            const action = f.recoveryAction!;
            if (!actionGroups.has(action)) {
                actionGroups.set(action, []);
            }
            actionGroups.get(action)!.push(f);
        }

        return Array.from(actionGroups.entries()).map(([action, failures]) => {
            const successes = failures.filter(f => f.recoverySuccess).length;
            const totalTime = failures
                .filter(f => f.recoveryTimeMs)
                .reduce((sum, f) => sum + (f.recoveryTimeMs || 0), 0);

            return {
                action,
                successRate: failures.length > 0 ? successes / failures.length : 0,
                averageRecoveryTime: failures.filter(f => f.recoveryTimeMs).length > 0
                    ? totalTime / failures.filter(f => f.recoveryTimeMs).length
                    : 0,
                occurrences: failures.length
            };
        }).sort((a, b) => b.successRate - a.successRate);
    }

    /**
     * Get most recent successful recovery for a source and error
     */
    async getLastSuccessfulRecovery(
        sourceName: string,
        errorType: string
    ): Promise<RecoveryPath | null> {
        const lastSuccess = this.failures.find(
            f => f.sourceName === sourceName &&
                f.errorType === errorType &&
                f.recoverySuccess &&
                f.recoveryAction
        );

        if (!lastSuccess) return null;

        return {
            action: lastSuccess.recoveryAction!,
            successRate: 1.0,
            averageRecoveryTime: lastSuccess.recoveryTimeMs || 0,
            occurrences: 1
        };
    }

    /**
     * Check if a failure pattern is recurring
     */
    async isRecurringFailure(
        sourceName: string,
        errorType: string,
        withinMinutes: number = 60
    ): Promise<boolean> {
        const cutoff = new Date();
        cutoff.setMinutes(cutoff.getMinutes() - withinMinutes);

        const recentCount = this.failures.filter(
            f => f.sourceName === sourceName &&
                f.errorType === errorType &&
                f.occurredAt > cutoff
        ).length;

        return recentCount >= 3; // 3+ failures in timeframe = recurring
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
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentFailures = this.failures.filter(
            f => f.sourceName === sourceName && f.occurredAt > sevenDaysAgo
        );

        const errorTypes = new Set(recentFailures.map(f => f.errorType));
        const withRecovery = recentFailures.filter(f => f.recoveryAction);
        const successfulRecoveries = withRecovery.filter(f => f.recoverySuccess);
        const recoveryTimes = successfulRecoveries
            .filter(f => f.recoveryTimeMs)
            .map(f => f.recoveryTimeMs!);

        return {
            totalFailures: recentFailures.length,
            uniqueErrorTypes: errorTypes.size,
            recoverySuccessRate: withRecovery.length > 0
                ? successfulRecoveries.length / withRecovery.length
                : 0,
            averageRecoveryTime: recoveryTimes.length > 0
                ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
                : 0
        };
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
}
