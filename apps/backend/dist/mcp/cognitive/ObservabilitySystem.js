/**
 * Advanced Observability System
 * Distributed tracing, metrics, and logging
 */
export class ObservabilitySystem {
    constructor() {
        this.traces = new Map();
        this.metrics = [];
        this.activeSpans = new Map();
    }
    /**
     * Start a new trace span
     */
    startSpan(operation, parentSpanId) {
        const spanId = this.generateId();
        const traceId = parentSpanId
            ? this.findTraceId(parentSpanId)
            : this.generateId();
        const span = {
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
        this.traces.get(traceId).push(span);
        return spanId;
    }
    /**
     * End a trace span
     */
    endSpan(spanId, status = 'success') {
        const span = this.activeSpans.get(spanId);
        if (!span)
            return;
        span.endTime = new Date();
        span.duration = span.endTime.getTime() - span.startTime.getTime();
        span.status = status;
        this.activeSpans.delete(spanId);
    }
    /**
     * Add tags to a span
     */
    addTags(spanId, tags) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.tags = { ...span.tags, ...tags };
        }
    }
    /**
     * Add log to a span
     */
    addLog(spanId, message, level = 'info') {
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
    recordMetric(name, value, type = 'gauge', tags = {}) {
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
    getTrace(traceId) {
        return this.traces.get(traceId);
    }
    /**
     * Get metrics by name
     */
    getMetrics(name, since) {
        let filtered = this.metrics.filter(m => m.name === name);
        if (since) {
            filtered = filtered.filter(m => m.timestamp >= since);
        }
        return filtered;
    }
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(name, aggregation, since) {
        const metrics = this.getMetrics(name, since);
        if (metrics.length === 0)
            return 0;
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
    getSlowTraces(thresholdMs = 1000) {
        const allTraces = Array.from(this.traces.values()).flat();
        return allTraces.filter(trace => trace.duration && trace.duration > thresholdMs);
    }
    /**
     * Get error traces
     */
    getErrorTraces() {
        const allTraces = Array.from(this.traces.values()).flat();
        return allTraces.filter(trace => trace.status === 'error');
    }
    /**
     * Generate observability dashboard data
     */
    getDashboardData() {
        const allTraces = Array.from(this.traces.values()).flat();
        const completedTraces = allTraces.filter(t => t.endTime);
        const errorTraces = allTraces.filter(t => t.status === 'error');
        const avgDuration = completedTraces.length > 0
            ? completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTraces.length
            : 0;
        // Count operations
        const operationCounts = new Map();
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
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    findTraceId(spanId) {
        for (const [traceId, spans] of this.traces.entries()) {
            if (spans.some(s => s.spanId === spanId)) {
                return traceId;
            }
        }
        return this.generateId();
    }
}
export const observabilitySystem = new ObservabilitySystem();
