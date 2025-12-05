/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              UNIFIED DATA SERVICE - MATRIX UI                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Zero-config data access for widgets                                      ║
 * ║  Connects to WidgetTDC backend for autonomous data routing               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export interface DataQuery {
  domain: string;
  operation: string;
  params?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  freshness?: 'stale' | 'normal' | 'realtime';
}

export interface DataResult<T = unknown> {
  data: T;
  source: string;
  latency: number;
  cached: boolean;
  timestamp: Date;
}

export interface VidensarkivFile {
  name: string;
  path: string;
  size: number;
}

export interface PrototypeListItem {
  id: string;
  name: string;
  createdAt: string;
  prdId?: string;
  version?: number;
}

export interface GenerationOptions {
  style?: 'modern' | 'minimal' | 'corporate' | 'tdc-brand';
  locale?: string;
  framework?: 'vanilla' | 'tailwind' | 'bootstrap';
}

// ═══════════════════════════════════════════════════════════════════════════
// Unified Data Service Class
// ═══════════════════════════════════════════════════════════════════════════

export class UnifiedDataService {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL: number = 30000; // 30 seconds

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(domain: string, operation: string, params?: unknown): string {
    return `${domain}:${operation}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): { data: unknown; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Generic Query (Autonomous Routing)
  // ═══════════════════════════════════════════════════════════════════════

  async query<T = unknown>(
    domain: string,
    operation: string,
    params?: Record<string, unknown>,
    options?: { priority?: 'low' | 'normal' | 'high'; freshness?: 'stale' | 'normal' | 'realtime' }
  ): Promise<DataResult<T>> {
    const cacheKey = this.getCacheKey(domain, operation, params);

    if (options?.freshness !== 'realtime') {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          data: cached.data as T,
          source: 'cache',
          latency: 0,
          cached: true,
          timestamp: new Date(cached.timestamp),
        };
      }
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/autonomous/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: `${domain}.${operation}`,
          domain,
          operation,
          params,
          priority: options?.priority || 'normal',
          freshness: options?.freshness || 'normal',
        }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const result = await response.json();
      const latency = Date.now() - startTime;

      if (options?.freshness !== 'realtime') {
        this.cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
      }

      return {
        data: result.data as T,
        source: result.meta?.source || 'api',
        latency: result.meta?.latency || latency,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.warn('Using stale cache due to error');
        return {
          data: cached.data as T,
          source: 'cache-fallback',
          latency: 0,
          cached: true,
          timestamp: new Date(cached.timestamp),
        };
      }
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Vidensarkiv (Knowledge Archive) Operations
  // ═══════════════════════════════════════════════════════════════════════

  async listVidensarkivFiles(subfolder?: string): Promise<VidensarkivFile[]> {
    try {
      const result = await this.query<{ files: VidensarkivFile[] }>(
        'filesystem',
        'list_vidensarkiv',
        { subfolder }
      );
      return result.data.files || [];
    } catch (error) {
      console.error('Failed to list vidensarkiv files:', error);
      return [];
    }
  }

  async readVidensarkivFile(filepath: string): Promise<string> {
    const result = await this.query<{ content: string }>(
      'filesystem', 
      'read_vidensarkiv', 
      { filepath }
    );
    return result.data.content;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Neo4j Knowledge Graph Operations
  // ═══════════════════════════════════════════════════════════════════════

  async queryGraph(cypher: string, params?: Record<string, unknown>): Promise<unknown[]> {
    const result = await this.query<{ records: unknown[] }>(
      'graph', 
      'cypher', 
      { query: cypher, params }
    );
    return result.data.records || [];
  }

  async searchGraph(searchTerm: string, limit = 20): Promise<unknown[]> {
    const result = await this.query<{ results: unknown[] }>(
      'graph', 
      'search', 
      { query: searchTerm, limit }
    );
    return result.data.results || [];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Prototype Operations (Direct API - NOT autonomous routing)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate HTML prototype from PRD content
   * Uses direct /api/prototype/generate endpoint
   */
  async generatePrototype(
    prdContent: string, 
    options?: GenerationOptions
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/prototype/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prdContent, 
          options: {
            style: options?.style || 'modern',
            locale: options?.locale || 'da-DK'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      console.log(`✅ Prototype generated in ${Date.now() - startTime}ms`);
      return result.data.html;
    } catch (error) {
      console.error('Prototype generation failed:', error);
      throw error;
    }
  }

  /**
   * Save prototype to database and Neo4j graph
   */
  async savePrototype(
    name: string, 
    htmlContent: string, 
    prdId?: string
  ): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/api/prototype/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, htmlContent, prdId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save prototype');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Save failed');
    }

    return { id: result.data.id };
  }

  /**
   * List all saved prototypes
   */
  async listPrototypes(): Promise<PrototypeListItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/prototype/list`);

      if (!response.ok) {
        throw new Error(`Failed to list prototypes: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.prototypes || [];
    } catch (error) {
      console.error('Failed to list prototypes:', error);
      return [];
    }
  }

  /**
   * Get prototype by ID
   */
  async getPrototype(id: string): Promise<{
    id: string;
    name: string;
    htmlContent: string;
    createdAt: string;
    version?: number;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/prototype/${id}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get prototype: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get prototype:', error);
      return null;
    }
  }

  /**
   * Delete prototype
   */
  async deletePrototype(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/prototype/${id}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete prototype:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // System Health
  // ═══════════════════════════════════════════════════════════════════════

  async getSystemHealth(): Promise<{
    status: string;
    services: Record<string, { healthy: boolean }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch {
      return {
        status: 'unhealthy',
        services: {}
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Singleton Export
// ═══════════════════════════════════════════════════════════════════════════

export const dataService = new UnifiedDataService();
export default dataService;
