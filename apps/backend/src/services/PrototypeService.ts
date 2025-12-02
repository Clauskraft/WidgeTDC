/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    PROTOTYPE GENERATION SERVICE                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Transforms PRD documents into functional HTML prototypes                 ║
 * ║  Integrates with:                                                         ║
 * ║  • LLM providers (Claude, DeepSeek, Gemini)                               ║
 * ║  • Neo4j knowledge graph                                                  ║
 * ║  • Prisma database                                                        ║
 * ║  • MCP WebSocket for streaming                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import Anthropic from '@anthropic-ai/sdk';
import { getDatabase } from '../database/index.js';
import { neo4jAdapter } from '../adapters/Neo4jAdapter.js';
import { eventBus } from '../mcp/EventBus.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PrototypeGenerationOptions {
  style?: 'modern' | 'minimal' | 'corporate' | 'tdc-brand';
  framework?: 'vanilla' | 'tailwind' | 'bootstrap';
  locale?: string;
  streaming?: boolean;
  saveToGraph?: boolean;
}

export interface GeneratedPrototype {
  id: string;
  prdId?: string;
  name: string;
  htmlContent: string;
  version: number;
  status: 'generating' | 'complete' | 'error';
  createdAt: Date;
}

export interface PrototypeListItem {
  id: string;
  name: string;
  createdAt: string;
  prdId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM Prompt Templates
// ═══════════════════════════════════════════════════════════════════════════

const STYLE_PROMPTS: Record<string, string> = {
  modern: `Use a modern design with:
- Clean, spacious layouts with generous whitespace
- Subtle shadows and rounded corners
- Gradient accents (blue to purple)
- Smooth animations and hover effects
- Dark theme option support`,

  minimal: `Use a minimal design with:
- Maximum simplicity and clarity
- Black and white with one accent color
- No shadows, flat design
- Focus on typography and spacing
- Essential elements only`,

  corporate: `Use a corporate/enterprise design with:
- Professional, trustworthy appearance
- Blue as primary color
- Clear hierarchy and structured layouts
- Data tables and dashboards
- Accessible and formal`,

  'tdc-brand': `Use TDC brand design with:
- TDC magenta (#E20074) as primary accent
- Dark navy (#1A1F36) backgrounds
- Clean Scandinavian aesthetics
- Modern tech company feel
- Danish language where appropriate`
};

function buildSystemPrompt(options: PrototypeGenerationOptions): string {
  const styleGuide = STYLE_PROMPTS[options.style || 'modern'];
  const locale = options.locale || 'en-US';
  
  return `You are an expert UI/UX developer and prototype generator. Your task is to transform Product Requirements Documents (PRDs) into fully functional HTML prototypes.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid HTML code - no markdown, no backticks, no explanations
2. Include all CSS inline in a <style> tag in the <head>
3. Include all JavaScript inline in <script> tags at the end of <body>
4. Create a complete, working prototype that demonstrates ALL features mentioned in the PRD
5. Make all interactive elements functional (buttons, forms, navigation)
6. Start with <!DOCTYPE html> and end with </html>
7. Respond in ${locale} language for all UI text

DESIGN REQUIREMENTS:
${styleGuide}

TECHNICAL REQUIREMENTS:
- Responsive design (mobile-first)
- Semantic HTML5
- CSS Grid/Flexbox for layouts
- Form validation where needed
- Realistic placeholder data
- Accessibility (ARIA labels, contrast)

Generate a production-quality prototype that could be used for user testing.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Prototype Service Class
// ═══════════════════════════════════════════════════════════════════════════

class PrototypeService {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize Anthropic client if API key available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      console.log('✅ PrototypeService: Anthropic client initialized');
    } else {
      console.warn('⚠️ PrototypeService: No ANTHROPIC_API_KEY found');
    }
  }

  /**
   * Generate HTML prototype from PRD content
   */
  async generate(
    prdContent: string,
    options: PrototypeGenerationOptions = {}
  ): Promise<{ html: string; status: string }> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.');
    }

    const systemPrompt = buildSystemPrompt(options);
    const isPDF = prdContent.startsWith('[PDF:base64]');

    try {
      eventBus.emit('prototype.generation.started', { options });

      let response;

      if (isPDF) {
        // Handle PDF with vision
        const base64Data = prdContent.replace('[PDF:base64]', '');
        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 32000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'Generate a complete HTML prototype based on this PRD document. Output only the HTML code.'
              }
            ]
          }]
        });
      } else {
        // Handle text/markdown
        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 32000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `PRD CONTENT:\n\n${prdContent}\n\nGenerate the complete HTML prototype now:`
          }]
        });
      }

      // Extract HTML from response
      const htmlContent = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      eventBus.emit('prototype.generation.completed', { 
        length: htmlContent.length,
        options 
      });

      return { html: htmlContent, status: 'complete' };

    } catch (error: any) {
      eventBus.emit('prototype.generation.error', { error: error.message });
      throw error;
    }
  }

  /**
   * Save prototype to database
   */
  async save(name: string, htmlContent: string, prdId?: string): Promise<{ id: string; created: boolean }> {
    const db = getDatabase();
    
    // Check if exists
    const existing = await db.prototype.findFirst({
      where: { name }
    });

    if (existing) {
      // Update version
      const updated = await db.prototype.update({
        where: { id: existing.id },
        data: {
          htmlContent,
          version: existing.version + 1,
          updatedAt: new Date()
        }
      });
      return { id: updated.id, created: false };
    }

    // Create new
    const created = await db.prototype.create({
      data: {
        name,
        htmlContent,
        prdId,
        version: 1
      }
    });

    // Also save to Neo4j if connected
    try {
      if (neo4jAdapter && await neo4jAdapter.isConnected()) {
        await neo4jAdapter.createNode('Prototype', {
          id: created.id,
          name,
          createdAt: new Date().toISOString(),
          version: 1
        });

        if (prdId) {
          await neo4jAdapter.createRelationship(
            created.id,
            prdId,
            'GENERATED_FROM',
            { timestamp: new Date().toISOString() }
          );
        }
      }
    } catch (graphError) {
      console.warn('Failed to save prototype to Neo4j:', graphError);
    }

    return { id: created.id, created: true };
  }

  /**
   * List all prototypes
   */
  async list(): Promise<PrototypeListItem[]> {
    const db = getDatabase();
    
    const prototypes = await db.prototype.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        prdId: true
      }
    });

    return prototypes.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.toISOString(),
      prdId: p.prdId || undefined
    }));
  }

  /**
   * Get prototype by ID
   */
  async getById(id: string): Promise<GeneratedPrototype | null> {
    const db = getDatabase();
    
    const prototype = await db.prototype.findUnique({
      where: { id }
    });

    if (!prototype) return null;

    return {
      id: prototype.id,
      name: prototype.name,
      htmlContent: prototype.htmlContent,
      version: prototype.version,
      prdId: prototype.prdId || undefined,
      status: 'complete',
      createdAt: prototype.createdAt
    };
  }

  /**
   * Delete prototype
   */
  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    try {
      await db.prototype.delete({ where: { id } });
      
      // Also remove from Neo4j
      try {
        if (neo4jAdapter && await neo4jAdapter.isConnected()) {
          await neo4jAdapter.deleteNode(id);
        }
      } catch (graphError) {
        console.warn('Failed to delete prototype from Neo4j:', graphError);
      }

      return true;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Singleton Export
// ═══════════════════════════════════════════════════════════════════════════

export const prototypeService = new PrototypeService();
export default prototypeService;
