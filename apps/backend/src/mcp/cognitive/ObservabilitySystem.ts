/**
 * Advanced Observability System
 * Distributed tracing, metrics, and logging
 */

export interface Trace {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operation: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: 'success' | 'error' | 'pending';
    tags: Record<string, any>;
    logs: Array<{ timestamp: Date; message: string; level: string }>;
}

export interface Metric {
    name: string;
    value: number;
    type: 'counter' | 'gauge' | 'histogram';
    timestamp: Date;
    tags: Record<string, string>;
}

export class ObservabilitySystem {
    private traces: Map<string, Trace[]> = new Map();
    private metrics: Metric[] = [];
    private activeSpans: Map<string, Trace> = new Map();

    /**
     * Start a new trace span
     */
    startSpan(operation: string, parentSpanId?: string): string {
        const spanId = this.generateId();
        const traceId = parentSpanId
            ? this.findTraceId(parentSpanId)
            : this.generateId();

        const span: Trace = {
            traceId,
            spanId,
            parentSpanId,
            operation,
            startTime: new Date(),
            status: 'pending',
            tags: {},
            logs: [],
        };

        this.activeSpans.set(spanId, span);

        if (!this.traces.has(traceId)) {
            this.traces.set(traceId, []);
        }
        this.traces.get(traceId)!.push(span);

        return spanId;
    }

    /**
     * End a trace span
     */
    endSpan(spanId: string, status: 'success' | 'error' = 'success'): void {
        const span = this.activeSpans.get(spanId);
        if (!span) return;

        span.endTime = new Date();
        span.duration = span.endTime.getTime() - span.startTime.getTime();
        span.status = status;

        this.activeSpans.delete(spanId);
    }

    /**
     * Add tags to a span
     */
    addTags(spanId: string, tags: Record<string, any>): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.tags = { ...span.tags, ...tags };
        }
    }

    /**
     * Add log to a span
     */
    addLog(spanId: string, message: string, level: string = 'info'): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.logs.push({
                timestamp: new Date(),
                message,
                level,
            });
        }
    }

    /**
     * Record a metric
     */
    recordMetric(
        name: string,
        value: number,
        type: Metric['type'] = 'gauge',
        tags: Record<string, string> = {}
    ): void {
        this.metrics.push({
            name,
            value,
            type,
            timestamp: new Date(),
            tags,
        });

        // Keep only last 10000 metrics
        if (this.metrics.length > 10000) {
            this.metrics.shift();
        }
    }

    /**
     * Get trace by ID
     */
    getTrace(traceId: string): Trace[] | undefined {
        return this.traces.get(traceId);
    }

    /**
     * Get metrics by name
     */
    getMetrics(name: string, since?: Date): Metric[] {
        let filtered = this.metrics.filter(m => m.name === name);

        if (since) {
            filtered = filtered.filter(m => m.timestamp >= since);
        }

        return filtered;
    }

    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(
        name: string,
        aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
        since?: Date
    ): number {
        const metrics = this.getMetrics(name, since);

        if (metrics.length === 0) return 0;

        switch (aggregation) {
            case 'sum':
                return metrics.reduce((sum, m) => sum + m.value, 0);
            case 'avg':
                return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
            case 'min':
                return Math.min(...metrics.map(m => m.value));
            case 'max':
                return Math.max(...metrics.map(m => m.value));
            case 'count':
                return metrics.length;
            default:
                return 0;
        }
    }

    /**
     * Get slow traces (duration > threshold)
     */
    getSlowTraces(thresholdMs: number = 1000): Trace[] {
        const allTraces = Array.from(this.traces.values()).flat();
        return allTraces.filter(trace =>
            trace.duration && trace.duration > thresholdMs
        );
    }

    /**
     * Get error traces
     */
    getErrorTraces(): Trace[] {
        const allTraces = Array.from(this.traces.values()).flat();
        return allTraces.filter(trace => trace.status === 'error');
    }

    /**
     * Generate observability dashboard data
     */
    getDashboardData(): {
        totalTraces: number;
        activeSpans: number;
        errorRate: number;
        avgDuration: number;
        slowTraces: number;
        topOperations: Array<{ operation: string; count: number }>;
    } {
        const allTraces = Array.from(this.traces.values()).flat();
        const completedTraces = allTraces.filter(t => t.endTime);
        const errorTraces = allTraces.filter(t => t.status === 'error');

        const avgDuration = completedTraces.length > 0
            ? completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTraces.length
            : 0;

        // Count operations
        const operationCounts = new Map<string, number>();
        allTraces.forEach(trace => {
            operationCounts.set(trace.operation, (operationCounts.get(trace.operation) || 0) + 1);
        });

        const topOperations = Array.from(operationCounts.entries())
            .map(([operation, count]) => ({ operation, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalTraces: allTraces.length,
            activeSpans: this.activeSpans.size,
            errorRate: completedTraces.length > 0 ? errorTraces.length / completedTraces.length : 0,
            avgDuration,
            slowTraces: this.getSlowTraces().length,
            topOperations,
        };
    }

    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private findTraceId(spanId: string): string {
        for (const [traceId, spans] of this.traces.entries()) {
            if (spans.some(s => s.spanId === spanId)) {
                return traceId;
            }
        }
        return this.generateId();
    }
}

export const observabilitySystem = new ObservabilitySystem();
