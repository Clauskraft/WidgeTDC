import neo4j, { Driver, Session, SessionConfig } from 'neo4j-driver';

/**
 * Neo4jService - Hybrid Cloud/Local Graph Database Connection
 * 
 * Automatically switches between:
 * - LOCAL (dev): bolt://localhost:7687 or Docker neo4j:7687
 * - CLOUD (prod): neo4j+s://<id>.databases.neo4j.io (AuraDB)
 * 
 * Features:
 * - Self-healing with automatic reconnection
 * - Connection pooling
 * - Health checks
 * - Singleton pattern
 */
export class Neo4jService {
  private driver: Driver | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;

  constructor() {
    this.connect();
  }

  /**
   * Determines connection URI based on environment
   */
  private getConnectionConfig(): { uri: string; user: string; password: string } {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasCloudUri = process.env.NEO4J_URI?.includes('neo4j.io');

    // Cloud (AuraDB) - when explicitly configured or in production with cloud URI
    if (hasCloudUri) {
      console.log('🌩️  Neo4j Mode: CLOUD (AuraDB)');
      return {
        uri: process.env.NEO4J_URI!,
        user: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || ''
      };
    }

    // Local Docker (default for dev)
    console.log('🐳 Neo4j Mode: LOCAL (Docker)');
    return {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password'
    };
  }

  /**
   * Initializes connection with self-healing retry logic
   */
  private async connect(): Promise<void> {
    if (this.driver || this.isConnecting) return;

    this.isConnecting = true;
    const config = this.getConnectionConfig();

    try {
      console.log(`🔌 Connecting to Neural Graph at ${config.uri}...`);
      
      this.driver = neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.user, config.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 10000, // 10 seconds
          connectionTimeout: 30000, // 30 seconds
        }
      );

      // Verify connectivity
      await this.driver.verifyConnectivity();
      
      console.log('🟢 NEURAL CORTEX CONNECTED - Neo4j is Online');
      this.reconnectAttempts = 0;
      this.isConnecting = false;

    } catch (error: any) {
      console.error('🔴 Failed to connect to Neural Graph:', error.message);
      this.driver = null;
      this.isConnecting = false;
      
      // Self-healing: Retry with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
        console.log(`⏳ Retry attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s...`);
        setTimeout(() => this.connect(), delay);
      } else {
        console.error('💀 Max reconnection attempts reached. Neural Graph is OFFLINE.');
      }
    }
  }

  /**
   * Get a session for graph operations
   * Triggers reconnect if disconnected
   */
  public getSession(config?: SessionConfig): Session {
    if (!this.driver) {
      this.connect();
      throw new Error('Neural Graph is currently offline. Reconnection in progress...');
    }
    return this.driver.session(config);
  }

  /**
   * Execute a Cypher query with automatic session management
   */
  public async query<T = any>(cypher: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a write transaction
   */
  public async write<T = any>(cypher: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.executeWrite(tx => tx.run(cypher, params));
      return result.records.map(record => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Health check for monitoring
   */
  public async checkHealth(): Promise<{ status: string; mode: string; latency?: number }> {
    if (!this.driver) {
      return { status: 'offline', mode: 'unknown' };
    }
    
    const start = Date.now();
    try {
      await this.driver.verifyConnectivity();
      const latency = Date.now() - start;
      const mode = process.env.NEO4J_URI?.includes('neo4j.io') ? 'cloud' : 'local';
      return { status: 'online', mode, latency };
    } catch (e) {
      return { status: 'error', mode: 'unknown' };
    }
  }

  /**
   * Graceful shutdown
   */
  public async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      console.log('🔌 Neural Graph connection closed.');
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.driver !== null;
  }
}

// Singleton instance
export const neo4jService = new Neo4jService();
