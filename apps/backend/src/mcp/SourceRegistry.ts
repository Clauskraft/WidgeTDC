/**
 * Simple Source Registry Implementation
 * 
 * Manages available data sources and matches them to query intents
 */

import { QueryIntent, DataSource } from './autonomous/index.js';

export class SourceRegistryImpl {
    private sources: Map<string, DataSource> = new Map();

    /**
     * Register a new data source
     */
    registerSource(source: DataSource): void {
        this.sources.set(source.name, source);
        console.log(`📌 Registered source: ${source.name} (${source.type})`);
    }

    /**
     * Get sources capable of handling a query intent
     */
    getCapableSources(intent: QueryIntent): DataSource[] {
        const capable: DataSource[] = [];

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
    getAllSources(): DataSource[] {
        return Array.from(this.sources.values());
    }

    /**
     * Get source by name
     */
    getSource(name: string): DataSource | undefined {
        return this.sources.get(name);
    }

    /**
     * Check if source can handle intent
     */
    private canHandle(source: DataSource, intent: QueryIntent): boolean {
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
    getSourcesByType(type: string): DataSource[] {
        return Array.from(this.sources.values())
            .filter(s => s.type === type);
    }

    /**
     * Remove a source
     */
    unregisterSource(name: string): boolean {
        return this.sources.delete(name);
    }

    /**
     * Clear all sources
     */
    clear(): void {
        this.sources.clear();
    }
}

// Singleton instance
let registryInstance: SourceRegistryImpl | null = null;

export function getSourceRegistry(): SourceRegistryImpl {
    if (!registryInstance) {
        registryInstance = new SourceRegistryImpl();
    }
    return registryInstance;
}
