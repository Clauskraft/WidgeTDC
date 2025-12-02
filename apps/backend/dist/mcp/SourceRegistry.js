/**
 * Simple Source Registry Implementation
 *
 * Manages available data sources and matches them to query intents
 */
export class SourceRegistryImpl {
    constructor() {
        this.sources = new Map();
    }
    /**
     * Register a new data source
     */
    registerSource(source) {
        this.sources.set(source.name, source);
        console.log(`📌 Registered source: ${source.name} (${source.type})`);
    }
    /**
     * Get sources capable of handling a query intent
     */
    getCapableSources(intent) {
        const capable = [];
        for (const source of this.sources.values()) {
            if (this.canHandle(source, intent)) {
                capable.push(source);
            }
        }
        return capable;
    }
    /**
     * Get all registered sources
     */
    getAllSources() {
        return Array.from(this.sources.values());
    }
    /**
     * Get source by name
     */
    getSource(name) {
        return this.sources.get(name);
    }
    /**
     * Check if source can handle intent
     */
    canHandle(source, intent) {
        // Check if source has wildcard capability
        if (source.capabilities.includes('*')) {
            return true;
        }
        // Check for domain.operation match
        const fullType = `${intent.domain}.${intent.operation}`;
        if (source.capabilities.includes(fullType)) {
            return true;
        }
        // Check for domain.* match
        const domainWildcard = `${intent.domain}.*`;
        if (source.capabilities.includes(domainWildcard)) {
            return true;
        }
        // Check for simple type match
        if (source.capabilities.includes(intent.type)) {
            return true;
        }
        return false;
    }
    /**
     * Get sources by type
     */
    getSourcesByType(type) {
        return Array.from(this.sources.values())
            .filter(s => s.type === type);
    }
    /**
     * Remove a source
     */
    unregisterSource(name) {
        return this.sources.delete(name);
    }
    /**
     * Clear all sources
     */
    clear() {
        this.sources.clear();
    }
}
// Singleton instance
let registryInstance = null;
export function getSourceRegistry() {
    if (!registryInstance) {
        registryInstance = new SourceRegistryImpl();
    }
    return registryInstance;
}
