/**
 * MetricsService - Dashboard & Monitoring Integration
 *
 * Tracks system health metrics for:
 * - Self-healing events
 * - Database connections
 * - API performance
 * - Error rates
 */
export class MetricsService {
    constructor() {
        this.counters = new Map();
        this.gauges = new Map();
        this.historyBuffer = [];
        this.maxHistorySize = 1000;
    }
    /**
     * Increment a counter metric
     */
    async incrementCounter(name, labels = {}) {
        const key = this.buildKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + 1);
        this.recordToHistory({
            name,
            value: current + 1,
            labels,
            timestamp: Date.now()
        });
        // Log for debugging
        console.log(`📊 [Metrics] ${name}: ${current + 1}`, labels);
    }
    /**
     * Set a gauge metric (point-in-time value)
     */
    async setGauge(name, value, labels = {}) {
        const key = this.buildKey(name, labels);
        this.gauges.set(key, value);
        this.recordToHistory({
            name,
            value,
            labels,
            timestamp: Date.now()
        });
    }
    /**
     * Get current value of a counter
     */
    getCounter(name, labels = {}) {
        const key = this.buildKey(name, labels);
        return this.counters.get(key) || 0;
    }
    /**
     * Get current value of a gauge
     */
    getGauge(name, labels = {}) {
        const key = this.buildKey(name, labels);
        return this.gauges.get(key) || 0;
    }
    /**
     * Get all metrics for dashboard
     */
    getAllMetrics() {
        return {
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges)
        };
    }
    /**
     * Get recent metric history
     */
    getHistory(limit = 100) {
        return this.historyBuffer.slice(-limit);
    }
    /**
     * Export metrics in Prometheus format (for Grafana)
     */
    toPrometheusFormat() {
        const lines = [];
        for (const [key, value] of this.counters) {
            lines.push(`widgetdc_${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`);
        }
        for (const [key, value] of this.gauges) {
            lines.push(`widgetdc_${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`);
        }
        return lines.join('\n');
    }
    buildKey(name, labels) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }
    recordToHistory(metric) {
        this.historyBuffer.push(metric);
        if (this.historyBuffer.length > this.maxHistorySize) {
            this.historyBuffer.shift();
        }
    }
}
// Singleton for global access
export const metricsService = new MetricsService();
