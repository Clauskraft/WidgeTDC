/**
 * Self-Healing Adapter Base Class
 *
 * Wraps data providers with intelligent self-healing capabilities:
 * - Auto-reconnection
 * - Circuit breaker pattern
 * - Intelligent fallback
 * - Health monitoring
 */
export class SelfHealingAdapter {
    constructor(provider, memory, fallback) {
        // Circuit breaker state
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.failureThreshold = 5;
        this.lastFailureTime = 0;
        this.resetTimeout = 60000; // 1 minute
        // Auto-reconnection
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.backoffMs = [1000, 2000, 5000, 10000, 30000];
        // Fallback
        this.fallbackProvider = null;
        this.provider = provider;
        this.name = provider.name;
        this.type = provider.type;
        this.memory = memory;
        this.fallbackProvider = fallback || null;
        // Start health monitoring
        this.startHealthMonitoring();
    }
    /**
     * Query with self-healing capabilities
     */
    async query(operation, params) {
        // Check circuit breaker
        if (this.circuitState === 'OPEN') {
            if (this.shouldAttemptRecovery()) {
                this.circuitState = 'HALF_OPEN';
                console.log(`🔄 Circuit breaker HALF_OPEN for ${this.name}`);
            }
            else {
                // Circuit open - use fallback immediately
                return this.fallbackQuery(operation, params);
            }
        }
        const startTime = Date.now();
        try {
            const result = await this.provider.query(operation, params);
            // Success - reset circuit breaker
            if (this.circuitState === 'HALF_OPEN') {
                this.circuitState = 'CLOSED';
                this.failureCount = 0;
                console.log(`✅ Circuit breaker CLOSED for ${this.name} - recovered`);
            }
            // Record successful metrics
            const latency = Date.now() - startTime;
            await this.recordMetrics(latency, true);
            return result;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            // Record failure
            await this.recordMetrics(latency, false);
            await this.memory.recordFailure({
                sourceName: this.name,
                error,
                queryContext: { operation, params }
            });
            // Handle based on error type
            return this.handleError(error, operation, params);
        }
    }
    /**
     * Health check with self-healing
     */
    async health() {
        try {
            const health = await this.provider.health();
            // If unhealthy, attempt healing
            if (!health.healthy) {
                await this.attemptHealing();
            }
            return health;
        }
        catch (error) {
            console.error(`Health check failed for ${this.name}:`, error.message);
            return {
                healthy: false,
                score: 0,
                message: error.message
            };
        }
    }
    /**
     * Intelligent error handling
     */
    async handleError(error, operation, params) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        // Trip circuit breaker if threshold reached
        if (this.failureCount >= this.failureThreshold) {
            this.circuitState = 'OPEN';
            console.error(`🚨 Circuit breaker OPEN for ${this.name} after ${this.failureCount} failures`);
            // Trigger healing in background
            this.attemptHealing().catch(console.error);
        }
        // Classify error
        if (this.isTransientError(error)) {
            console.log(`⚠️  Transient error on ${this.name}, retrying...`);
            return this.retryWithBackoff(operation, params);
        }
        if (this.isConnectionError(error)) {
            console.log(`🔌 Connection error on ${this.name}, attempting reconnection...`);
            await this.attemptReconnection();
            return this.query(operation, params); // Retry after reconnect
        }
        // For non-recoverable errors, use fallback
        return this.fallbackQuery(operation, params);
    }
    /**
     * Retry with exponential backoff
     */
    async retryWithBackoff(operation, params, attempt = 0) {
        if (attempt >= 3) {
            // Max retries reached, use fallback
            return this.fallbackQuery(operation, params);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);
        try {
            return await this.provider.query(operation, params);
        }
        catch (error) {
            return this.retryWithBackoff(operation, params, attempt + 1);
        }
    }
    /**
     * Auto-reconnection logic
     */
    async attemptReconnection() {
        console.log(`🔧 Attempting reconnection to ${this.name}...`);
        const startTime = Date.now();
        while (this.reconnectAttempts < this.maxReconnectAttempts) {
            try {
                // Disconnect
                if ('disconnect' in this.provider && typeof this.provider.disconnect === 'function') {
                    await this.provider.disconnect();
                }
                // Wait with backoff
                await this.sleep(this.backoffMs[this.reconnectAttempts]);
                // Reconnect
                if ('connect' in this.provider && typeof this.provider.connect === 'function') {
                    await this.provider.connect();
                }
                // Test connection
                await this.provider.health();
                const recoveryTime = Date.now() - startTime;
                console.log(`✅ Reconnected to ${this.name} in ${recoveryTime}ms`);
                // Record successful recovery
                await this.memory.recordFailure({
                    sourceName: this.name,
                    error: new Error('Connection lost'),
                    recoveryAction: 'reconnection',
                    recoverySuccess: true,
                    recoveryTimeMs: recoveryTime
                });
                this.reconnectAttempts = 0;
                return;
            }
            catch (error) {
                this.reconnectAttempts++;
                console.warn(`⚠️  Reconnection attempt ${this.reconnectAttempts} failed for ${this.name}`);
            }
        }
        // Max attempts reached
        const recoveryTime = Date.now() - startTime;
        await this.memory.recordFailure({
            sourceName: this.name,
            error: new Error('Failed to reconnect'),
            recoveryAction: 'reconnection',
            recoverySuccess: false,
            recoveryTimeMs: recoveryTime
        });
        throw new Error(`Failed to reconnect to ${this.name} after ${this.reconnectAttempts} attempts`);
    }
    /**
     * Attempt general healing
     */
    async attemptHealing() {
        // Check memory for known recovery paths
        const intelligence = await this.memory.getSourceIntelligence(this.name);
        if (intelligence.lastFailure) {
            const recoveryPaths = await this.memory.getRecoveryPaths(this.name, intelligence.lastFailure.errorType);
            if (recoveryPaths.length > 0 && recoveryPaths[0].successRate > 0.7) {
                const action = recoveryPaths[0].action;
                console.log(`🧠 Using learned recovery: ${action}`);
                // Execute learned recovery action
                // (Implementation depends on action type)
            }
        }
        // Default: attempt reconnection
        await this.attemptReconnection().catch(console.error);
    }
    /**
     * Fallback to alternative source
     */
    async fallbackQuery(operation, params) {
        if (!this.fallbackProvider) {
            throw new Error(`No fallback available for ${this.name}`);
        }
        console.log(`🔄 Using fallback: ${this.fallbackProvider.name}`);
        try {
            const result = await this.fallbackProvider.query(operation, params);
            // Record successful fallback
            await this.memory.recordFailure({
                sourceName: this.name,
                error: new Error('Primary source unavailable'),
                recoveryAction: `fallback:${this.fallbackProvider.name}`,
                recoverySuccess: true
            });
            return result;
        }
        catch (error) {
            // Fallback also failed
            await this.memory.recordFailure({
                sourceName: this.name,
                error,
                recoveryAction: `fallback:${this.fallbackProvider.name}`,
                recoverySuccess: false
            });
            // Return gracefully degraded result
            return this.gracefulDegradation(operation, params);
        }
    }
    /**
     * Graceful degradation - return safe default
     */
    gracefulDegradation(operation, params) {
        console.warn(`⚠️  Graceful degradation for ${this.name}`);
        // Return empty but valid response based on operation
        const defaults = {
            'list': [],
            'get': null,
            'search': { results: [], total: 0 },
            'count': 0
        };
        return defaults[operation] || null;
    }
    /**
     * Record health metrics
     */
    async recordMetrics(latencyMs, success) {
        // Would update rolling metrics and record to health table
        // Simplified for now
    }
    /**
     * Start periodic health monitoring
     */
    startHealthMonitoring() {
        setInterval(async () => {
            try {
                const health = await this.health();
                // Record to memory
                await this.memory.recordHealthMetrics({
                    sourceName: this.name,
                    healthScore: health.score,
                    latency: {
                        p50: health.latency || 0,
                        p95: health.latency || 0,
                        p99: health.latency || 0
                    },
                    successRate: health.healthy ? 1.0 : 0.0,
                    requestCount: 0,
                    errorCount: 0,
                    timestamp: new Date()
                });
            }
            catch (error) {
                console.error(`Health monitoring error for ${this.name}:`, error);
            }
        }, 30000); // Every 30 seconds
    }
    /**
     * Check if should attempt recovery from open circuit
     */
    shouldAttemptRecovery() {
        return Date.now() - this.lastFailureTime > this.resetTimeout;
    }
    /**
     * Classify error types
     */
    isTransientError(error) {
        const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
        return transientCodes.includes(error.code) || error.statusCode === 429;
    }
    isConnectionError(error) {
        return error.code === 'ECONNREFUSED' ||
            error.code === 'ENOTFOUND' ||
            error.message?.includes('connect');
    }
    /**
     * Utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
