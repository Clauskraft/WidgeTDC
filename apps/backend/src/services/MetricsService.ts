/**
 * MetricsService - Dashboard & Monitoring Integration
 * 
 * Tracks system health metrics for:
 * - Self-healing events
 * - Database connections
 * - API performance
 * - Error rates
 */

interface MetricLabels {
  [key: string]: string;
}

interface Metric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

export class MetricsService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private historyBuffer: Metric[] = [];
  private maxHistorySize = 1000;

  /**
   * Increment a counter metric
   */
  async incrementCounter(name: string, labels: MetricLabels = {}): Promise<void> {
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
  async setGauge(name: string, value: number, labels: MetricLabels = {}): Promise<void> {
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
  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get current value of a gauge
   */
  getGauge(name: string, labels: MetricLabels = {}): number {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get all metrics for dashboard
   */
  getAllMetrics(): { counters: Record<string, number>; gauges: Record<string, number> } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges)
    };
  }

  /**
   * Get recent metric history
   */
  getHistory(limit: number = 100): Metric[] {
    return this.historyBuffer.slice(-limit);
  }

  /**
   * Export metrics in Prometheus format (for Grafana)
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];
    
    for (const [key, value] of this.counters) {
      lines.push(`widgetdc_${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`);
    }
    
    for (const [key, value] of this.gauges) {
      lines.push(`widgetdc_${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`);
    }
    
    return lines.join('\n');
  }

  private buildKey(name: string, labels: MetricLabels): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  private recordToHistory(metric: Metric): void {
    this.historyBuffer.push(metric);
    if (this.historyBuffer.length > this.maxHistorySize) {
      this.historyBuffer.shift();
    }
  }
}

// Singleton for global access
export const metricsService = new MetricsService();
