/**
 * MCP (Model Context Protocol) Client
 * Enterprise-grade WebSocket client with authentication, retry logic, and circuit breaker
 */

import { getEnvConfig } from './env-validation';
import { generateSecureToken } from './security';

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'closed',    // Normal operation
  OPEN = 'open',        // Failing, reject requests
  HALF_OPEN = 'half_open', // Testing if service recovered
}

/**
 * MCP Message interface
 */
export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP Client configuration
 */
export interface MCPClientConfig {
  url: string;
  authToken?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  requestTimeout?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
}

/**
 * Circuit Breaker pattern implementation
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private threshold: number,
    private timeout: number
  ) {}

  /**
   * Check if request should be allowed
   */
  public allowRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow limited requests
    return true;
  }

  /**
   * Record successful request
   */
  public recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // After 3 successful requests, close the circuit
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  /**
   * Record failed request
   */
  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

/**
 * MCP Client with enterprise features
 */
export class MCPClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private config: Required<MCPClientConfig>;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: number;
  }> = new Map();
  private circuitBreaker: CircuitBreaker;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: MCPClientConfig) {
    const envConfig = getEnvConfig();

    this.config = {
      url: config.url || envConfig.MCP_SERVER_URL,
      authToken: config.authToken,
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      requestTimeout: config.requestTimeout ?? 10000,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 60000,
    };

    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreakerThreshold,
      this.config.circuitBreakerTimeout
    );
  }

  /**
   * Connect to MCP server
   */
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      return;
    }

    if (!this.circuitBreaker.allowRequest()) {
      throw new Error('Circuit breaker is open, connection not allowed');
    }

    this.state = ConnectionState.CONNECTING;
    this.emit('state-change', this.state);

    try {
      await this.establishConnection();
      this.circuitBreaker.recordSuccess();
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Establish WebSocket connection
   */
  private establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Build connection URL with auth token
        let url = this.config.url;
        if (this.config.authToken) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}token=${encodeURIComponent(this.config.authToken)}`;
        }

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          this.emit('state-change', this.state);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.handleDisconnection();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: MCPMessage = JSON.parse(data);

      // Handle responses to pending requests
      if (message.type === 'response' || message.type === 'error') {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);

          if (message.type === 'error' || message.error) {
            pending.reject(new Error(message.error?.message || 'Unknown error'));
          } else {
            pending.resolve(message.result);
          }
        }
      }

      // Handle events
      if (message.type === 'event' && message.method) {
        this.emit(message.method, message.params);
      }

    } catch (error) {
      console.error('Failed to parse MCP message:', error);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    this.stopHeartbeat();
    const wasConnected = this.state === ConnectionState.CONNECTED;

    this.state = ConnectionState.DISCONNECTED;
    this.ws = null;
    this.emit('disconnected');
    this.emit('state-change', this.state);

    // Reject all pending requests
    this.pendingRequests.forEach(pending => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    // Attempt reconnection if enabled
    if (wasConnected && this.config.autoReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.state = ConnectionState.FAILED;
      this.emit('reconnect-failed');
      this.emit('state-change', this.state);
      return;
    }

    this.reconnectAttempts++;
    this.state = ConnectionState.RECONNECTING;
    this.emit('reconnecting', this.reconnectAttempts);
    this.emit('state-change', this.state);

    // Exponential backoff: first retry happens at base delay (reconnectDelay), subsequent retries double the delay
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(() => {
        // Will be handled by attemptReconnect being called again
      });
    }, Math.min(delay, 30000)); // Max 30 seconds
  }

  /**
   * Send request and wait for response
   */
  public async request(method: string, params?: any): Promise<any> {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to MCP server');
    }

    if (!this.circuitBreaker.allowRequest()) {
      throw new Error('Circuit breaker is open, request not allowed');
    }

    const id = generateSecureToken(16);
    const message: MCPMessage = {
      id,
      type: 'request',
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(id);
        this.circuitBreaker.recordFailure();
        reject(new Error('Request timeout'));
      }, this.config.requestTimeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.ws!.send(JSON.stringify(message));
        this.circuitBreaker.recordSuccess();
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        this.circuitBreaker.recordFailure();
        reject(error);
      }
    });
  }

  /**
   * Send event (fire and forget)
   */
  public send(method: string, params?: any): void {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to MCP server');
    }

    const message: MCPMessage = {
      id: generateSecureToken(16),
      type: 'event',
      method,
      params,
    };

    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.state === ConnectionState.CONNECTED) {
        this.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this.emit('state-change', this.state);
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get circuit breaker state
   */
  public getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  public resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Add event listener
   */
  public on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  public off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}
