/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              PROTOTYPE GENERATION ROUTES - ENHANCED                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Handles PRD to Prototype conversion via LLM                              ║
 * ║  Integrates with Neo4j Graph, Prisma DB, and MCP Infrastructure          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { neo4jAdapter } from '../adapters/Neo4jAdapter.js';
import { eventBus } from '../mcp/EventBus.js';

const router = Router();
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// System Prompts
// ═══════════════════════════════════════════════════════════════════════════

const STYLE_CONFIGS: Record<string, { prompt: string; primaryColor: string }> = {
  modern: {
    prompt: `Use a modern design with:
- Clean, spacious layouts with generous whitespace
- Subtle shadows and rounded corners (8-12px)
- Gradient accents (blue to purple: #3b82f6 to #8b5cf6)
- Smooth animations and hover effects (0.2s transitions)
- Dark theme as default with light theme toggle
- CSS Grid and Flexbox for responsive layouts`,
    primaryColor: '#3b82f6'
  },
  minimal: {
    prompt: `Use a minimal design with:
- Maximum simplicity and clarity
- Black and white with one accent color (#000000, #ffffff, #0066cc)
- No shadows, flat design
- Focus on typography (system fonts, good hierarchy)
- Essential elements only, remove all decoration
- Monospace fonts for code/data`,
    primaryColor: '#0066cc'
  },
  corporate: {
    prompt: `Use a corporate/enterprise design with:
- Professional, trustworthy appearance
- Blue as primary color (#1e40af)
- Clear hierarchy and structured layouts
- Data tables with sortable headers
- Dashboard-style layouts
- Accessible (WCAG AA compliant)`,
    primaryColor: '#1e40af'
  },
  'tdc-brand': {
    prompt: `Use TDC brand design with:
- TDC magenta (#E20074) as primary accent
- Dark navy (#1A1F36) for backgrounds
- Clean Scandinavian aesthetics
- Modern tech company feel
- Danish language for all UI text
- Rounded corners and subtle shadows`,
    primaryColor: '#E20074'
  }
};

function buildSystemPrompt(style: string, locale: string): string {
  const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS.modern;
  
  return `Du er en ekspert i UI/UX udvikling og prototype-generering. Din opgave er at transformere Product Requirements Documents (PRD) til fuldt funktionelle HTML prototyper.

KRITISKE INSTRUKTIONER:
1. Returner KUN gyldig HTML kode - ingen markdown, ingen backticks, ingen forklaringer
2. Inkluder al CSS inline i en <style> tag i <head>
3. Inkluder al JavaScript inline i <script> tags i slutningen af <body>
4. Lav en komplet, fungerende prototype der demonstrerer ALLE features nævnt i PRD'en
5. Gør alle interaktive elementer funktionelle (knapper, formularer, navigation)
6. Start med <!DOCTYPE html> og slut med </html>
7. Brug ${locale === 'da-DK' ? 'dansk' : 'engelsk'} sprog til al UI tekst

DESIGN KRAV:
${styleConfig.prompt}

TEKNISKE KRAV:
- Responsivt design (mobile-first)
- Semantisk HTML5
- CSS Grid/Flexbox til layouts
- Form validering hvor nødvendigt
- Realistisk placeholder data
- Tilgængelighed (ARIA labels, kontrast)
- Performance (minimal JavaScript, CSS animations)

Generer en produktionskvalitets prototype der kan bruges til brugertest.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate prototype from PRD
 * POST /api/prototype/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { prdContent, options = {} } = req.body;
    const { style = 'modern', locale = 'da-DK' } = options;

    if (!prdContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'PRD indhold er påkrævet' 
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Anthropic API nøgle ikke konfigureret' 
      });
    }

    // Emit start event
    eventBus.emit('prototype.generation.started', { style, locale });

    const systemPrompt = buildSystemPrompt(style, locale);
    
    // Build messages based on content type
    let messages: any[];
    if (prdContent.startsWith('[PDF:base64]')) {
      const base64Data = prdContent.replace('[PDF:base64]', '');
      messages = [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: 'Generer den komplette HTML prototype baseret på denne PRD nu:',
          },
        ],
      }];
    } else {
      messages = [{
        role: 'user',
        content: `PRD INDHOLD:\n\n${prdContent}\n\nGenerer den komplette HTML prototype nu:`,
      }];
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 32000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      eventBus.emit('prototype.generation.error', { error: errorData });
      return res.status(response.status).json({ 
        success: false, 
        error: 'Fejl ved prototype generering' 
      });
    }

    const data = await response.json();
    let html = data.content[0]?.text || '';

    // Clean markdown artifacts
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

    const latency = Date.now() - startTime;

    // Emit completion event
    eventBus.emit('prototype.generation.completed', { 
      length: html.length,
      latency,
      style 
    });

    res.json({
      success: true,
      data: { html, status: 'complete' },
      meta: {
        model: 'claude-sonnet-4-20250514',
        tokens: data.usage?.output_tokens || 0,
        latency,
        style
      },
    });
  } catch (error: any) {
    console.error('Prototype generation error:', error);
    eventBus.emit('prototype.generation.error', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Intern serverfejl under generering' 
    });
  }
});


/**
 * Save prototype to database + Neo4j
 * POST /api/prototype/save
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { name, htmlContent, prdId } = req.body;

    if (!name || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Navn og HTML indhold er påkrævet' 
      });
    }

    // Check if prototype table exists, fallback to MCPResource if not
    let result: { id: string; created: boolean };
    
    try {
      // Try using Prototype model first
      const existing = await (prisma as any).prototype?.findFirst({
        where: { name }
      });

      if (existing) {
        const updated = await (prisma as any).prototype.update({
          where: { id: existing.id },
          data: {
            htmlContent,
            version: existing.version + 1,
            updatedAt: new Date()
          }
        });
        result = { id: updated.id, created: false };
      } else {
        const created = await (prisma as any).prototype.create({
          data: {
            name,
            htmlContent,
            prdId: prdId || null,
            version: 1
          }
        });
        result = { id: created.id, created: true };
      }
    } catch {
      // Fallback to MCPResource
      const resource = await prisma.mCPResource.create({
        data: {
          uri: `prototype://${Date.now()}-${name.replace(/\s+/g, '-')}`,
          name,
          description: `Genereret prototype fra PRD${prdId ? ` (${prdId})` : ''}`,
          mimeType: 'text/html',
          payload: {
            html: htmlContent,
            prdId: prdId || null,
            version: 1,
            generatedAt: new Date().toISOString(),
          },
        },
      });
      result = { id: resource.id, created: true };
    }

    // Save to Neo4j graph if available
    try {
      if (neo4jAdapter) {
        const connected = await neo4jAdapter.isConnected?.();
        if (connected) {
          await neo4jAdapter.query(`
            MERGE (p:Prototype {id: $id})
            SET p.name = $name,
                p.createdAt = datetime(),
                p.version = 1,
                p.source = 'matrix-ui'
            RETURN p
          `, { id: result.id, name });

          if (prdId) {
            await neo4jAdapter.query(`
              MATCH (p:Prototype {id: $protoId})
              MERGE (prd:Document {id: $prdId})
              MERGE (p)-[:GENERATED_FROM]->(prd)
            `, { protoId: result.id, prdId });
          }
          
          console.log('✅ Prototype saved to Neo4j graph');
        }
      }
    } catch (graphError) {
      console.warn('⚠️ Neo4j save skipped:', graphError);
    }

    eventBus.emit('prototype.saved', { id: result.id, name });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Save prototype error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fejl ved gemning af prototype' 
    });
  }
});


