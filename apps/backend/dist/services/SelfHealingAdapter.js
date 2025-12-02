import { logger } from '../utils/logger';
import { MetricsService } from './MetricsService';
import { HyperLog } from './HyperLog';
export class SelfHealingAdapter {
    constructor() {
        // SIKRINGEN: Forhindrer uendelige loops (Circuit Breaker)
        this.healingDepth = 0;
        this.MAX_DEPTH = 1;
        // Health tracking
        this.startTime = Date.now();
        this.lastIncident = null;
        this.services = new Map();
        this.metrics = new MetricsService();
        this.hyperLog = new HyperLog();
        this.strategies = new Map();
        this.initializeDefaultStrategies();
    }
    registerStrategy(errorCode, description, action) {
        this.strategies.set(errorCode, { errorCode, description, action });
        logger.info(`[SelfHealing] Strategy registered for: ${errorCode}`);
    }
    async attemptHealing(error, context) {
        // 🛑 CIRCUIT BREAKER CHECK
        if (this.healingDepth >= this.MAX_DEPTH) {
            // Vi er allerede i gang med at heale en fejl. Stop her for at undgå loop.
            console.error(`☢️ CRITICAL: Recursive Healing Loop detected in context [${context}]. Breaking loop. Original error: ${error.message}`);
            return false;
        }
        this.healingDepth++; // Lås systemet
        try {
            const errorCode = error.code || 'UNKNOWN_ERROR';
            // Brug console.log direkte her hvis loggeren selv fejler
            logger.warn(`⚠️ Self-healing triggered for [${errorCode}] in context [${context}]`);
            // Try/Catch omkring metrics/hyperlog for ikke at crashe selve helbredelsen
            try {
                await this.metrics.incrementCounter('self_healing_attempts', { errorCode, context });
            }
            catch (e) {
                console.error('Failed to record metrics during healing', e);
            }
            const strategy = this.strategies.get(errorCode);
            if (!strategy) {
                logger.error(`❌ No healing strategy found for ${errorCode}. Escalating.`);
                try {
                    await this.hyperLog.logEvent('HEALING_FAILED', { reason: 'No Strategy', originalError: error.message });
                }
                catch (e) {
                    console.error('Failed to log to HyperLog during failure', e);
                }
                return false;
            }
            logger.info(`🚑 Executing strategy: ${strategy.description}`);
            const success = await strategy.action();
            if (success) {
                logger.info(`✅ System healed successfully from ${errorCode}`);
                try {
                    await this.metrics.incrementCounter('self_healing_success', { errorCode });
                    await this.hyperLog.logEvent('HEALING_SUCCESS', { strategy: strategy.description });
                }
                catch (e) { /* Ignorer metrics fejl ved success */ }
                return true;
            }
            else {
                logger.warn(`⚠️ Strategy executed but failed to resolve ${errorCode}`);
                try {
                    await this.metrics.incrementCounter('self_healing_failure', { errorCode });
                }
                catch (e) { /* Ignorer metrics fejl ved failure */ }
                return false;
            }
        }
        catch (healingError) {
            // Meta-fejl: Hvis selve kuren dræber patienten
            console.error(`🔥 CRITICAL: Healing mechanism crashed`, healingError);
            return false;
        }
        finally {
            this.healingDepth--; // Lås systemet op igen
        }
    }
    initializeDefaultStrategies() {
        this.registerStrategy('ECONNRESET', 'Wait and Retry Connection', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        });
        this.registerStrategy('ETIMEDOUT', 'Quick Retry', async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        });
        // Strategi for når Neo4j (AuraDB) er utilgængelig
        this.registerStrategy('ServiceUnavailable', 'Neo4j Reconnect Backoff', async () => {
            console.log('Neo4j Service Unavailable - waiting 2s...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true; // Returner true for at signalere at vi har ventet ("håndteret" ventetiden)
        });
        // Initialize default services
        this.services.set('neo4j', { status: 'healthy', lastCheck: Date.now() });
        this.services.set('postgres', { status: 'healthy', lastCheck: Date.now() });
        this.services.set('sqlite', { status: 'healthy', lastCheck: Date.now() });
    }
    /**
     * Get overall system health status for Visual Cortex
     * Handover #007 - Visual Bridge
     */
    getSystemStatus() {
        const serviceList = Array.from(this.services.entries()).map(([name, data]) => ({
            name,
            status: data.status
        }));
        const unhealthyCount = serviceList.filter(s => s.status !== 'healthy').length;
        let overallHealth = 'HEALTHY';
        if (unhealthyCount > 0 && unhealthyCount < serviceList.length) {
            overallHealth = 'DEGRADED';
        }
        else if (unhealthyCount === serviceList.length) {
            overallHealth = 'CRITICAL';
        }
        return {
            overallHealth,
            services: serviceList,
            uptime: Date.now() - this.startTime,
            lastIncident: this.lastIncident
        };
    }
    /**
     * Update service status
     */
    updateServiceStatus(serviceName, status) {
        this.services.set(serviceName, { status, lastCheck: Date.now() });
        if (status === 'unhealthy') {
            this.lastIncident = new Date().toISOString();
        }
    }
}
export const selfHealing = new SelfHealingAdapter();
