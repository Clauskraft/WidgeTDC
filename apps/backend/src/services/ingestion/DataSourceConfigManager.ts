// DataSourceConfigManager - Manage which data sources are enabled/disabled
import { promises as fs } from 'fs';
import * as path from 'path';
import { projectMemory } from '../project/ProjectMemory.js';

export interface DataSourceConfig {
    name: string;
    enabled: boolean;
    requiresApproval: boolean;  // If true, user must approve before first use
    approved: boolean;          // Has user approved this source?
    lastUsed?: string;
    description?: string;
}

export class DataSourceConfigManager {
    private configPath: string;
    private config: Map<string, DataSourceConfig> = new Map();

    constructor(configPath?: string) {
        this.configPath = configPath || path.join(process.cwd(), 'apps', 'backend', 'data', 'datasource-config.json');
    }

    /**
     * Load configuration from disk
     */
    async load(): Promise<void> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const configs = JSON.parse(data) as DataSourceConfig[];

            this.config.clear();
            configs.forEach(cfg => {
                this.config.set(cfg.name, cfg);
            });

            console.log(`📋 Loaded data source config: ${this.config.size} sources`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log('📋 No existing config found, creating new one');
                await this.save();
            } else {
                console.error('Failed to load data source config:', error);
            }
        }
    }

    /**
     * Save configuration to disk
     */
    async save(): Promise<void> {
        try {
            const configs = Array.from(this.config.values());
            const dir = path.dirname(this.configPath);

            // Ensure directory exists
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch { }

            await fs.writeFile(this.configPath, JSON.stringify(configs, null, 2));
            console.log('💾 Saved data source configuration');
        } catch (error) {
            console.error('Failed to save data source config:', error);
        }
    }

    /**
     * Register a new data source (requires approval by default)
     */
    async registerSource(name: string, description?: string, requiresApproval: boolean = true): Promise<boolean> {
        if (this.config.has(name)) {
            // Already registered
            return this.isEnabled(name);
        }

        const config: DataSourceConfig = {
            name,
            enabled: false, // Disabled by default
            requiresApproval,
            approved: !requiresApproval, // If no approval required, mark as approved
            description
        };

        this.config.set(name, config);
        await this.save();

        // Log to Project Memory
        projectMemory.logLifecycleEvent({
            eventType: 'other',
            status: 'in_progress',
            details: {
                type: 'new_datasource_registered',
                name,
                description,
                requiresApproval,
                message: requiresApproval
                    ? `⚠️ New data source "${name}" requires user approval before use`
                    : `✅ New data source "${name}" registered and ready`
            }
        });

        console.log(`📌 Registered new data source: ${name} (approval required: ${requiresApproval})`);

        return !requiresApproval; // Return true if can be used immediately
    }

    /**
     * Enable/disable a data source
     */
    async setEnabled(name: string, enabled: boolean): Promise<void> {
        const config = this.config.get(name);
        if (!config) {
            throw new Error(`Unknown data source: ${name}`);
        }

        config.enabled = enabled;
        await this.save();

        console.log(`${enabled ? '✅' : '❌'} Data source "${name}" ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Approve a data source for use
     */
    async approve(name: string): Promise<void> {
        const config = this.config.get(name);
        if (!config) {
            throw new Error(`Unknown data source: ${name}`);
        }

        config.approved = true;
        config.enabled = true; // Auto-enable when approved
        await this.save();

        projectMemory.logLifecycleEvent({
            eventType: 'other',
            status: 'success',
            details: {
                type: 'datasource_approved',
                name,
                message: `✅ User approved data source: ${name}`
            }
        });

        console.log(`✅ Approved and enabled data source: ${name}`);
    }

    /**
     * Check if a data source is enabled and approved
     */
    isEnabled(name: string): boolean {
        const config = this.config.get(name);
        if (!config) return false;

        return config.enabled && config.approved;
    }

    /**
     * Get all sources that require approval
     */
    getPendingApprovals(): DataSourceConfig[] {
        return Array.from(this.config.values())
            .filter(cfg => cfg.requiresApproval && !cfg.approved);
    }

    /**
     * Get all enabled sources
     */
    getEnabledSources(): string[] {
        return Array.from(this.config.values())
            .filter(cfg => this.isEnabled(cfg.name))
            .map(cfg => cfg.name);
    }

    /**
     * Get all sources
     */
    getAllSources(): DataSourceConfig[] {
        return Array.from(this.config.values());
    }

    /**
     * Mark source as used
     */
    async markUsed(name: string): Promise<void> {
        const config = this.config.get(name);
        if (config) {
            config.lastUsed = new Date().toISOString();
            await this.save();
        }
    }
}

// Singleton instance
export const dataSourceConfig = new DataSourceConfigManager();