/**
 * List saved prototypes
 * GET /api/prototype/list
 */
router.get('/list', async (_req: Request, res: Response) => {
  try {
    let prototypes: any[] = [];

    // Try Prototype model first
    try {
      prototypes = await (prisma as any).prototype?.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          prdId: true,
          version: true
        },
      }) || [];
    } catch {
      // Fallback to MCPResource
      const resources = await prisma.mCPResource.findMany({
        where: { uri: { startsWith: 'prototype://' } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });
      prototypes = resources;
    }

    res.json({
      success: true,
      data: { prototypes },
      meta: { count: prototypes.length }
    });
  } catch (error: any) {
    console.error('List prototypes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fejl ved hentning af prototyper' 
    });
  }
});


/**
 * Get prototype by ID
 * GET /api/prototype/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let prototype: any = null;

    // Try Prototype model first
    try {
      prototype = await (prisma as any).prototype?.findUnique({
        where: { id }
      });
    } catch {
      // Fallback to MCPResource
      const resource = await prisma.mCPResource.findUnique({
        where: { id }
      });
      if (resource) {
        const payload = resource.payload as any;
        prototype = {
          id: resource.id,
          name: resource.name,
          htmlContent: payload?.html,
          createdAt: resource.createdAt
        };
      }
    }

    if (!prototype) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prototype ikke fundet' 
      });
    }

    res.json({
      success: true,
      data: prototype
    });
  } catch (error: any) {
    console.error('Get prototype error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fejl ved hentning af prototype' 
    });
  }
});


/**
 * Delete prototype
 * DELETE /api/prototype/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Prototype model first
    try {
      await (prisma as any).prototype?.delete({ where: { id } });
    } catch {
      // Fallback to MCPResource
      await prisma.mCPResource.delete({ where: { id } });
    }

    // Remove from Neo4j
    try {
      if (neo4jAdapter) {
        await neo4jAdapter.query(`
          MATCH (p:Prototype {id: $id})
          DETACH DELETE p
        `, { id });
      }
    } catch {
      // Ignore graph errors
    }

    eventBus.emit('prototype.deleted', { id });

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error: any) {
    console.error('Delete prototype error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fejl ved sletning af prototype' 
    });
  }
});

export default router;
