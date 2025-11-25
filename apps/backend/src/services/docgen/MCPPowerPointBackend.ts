/**
 * MCP PowerPoint Backend Service
 * Integrates with MCP PowerPoint server for presentation generation
 */

import { eventBus } from '../../mcp/EventBus.js';
import { logger } from '../../utils/logger.js';

interface MCPClient {
  callTool(toolName: string, params: Record<string, unknown>): Promise<unknown>;
}

interface SlideData {
  title: string;
  content: string[];
  notes?: string;
  imageUrl?: string;
}

interface PresentationConfig {
  name: string;
  title: string;
  theme?: string;
  author?: string;
}

/**
 * MCPPowerPointBackend - Handles PowerPoint generation via MCP
 */
export class MCPPowerPointBackend {
  private mcpClient: MCPClient | null = null;
  private isInitialized = false;
  private presentations: Map<string, { name: string; slides: SlideData[] }> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
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
      } catch (error) {
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
  async initialize(client?: MCPClient): Promise<void> {
    if (client) {
      this.mcpClient = client;
    } else {
      // Create mock client for development
      this.mcpClient = this.createMockClient();
    }
    this.isInitialized = true;
    logger.info('MCPPowerPointBackend initialized');
  }

  private createMockClient(): MCPClient {
    return {
      callTool: async (toolName: string, params: Record<string, unknown>) => {
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
  async createPresentation(config: PresentationConfig): Promise<string> {
    if (!this.isInitialized || !this.mcpClient) {
      throw new Error('MCPPowerPointBackend not initialized');
    }

    const result = await this.mcpClient.callTool('create-presentation', { 
      name: config.name,
      title: config.title,
      theme: config.theme || 'corporate'
    }) as { success: boolean; name: string };

    if (result.success) {
      this.presentations.set(config.name, { name: config.name, slides: [] });
      return config.name;
    }

    throw new Error('Failed to create presentation');
  }

  /**
   * Add a slide to a presentation
   */
  async addSlide(
    presentationName: string, 
    slideType: 'title' | 'content' | 'bullet' | 'image' | 'two-column',
    data: SlideData
  ): Promise<void> {
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
  async generateImage(prompt: string, fileName: string): Promise<string> {
    if (!this.mcpClient) {
      throw new Error('MCPPowerPointBackend not initialized');
    }

    const result = await this.mcpClient.callTool('generate-and-save-image', {
      prompt,
      file_name: fileName
    }) as { success: boolean; image_path: string };

    return result.image_path;
  }

  /**
   * Save the presentation
   */
  async savePresentation(presentationName: string): Promise<string> {
    if (!this.mcpClient) {
      throw new Error('MCPPowerPointBackend not initialized');
    }

    const result = await this.mcpClient.callTool('save-presentation', {
      presentation_name: presentationName
    }) as { success: boolean; file_path: string };

    return result.file_path;
  }

  /**
   * Get presentation info
   */
  getPresentation(name: string): { name: string; slides: SlideData[] } | undefined {
    return this.presentations.get(name);
  }

  /**
   * List all presentations
   */
  listPresentations(): string[] {
    return Array.from(this.presentations.keys());
  }
}

// Singleton instance
let instance: MCPPowerPointBackend | null = null;

export function getMCPPowerPointBackend(): MCPPowerPointBackend {
  if (!instance) {
    instance = new MCPPowerPointBackend();
  }
  return instance;
}

export default MCPPowerPointBackend;
