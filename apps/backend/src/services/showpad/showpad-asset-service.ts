/**
 * Showpad Asset Service
 *
 * Manages retrieval and caching of TDC brand assets from Showpad:
 * - PowerPoint templates
 * - Logos (PNG, SVG, EPS)
 * - Brand documents
 * - Images and media
 */

import { ShowpadAuthService } from './showpad-auth.js';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

interface ShowpadAsset {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  type: 'document' | 'image' | 'video' | 'other';
  description?: string;
  tags: string[];
  permissions: {
    share: boolean;
    annotate: boolean;
    download: boolean;
  };
  previewUrl?: string;
  downloadUrl?: string;
  metadata: {
    size?: number;
    mimeType?: string;
    dimensions?: { width: number; height: number };
    createdAt?: string;
    modifiedAt?: string;
  };
}

interface AssetSearchOptions {
  query?: string;
  tags?: string[];
  type?: ShowpadAsset['type'];
  limit?: number;
  offset?: number;
}

interface CachedAsset {
  asset: ShowpadAsset;
  localPath: string;
  cachedAt: number;
  size: number;
}

export class ShowpadAssetService extends EventEmitter {
  private auth: ShowpadAuthService;
  private cacheDir: string;
  private cache: Map<string, CachedAsset> = new Map();
  private cacheTTL: number; // milliseconds

  constructor(auth: ShowpadAuthService, cacheDir?: string) {
    super();
    this.auth = auth;
    this.cacheDir = cacheDir || path.join(process.cwd(), 'cache', 'showpad');
    this.cacheTTL = parseInt(process.env.SHOWPAD_CACHE_TTL || '86400000'); // 24h default

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    this.loadCacheIndex();
  }

  /**
   * Search for assets in Showpad library
   */
  async searchAssets(options: AssetSearchOptions = {}): Promise<ShowpadAsset[]> {
    const params = new URLSearchParams();

    if (options.query) params.append('query', options.query);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const endpoint = `/assets?${params.toString()}`;
    const response = await this.auth.request<{ data: any[] }>(endpoint);

    const assets: ShowpadAsset[] = response.data.map(this.parseAssetResponse);

    // Filter by type if specified
    if (options.type) {
      return assets.filter(a => a.type === options.type);
    }

    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
      return assets.filter(a =>
        options.tags!.some(tag => a.tags.includes(tag))
      );
    }

