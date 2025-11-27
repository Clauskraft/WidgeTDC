/**
 * Plugin System
 * Extensible architecture for adding custom functionality
 */

export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author: string;
    dependencies?: string[];
    permissions?: string[];
}

export interface PluginHooks {
    onLoad?: () => Promise<void>;
    onUnload?: () => Promise<void>;
    onMessage?: (message: any) => Promise<any>;
    onQuery?: (query: string) => Promise<any>;
    onResult?: (result: any) => Promise<any>;
}

export interface Plugin {
    metadata: PluginMetadata;
    hooks: PluginHooks;
    api?: Record<string, Function>;
}

export class PluginManager {
    private plugins: Map<string, Plugin> = new Map();
    private loadedPlugins: Set<string> = new Set();

    /**
     * Register a plugin
     */
    async registerPlugin(plugin: Plugin): Promise<void> {
        const { name, version } = plugin.metadata;

        // Check dependencies
        if (plugin.metadata.dependencies) {
            for (const dep of plugin.metadata.dependencies) {
                if (!this.loadedPlugins.has(dep)) {
                    throw new Error(`Plugin ${name} requires ${dep} which is not loaded`);
                }
            }
        }

        // Store plugin
        this.plugins.set(name, plugin);

        // Call onLoad hook
        if (plugin.hooks.onLoad) {
            await plugin.hooks.onLoad();
        }

        this.loadedPlugins.add(name);
        console.log(`✅ Plugin loaded: ${name} v${version}`);
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(name: string): Promise<void> {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found`);
        }

        // Check if other plugins depend on this
        for (const [pluginName, p] of this.plugins.entries()) {
            if (p.metadata.dependencies?.includes(name)) {
                throw new Error(`Cannot unload ${name}: ${pluginName} depends on it`);
            }
        }

        // Call onUnload hook
        if (plugin.hooks.onUnload) {
            await plugin.hooks.onUnload();
        }

        this.plugins.delete(name);
        this.loadedPlugins.delete(name);
        console.log(`🗑️  Plugin unloaded: ${name}`);
    }

    /**
     * Execute hook across all plugins
     */
    async executeHook(
        hookName: keyof PluginHooks,
        ...args: any[]
    ): Promise<any[]> {
        const results: any[] = [];

        for (const plugin of this.plugins.values()) {
            const hook = plugin.hooks[hookName];
            if (hook && typeof hook === 'function') {
                try {
                    const result = await (hook as (...args: any[]) => Promise<any>)(...args);
                    results.push(result);
                } catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} hook ${hookName}:`, error);
                }
            }
        }

        return results;
    }

    /**
     * Call plugin API method
     */
    async callPluginAPI(
        pluginName: string,
        method: string,
        ...args: any[]
    ): Promise<any> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin ${pluginName} not found`);
        }

        if (!plugin.api || !plugin.api[method]) {
            throw new Error(`Plugin ${pluginName} does not have method ${method}`);
        }

        return plugin.api[method](...args);
    }

    /**
     * Get loaded plugins
     */
    getLoadedPlugins(): PluginMetadata[] {
        return Array.from(this.plugins.values()).map(p => p.metadata);
    }

    /**
     * Check if plugin is loaded
     */
    isPluginLoaded(name: string): boolean {
        return this.loadedPlugins.has(name);
    }

    /**
     * Get plugin by name
     */
    getPlugin(name: string): Plugin | undefined {
        return this.plugins.get(name);
    }
}

/**
 * Example plugin: Custom Search Enhancer
 */
export const exampleSearchPlugin: Plugin = {
    metadata: {
        name: 'custom-search-enhancer',
        version: '1.0.0',
        description: 'Enhances search results with custom logic',
        author: 'WidgeTDC Team',
        permissions: ['search', 'modify_results'],
    },
    hooks: {
        onLoad: async () => {
            console.log('Custom Search Enhancer loaded');
        },
        onQuery: async (query: string) => {
            // Enhance query
            return `enhanced: ${query}`;
        },
        onResult: async (result: any) => {
            // Modify results
            return {
                ...result,
                enhanced: true,
                timestamp: new Date().toISOString(),
            };
        },
    },
    api: {
        customMethod: (param: string) => {
            return `Custom method called with: ${param}`;
        },
    },
};

export const pluginManager = new PluginManager();
