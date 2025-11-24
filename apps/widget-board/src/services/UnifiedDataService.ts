/**
 * Unified Data Service - Zero-Config Data Access
 * 
 * Simple API for widgets to access any data source
 * without knowing implementation details
 */

export interface DataQuery {
    domain: string;
    operation: string;
    params?: any;
    priority?: 'low' | 'normal' | 'high';
    freshness?: 'stale' | 'normal' | 'realtime';
}

export interface DataResult<T = any> {
    data: T;
    source: string;
    latency: number;
    cached: boolean;
    timestamp: Date;
}

export class UnifiedDataService {
    private baseUrl: string;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTTL: number = 30000; // 30 seconds

    constructor(baseUrl: string = '/api/mcp') {
        this.baseUrl = baseUrl;
    }

    /**
     * Natural language query (AI-powered)
     */
    async ask(question: string): Promise<any> {
        // Parse natural language to structured query
        const query = this.parseNaturalLanguage(question);
        return this.query(query.domain, query.operation, query.params);
    }

    /**
     * Structured query - autonomously routed to best source
     */
    async query<T = any>(
        domain: string,
        operation: string,
        params?: any,
        options?: {
            priority?: 'low' | 'normal' | 'high';
            freshness?: 'stale' | 'normal' | 'realtime';
            widgetId?: string;
        }
    ): Promise<DataResult<T>> {
        const cacheKey = this.getCacheKey(domain, operation, params);

        // Check cache if freshness allows
        if (options?.freshness !== 'realtime') {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached.data,
                    source: 'cache',
                    latency: 0,
                    cached: true,
                    timestamp: new Date(cached.timestamp)
                };
            }
        }

        const startTime = Date.now();

        try {
            const response = await fetch(`${this.baseUrl}/autonomous/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: `${domain}.${operation}`,
                    domain,
                    operation,
                    params,
                    priority: options?.priority || 'normal',
                    freshness: options?.freshness || 'normal',
                    widgetId: options?.widgetId
                })
            });

            if (!response.ok) {
                throw new Error(`Query failed: ${response.statusText}`);
            }

            const result = await response.json();
            const latency = Date.now() - startTime;

            // Cache result
            if (options?.freshness !== 'realtime') {
                this.cache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now()
                });
            }

            return {
                data: result.data,
                source: result.meta?.source || 'unknown',
                latency: result.meta?.latency || latency,
                cached: false,
                timestamp: new Date()
            };
        } catch (error: any) {
            console.error('Query failed:', error);

            // Try cache as fallback
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.warn('Using stale cache due to error');
                return {
                    data: cached.data,
                    source: 'cache-fallback',
                    latency: 0,
                    cached: true,
                    timestamp: new Date(cached.timestamp)
                };
            }

            throw error;
        }
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(
        event: string,
        callback: (data: any) => void
    ): () => void {
        const ws = new WebSocket(`ws://${window.location.host}/mcp/ws`);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'broadcast' && message.message) {
                    callback(message.message);
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Return cleanup function
        return () => {
            ws.close();
        };
    }

    /**
     * Discover available data sources
     */
    async discover(): Promise<{
        name: string;
        type: string;
        capabilities: string[];
        healthy: boolean;
    }[]> {
        try {
            const response = await fetch(`${this.baseUrl}/sources`);
            const data = await response.json();
            return data.sources || [];
        } catch (error) {
            console.error('Discovery failed:', error);
            return [];
        }
    }

    /**
     * Get system health
     */
    async health(): Promise<{
        status: string;
        sources: { name: string; healthy: boolean; score: number }[];
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'unhealthy', sources: [] };
        }
    }

    /**
     * Parse natural language to structured query
     */
    private parseNaturalLanguage(question: string): {
        domain: string;
        operation: string;
        params: any;
    } {
        const lower = question.toLowerCase();

        // Simple pattern matching (can be replaced with actual NLP)
        if (lower.includes('agent')) {
            if (lower.includes('status') || lower.includes('show')) {
                return { domain: 'agents', operation: 'list', params: {} };
            }
            if (lower.includes('trigger') || lower.includes('start')) {
                const match = lower.match(/agent[s]?\s+(\S+)/);
                const agentId = match ? match[1] : null;
                return { domain: 'agents', operation: 'trigger', params: { agentId } };
            }
        }

        if (lower.includes('security') || lower.includes('threat')) {
            if (lower.includes('search') || lower.includes('find')) {
                const query = lower.replace(/search|find|for|security|threat/g, '').trim();
                return { domain: 'security', operation: 'search', params: { query } };
            }
            return { domain: 'security', operation: 'list', params: {} };
        }

        // Default fallback
        return { domain: 'general', operation: 'query', params: { question } };
    }

    /**
     * Cache helpers
     */
    private getCacheKey(domain: string, operation: string, params: any): string {
        return `${domain}.${operation}:${JSON.stringify(params || {})}`;
    }

    private getFromCache(key: string): { data: any; timestamp: number } | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Singleton instance
let dataServiceInstance: UnifiedDataService | null = null;

export function getDataService(): UnifiedDataService {
    if (!dataServiceInstance) {
        dataServiceInstance = new UnifiedDataService();
    }
    return dataServiceInstance;
}
