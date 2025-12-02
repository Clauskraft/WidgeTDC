/**
 * Plugin System
 * Extensible architecture for adding custom functionality
 */
export class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.loadedPlugins = new Set();
    }
    /**
     * Register a plugin
     */
    async registerPlugin(plugin) {
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
    async unloadPlugin(name) {
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
    async executeHook(hookName, ...args) {
        const results = [];
        for (const plugin of this.plugins.values()) {
            const hook = plugin.hooks[hookName];
            if (hook && typeof hook === 'function') {
                try {
                    const result = await hook(...args);
                    results.push(result);
                }
                catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} hook ${hookName}:`, error);
                }
            }
        }
        return results;
    }
    /**
     * Call plugin API method
     */
    async callPluginAPI(pluginName, method, ...args) {
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
    getLoadedPlugins() {
        return Array.from(this.plugins.values()).map(p => p.metadata);
    }
    /**
     * Check if plugin is loaded
     */
    isPluginLoaded(name) {
        return this.loadedPlugins.has(name);
    }
    /**
     * Get plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
}
/**
 * Example plugin: Custom Search Enhancer
 */
export const exampleSearchPlugin = {
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
        onQuery: async (query) => {
            // Enhance query
            return `enhanced: ${query}`;
        },
        onResult: async (result) => {
            // Modify results
            return {
                ...result,
                enhanced: true,
                timestamp: new Date().toISOString(),
            };
        },
    },
    api: {
        customMethod: (param) => {
            return `Custom method called with: ${param}`;
        },
    },
};
export const pluginManager = new PluginManager();