    return assets;
  }

  /**
   * Get specific asset by ID
   */
  async getAsset(assetId: string): Promise<ShowpadAsset> {
    const response = await this.auth.request<any>(`/assets/${assetId}`);
    return this.parseAssetResponse(response);
  }

  /**
   * Download asset and cache locally
   */
  async downloadAsset(assetId: string, force: boolean = false): Promise<string> {
    // Check if already cached
    if (!force && this.cache.has(assetId)) {
      const cached = this.cache.get(assetId)!;

      // Check if cache is still valid
      if (Date.now() - cached.cachedAt < this.cacheTTL) {
        return cached.localPath;
      }
    }

    const asset = await this.getAsset(assetId);

    if (!asset.permissions.download) {
      throw new Error(`Asset ${assetId} is not downloadable`);
    }

    // Get download URL
    const downloadUrlResponse = await this.auth.request<{ url: string }>(
      `/assets/${assetId}/download`
    );

    // Download file
    const response = await fetch(downloadUrlResponse.url);
    if (!response.ok) {
      throw new Error(`Failed to download asset: ${response.statusText}`);
    }

    // Save to cache
    const filename = this.sanitizeFilename(asset.displayName);
    const localPath = path.join(this.cacheDir, filename);
    const buffer = await response.arrayBuffer();

    fs.writeFileSync(localPath, Buffer.from(buffer));

    // Update cache index
    const cached: CachedAsset = {
      asset,
      localPath,
      cachedAt: Date.now(),
      size: buffer.byteLength
    };

    this.cache.set(assetId, cached);
    this.saveCacheIndex();

    this.emit('asset_downloaded', { assetId, path: localPath });
    return localPath;
  }

  /**
   * Get all TDC PowerPoint templates
   */
  async getTDCTemplates(): Promise<ShowpadAsset[]> {
    return this.searchAssets({
      query: 'template',
      tags: ['powerpoint', 'template', 'tdc'],
      type: 'document'
    });
  }

  /**
   * Get TDC logos (all variants)
   */
  async getTDCLogos(): Promise<ShowpadAsset[]> {
    return this.searchAssets({
      query: 'logo',
      tags: ['logo', 'tdc', 'brand'],
      type: 'image'
    });
  }

  /**
   * Get brand guideline documents
   */
  async getBrandGuidelines(): Promise<ShowpadAsset[]> {
    return this.searchAssets({
      query: 'brand guidelines',
      tags: ['brand', 'guidelines'],
      type: 'document'
    });
  }

  /**
   * Download and cache all essential TDC assets
   */
  async syncEssentialAssets(): Promise<void> {
    this.emit('sync_started');

    try {
      // Download templates
      const templates = await this.getTDCTemplates();
      for (const template of templates) {
        await this.downloadAsset(template.id);
      }

      // Download logos
      const logos = await this.getTDCLogos();
      for (const logo of logos) {
        await this.downloadAsset(logo.id);
      }

      // Download brand guidelines
      const guidelines = await this.getBrandGuidelines();
      for (const guideline of guidelines) {
        await this.downloadAsset(guideline.id);
      }

      this.emit('sync_completed', {
        templates: templates.length,
        logos: logos.length,
        guidelines: guidelines.length
      });
    } catch (error) {
      this.emit('sync_error', error);
      throw error;
    }
  }

  /**
   * Get cached asset path (if exists and valid)
   */
  getCachedAsset(assetId: string): string | null {
    const cached = this.cache.get(assetId);

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.cachedAt > this.cacheTTL) {
      return null;
    }

    // Check if file still exists
    if (!fs.existsSync(cached.localPath)) {
      this.cache.delete(assetId);
      return null;
    }

    return cached.localPath;
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    // Delete all cached files
    const entries = Array.from(this.cache.entries());
    for (const [_id, cached] of entries) {
      try {
        if (fs.existsSync(cached.localPath)) {
          fs.unlinkSync(cached.localPath);
        }
      } catch (error) {
        console.error(`Failed to delete cached file: ${cached.localPath}`, error);
      }
    }

    this.cache.clear();
    this.saveCacheIndex();
    this.emit('cache_cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    count: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalSize = 0;
    let oldest = Date.now();
    let newest = 0;

    const values = Array.from(this.cache.values());
    for (const cached of values) {
      totalSize += cached.size;
      oldest = Math.min(oldest, cached.cachedAt);
      newest = Math.max(newest, cached.cachedAt);
    }

    return {
      count: this.cache.size,
      totalSize,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  /**
   * Parse Showpad API asset response into our format
   */
  private parseAssetResponse(data: any): ShowpadAsset {
    return {
      id: data.id,
      slug: data.slug || '',
      name: data.name,
      displayName: data.displayName || data.name,
      type: this.mapAssetType(data.type),
      description: data.description,
      tags: data.tags || [],
      permissions: {
        share: data.permissions?.share ?? false,
        annotate: data.permissions?.annotate ?? false,
        download: data.permissions?.download ?? false
      },
      previewUrl: data.previewUrl,
      downloadUrl: data.downloadUrl,
      metadata: {
        size: data.size,
        mimeType: data.mimeType,
        dimensions: data.dimensions,
        createdAt: data.createdAt,
        modifiedAt: data.modifiedAt
      }
    };
  }

  /**
   * Map Showpad asset type to our enum
   */
  private mapAssetType(type: string): ShowpadAsset['type'] {
    if (type.includes('image')) return 'image';
    if (type.includes('video')) return 'video';
    if (type.includes('document') || type.includes('pdf') || type.includes('ppt')) {
      return 'document';
    }
    return 'other';
  }

  /**
   * Sanitize filename for safe filesystem storage
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
  }

  /**
   * Load cache index from disk
   */
  private loadCacheIndex(): void {
    const indexPath = path.join(this.cacheDir, 'cache-index.json');

    if (!fs.existsSync(indexPath)) return;

    try {
      const data = fs.readFileSync(indexPath, 'utf-8');
      const index: Record<string, CachedAsset> = JSON.parse(data);

      for (const [id, cached] of Object.entries(index)) {
        this.cache.set(id, cached);
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  /**
   * Save cache index to disk
   */
  private saveCacheIndex(): void {
    const indexPath = path.join(this.cacheDir, 'cache-index.json');
    const index: Record<string, CachedAsset> = {};

    const entries = Array.from(this.cache.entries());
    for (const [id, cached] of entries) {
      index[id] = cached;
    }

    try {
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.saveCacheIndex();
    this.removeAllListeners();
  }
}

// Export types for external use
export type { ShowpadAsset, AssetSearchOptions, CachedAsset };
