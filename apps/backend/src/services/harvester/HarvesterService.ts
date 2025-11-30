/**
 * The Harvester Service - "The Arm"
 *
 * Reaches out into the digital void and retrieves raw knowledge.
 * This is the physical capability to grasp data from external sources
 * and store it in the system's subconscious (packages/knowledge).
 *
 * "Vi skal ikke vente på mirakler; vi skal hente dem."
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { hyperLog } from '../hyper-log.js';

// The subconscious - where harvested knowledge is stored
const KNOWLEDGE_ROOT = path.resolve(__dirname, '../../../../../packages/knowledge');
const KNOWLEDGE_HARVESTED = path.join(KNOWLEDGE_ROOT, 'harvested');
const KNOWLEDGE_LIBRARY = path.join(KNOWLEDGE_ROOT, 'library');

export interface HarvestResult {
  success: boolean;
  filename?: string;
  filepath?: string;
  size?: number;
  source?: string;
  timestamp?: string;
  category?: string;
  error?: string;
}

export interface HarvestMetadata {
  source: string;
  harvestedAt: string;
  contentType: string;
  size: number;
  category?: string;
  customName?: string;
  checksum?: string;
}

export interface HarvestOptions {
  filename?: string;
  category?: string;  // e.g., 'system_prompt', 'architecture', 'reference'
}

class HarvesterService {
  private static instance: HarvesterService;

  private constructor() {
    this.ensureKnowledgeBase();
  }

  static getInstance(): HarvesterService {
    if (!HarvesterService.instance) {
      HarvesterService.instance = new HarvesterService();
    }
    return HarvesterService.instance;
  }

  /**
   * Ensure the knowledge base directories exist
   */
  private async ensureKnowledgeBase(): Promise<void> {
    try {
      await fs.mkdir(KNOWLEDGE_HARVESTED, { recursive: true });
      await fs.mkdir(KNOWLEDGE_LIBRARY, { recursive: true });
    } catch (error) {
      console.error('[HARVESTER] Could not create knowledge base:', error);
    }
  }

  /**
   * Get the target directory based on category
   */
  private async getTargetDir(category?: string): Promise<string> {
    if (category) {
      const categoryDir = path.join(KNOWLEDGE_LIBRARY, category);
      await fs.mkdir(categoryDir, { recursive: true });
      return categoryDir;
    }
    return KNOWLEDGE_HARVESTED;
  }

  /**
   * Harvest raw content from a URL
   * The arm reaches out and grasps the data
   */
  async harvestFromUrl(url: string, options: HarvestOptions = {}): Promise<HarvestResult> {
    const { filename, category } = options;
    const startTime = Date.now();

    await hyperLog.log('TOOL_SELECTION', 'TheHarvester', `Reaching for: ${url}`, { url, category });

    try {
      // Validate URL
      const parsedUrl = new URL(url);

      // Fetch the content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WidgetTDC-Harvester/1.0 (Knowledge Acquisition System)',
          'Accept': 'text/plain, text/markdown, application/json, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const contentType = response.headers.get('content-type') || 'text/plain';

      // Determine target directory
      const targetDir = await this.getTargetDir(category);

      // Generate filename if not provided
      const finalFilename = this.sanitizeFilename(filename) || this.generateFilename(parsedUrl, contentType);
      const filepath = path.join(targetDir, finalFilename);

      // Store the harvested content
      await fs.writeFile(filepath, content, 'utf-8');

      // Store metadata alongside
      const metadata: HarvestMetadata = {
        source: url,
        harvestedAt: new Date().toISOString(),
        contentType,
        size: content.length,
        category,
        customName: filename
      };
      await fs.writeFile(`${filepath}.meta.json`, JSON.stringify(metadata, null, 2), 'utf-8');

      const duration = Date.now() - startTime;

      await hyperLog.log('DATA_RETRIEVAL', 'TheHarvester',
        `Harvested ${content.length} bytes from ${parsedUrl.hostname}`, {
          url,
          filename: finalFilename,
          size: content.length,
          duration,
          category
        });

      await hyperLog.log('MEMORY_STORED', 'TheHarvester',
        `Knowledge stored: ${category ? `library/${category}/` : ''}${finalFilename}`, {
          filepath,
          source: url,
          category
        });

      return {
        success: true,
        filename: finalFilename,
        filepath,
        size: content.length,
        source: url,
        timestamp: metadata.harvestedAt,
        category
      };

    } catch (error: any) {
      await hyperLog.log('SYSTEM_ERROR', 'TheHarvester',
        `Harvest failed: ${error.message}`, { url, error: error.message });

      return {
        success: false,
        error: error.message,
        source: url
      };
    }
  }

  /**
   * Sanitize a custom filename
   */
  private sanitizeFilename(filename?: string): string | undefined {
    if (!filename) return undefined;

    // Remove dangerous characters, keep extension if present
    let sanitized = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Ensure it has an extension
    if (!sanitized.includes('.')) {
      sanitized += '.txt';
    }

    return sanitized;
  }

  /**
   * Generate a filename from URL and content type
   */
  private generateFilename(url: URL, contentType: string): string {
    const timestamp = Date.now();
    const hostname = url.hostname.replace(/\./g, '_');
    const pathPart = url.pathname
      .split('/')
      .filter(p => p)
      .slice(-2)
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, '') || 'index';

    let extension = '.txt';
    if (contentType.includes('json')) extension = '.json';
    else if (contentType.includes('markdown') || url.pathname.endsWith('.md')) extension = '.md';
    else if (url.pathname.endsWith('.txt')) extension = '.txt';
    else if (url.pathname.endsWith('.c')) extension = '.c';
    else if (url.pathname.endsWith('.py')) extension = '.py';
    else if (url.pathname.endsWith('.js')) extension = '.js';
    else if (url.pathname.endsWith('.ts')) extension = '.ts';

    return `${hostname}_${pathPart}_${timestamp}${extension}`;
  }

  /**
   * List all harvested knowledge (both harvested and library)
   */
  async listHarvested(category?: string): Promise<{ files: string[]; location: string }> {
    try {
      if (category) {
        const categoryDir = path.join(KNOWLEDGE_LIBRARY, category);
        const files = await fs.readdir(categoryDir);
        return {
          files: files.filter(f => !f.endsWith('.meta.json')),
          location: `library/${category}`
        };
      }

      // List all - both harvested and library categories
      const harvested = await fs.readdir(KNOWLEDGE_HARVESTED).catch(() => []);
      const libraryCategories = await fs.readdir(KNOWLEDGE_LIBRARY).catch(() => []);

      const allFiles: string[] = [
        ...harvested.filter(f => !f.endsWith('.meta.json')).map(f => `harvested/${f}`),
      ];

      for (const cat of libraryCategories) {
        const catPath = path.join(KNOWLEDGE_LIBRARY, cat);
        const stat = await fs.stat(catPath);
        if (stat.isDirectory()) {
          const catFiles = await fs.readdir(catPath);
          allFiles.push(...catFiles.filter(f => !f.endsWith('.meta.json')).map(f => `library/${cat}/${f}`));
        }
      }

      return {
        files: allFiles,
        location: 'all'
      };
    } catch {
      return { files: [], location: 'unknown' };
    }
  }

  /**
   * Read harvested content
   */
  async readHarvested(filename: string, category?: string): Promise<{ content: string; metadata?: HarvestMetadata } | null> {
    try {
      let filepath: string;

      // Handle full paths like "library/system_prompt/file.txt"
      if (filename.startsWith('library/') || filename.startsWith('harvested/')) {
        filepath = path.join(KNOWLEDGE_ROOT, filename);
      } else if (category) {
        filepath = path.join(KNOWLEDGE_LIBRARY, category, filename);
      } else {
        filepath = path.join(KNOWLEDGE_HARVESTED, filename);
      }

      const content = await fs.readFile(filepath, 'utf-8');

      let metadata: HarvestMetadata | undefined;
      try {
        const metaContent = await fs.readFile(`${filepath}.meta.json`, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch {
        // No metadata file
      }

      return { content, metadata };
    } catch {
      return null;
    }
  }

  /**
   * Get the knowledge base paths
   */
  getKnowledgeBasePath(): string {
    return KNOWLEDGE_HARVESTED;
  }

  getLibraryPath(): string {
    return KNOWLEDGE_LIBRARY;
  }

  getRootPath(): string {
    return KNOWLEDGE_ROOT;
  }
}

export const harvesterService = HarvesterService.getInstance();
