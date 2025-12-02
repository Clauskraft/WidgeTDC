/**
 * MCP PowerPoint Backend Service
 * Integrates with MCP PowerPoint server for presentation generation
 */
import { eventBus } from '../../mcp/EventBus.js';
import { logger } from '../../utils/logger.js';
/**
 * MCPPowerPointBackend - Handles PowerPoint generation via MCP
 */
export class MCPPowerPointBackend {
    constructor() {
        this.mcpClient = null;
        this.isInitialized = false;
        this.presentations = new Map();
        this.setupEventListeners();
    }
    setupEventListeners() {
        eventBus.on('docgen:powerpoint:create', async (data) => {
            try {
                await this.createPresentation({
                    name: data.presentationId,
                    title: data.title,
                    theme: data.theme,
                    author: data.userId
                });
                eventBus.emit('docgen:powerpoint:created', {
                    presentationId: data.presentationId,
                    status: 'created'
                });
            }
            catch (error) {
                logger.error('PowerPoint creation failed:', error);
                eventBus.emit('docgen:powerpoint:error', {
                    presentationId: data.presentationId,
                    error: String(error)
                });
            }
        });
    }
    /**
     * Initialize MCP client connection
     */
    async initialize(client) {
        if (client) {
            this.mcpClient = client;
        }
        else {
            // Create mock client for development
            this.mcpClient = this.createMockClient();
        }
        this.isInitialized = true;
        logger.info('MCPPowerPointBackend initialized');
    }
    createMockClient() {
        return {
            callTool: async (toolName, params) => {
                logger.debug(`Mock MCP call: ${toolName}`, params);
                // Simulate tool responses
                switch (toolName) {
                    case 'create-presentation':
                        return { success: true, name: params.name };
                    case 'add-slide-title':
                    case 'add-slide-content':
                    case 'add-slide-bullet':
                    case 'add-slide-image':
                        return { success: true, slideIndex: Math.floor(Math.random() * 10) };
                    case 'generate-and-save-image':
                        return {
                            success: true,
                            image_path: `/images/${params.file_name || 'generated'}.png`
                        };
                    case 'save-presentation':
                        return {
                            success: true,
                            file_path: `/presentations/${params.presentation_name}.pptx`
                        };
                    default:
                        return { success: false, error: 'Unknown tool' };
                }
            }
        };
    }
    /**
     * Create a new presentation
     */
    async createPresentation(config) {
        if (!this.isInitialized || !this.mcpClient) {
            throw new Error('MCPPowerPointBackend not initialized');
        }
        const result = await this.mcpClient.callTool('create-presentation', {
            name: config.name,
            title: config.title,
            theme: config.theme || 'corporate'
        });
        if (result.success) {
            this.presentations.set(config.name, { name: config.name, slides: [] });
            return config.name;
        }
        throw new Error('Failed to create presentation');
    }
    /**
     * Add a slide to a presentation
     */
    async addSlide(presentationName, slideType, data) {
        if (!this.mcpClient) {
            throw new Error('MCPPowerPointBackend not initialized');
        }
        const toolName = `add-slide-${slideType}`;
        await this.mcpClient.callTool(toolName, {
            presentation_name: presentationName,
            title: data.title,
            content: data.content,
            notes: data.notes,
            image_url: data.imageUrl
        });
        // Track slide locally
        const presentation = this.presentations.get(presentationName);
        if (presentation) {
            presentation.slides.push(data);
        }
    }
    /**
     * Generate an image using AI
     */
    async generateImage(prompt, fileName) {
        if (!this.mcpClient) {
            throw new Error('MCPPowerPointBackend not initialized');
        }
        const result = await this.mcpClient.callTool('generate-and-save-image', {
            prompt,
            file_name: fileName
        });
        return result.image_path;
    }
    /**
     * Save the presentation
     */
    async savePresentation(presentationName) {
        if (!this.mcpClient) {
            throw new Error('MCPPowerPointBackend not initialized');
        }
        const result = await this.mcpClient.callTool('save-presentation', {
            presentation_name: presentationName
        });
        return result.file_path;
    }
    /**
     * Get presentation info
     */
    getPresentation(name) {
        return this.presentations.get(name);
    }
    /**
     * List all presentations
     */
    listPresentations() {
        return Array.from(this.presentations.keys());
    }
}
// Singleton instance
let instance = null;
export function getMCPPowerPointBackend() {
    if (!instance) {
        instance = new MCPPowerPointBackend();
    }
    return instance;
}
export default MCPPowerPointBackend;
