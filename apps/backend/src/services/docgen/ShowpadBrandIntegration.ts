/**
 * Showpad Brand Integration for Document Generation
 *
 * Connects Showpad brand assets with PowerPoint/document generation:
 * - Applies TDC brand colors and typography
 * - Retrieves branded templates
 * - Ensures brand compliance
 */

import { ShowpadBrandService, type BrandContext } from '../showpad/showpad-brand-service.js';
import { ShowpadAssetService, type ShowpadAsset } from '../showpad/showpad-asset-service.js';
import { createShowpadAuthFromEnv } from '../showpad/showpad-auth.js';
import { logger } from '../../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface BrandedPresentationConfig {
  title: string;
  topic: string;
  audience?: string;
  useShowpadTemplate?: boolean;
  brandContext?: BrandContext;
}

export interface BrandedTheme {
  colors: {
    background: string;
    text: string;
    accent1: string;
    accent2: string;
    accent3: string;
  };
  fonts: {
    headlineFont: string;
    bodyFont: string;
    titleSize: number;
    bodySize: number;
  };
  logos?: {
    primaryPath?: string;
    iconPath?: string;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════

class ShowpadBrandIntegration {
  private brandService: ShowpadBrandService | null = null;
  private assetService: ShowpadAssetService | null = null;
  private initialized = false;
  private initializationError: Error | null = null;

  /**
   * Initialize Showpad services (lazy initialization)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (this.initializationError) return false;

    try {
      // Check if Showpad credentials are configured
      if (!process.env.SHOWPAD_SUBDOMAIN) {
        logger.info('Showpad integration not configured - using default brand values');
        this.initialized = true;
        return false;
      }

      const auth = createShowpadAuthFromEnv();
      await auth.authenticate();

      this.assetService = new ShowpadAssetService(auth);
      this.brandService = new ShowpadBrandService(this.assetService);

      this.initialized = true;
      logger.info('✅ Showpad Brand Integration initialized');
      return true;

    } catch (error) {
      this.initializationError = error as Error;
      logger.warn('⚠️ Showpad integration unavailable:', (error as Error).message);
      this.initialized = true; // Mark as initialized to use fallbacks
      return false;
    }
  }

  /**
   * Get branded theme for document generation
   */
  async getBrandedTheme(): Promise<BrandedTheme> {
    await this.initialize();

    if (this.brandService) {
      try {
        const [colorPalette, fontConfig] = await Promise.all([
          this.brandService.getColorPaletteForPPT(),
          this.brandService.getFontConfigForPPT()
        ]);

        return {
          colors: colorPalette,
          fonts: fontConfig
        };
      } catch (error) {
        logger.warn('Failed to get Showpad brand theme, using defaults:', error);
      }
    }

    // Return default TDC theme
    return this.getDefaultTheme();
  }

  /**
   * Get full brand context
   */
  async getBrandContext(): Promise<BrandContext | null> {
    await this.initialize();

    if (this.brandService) {
      try {
        return await this.brandService.getBrandContext();
      } catch (error) {
        logger.warn('Failed to get brand context:', error);
      }
    }

    return null;
  }

  /**
   * Get TDC PowerPoint templates from Showpad
   */
  async getTemplates(): Promise<ShowpadAsset[]> {
    await this.initialize();

    if (this.assetService) {
      try {
        return await this.assetService.getTDCTemplates();
      } catch (error) {
        logger.warn('Failed to get Showpad templates:', error);
      }
    }

    return [];
  }

  /**
   * Get TDC logos from Showpad
   */
  async getLogos(): Promise<ShowpadAsset[]> {
    await this.initialize();

    if (this.assetService) {
      try {
        return await this.assetService.getTDCLogos();
      } catch (error) {
        logger.warn('Failed to get Showpad logos:', error);
      }
    }

    return [];
  }

  /**
   * Download a specific asset for local use
   */
  async downloadAsset(assetId: string): Promise<string | null> {
    await this.initialize();

    if (this.assetService) {
      try {
        return await this.assetService.downloadAsset(assetId);
      } catch (error) {
        logger.warn(`Failed to download asset ${assetId}:`, error);
      }
    }

    return null;
  }

  /**
   * Check if Showpad integration is available
   */
  isAvailable(): boolean {
    return this.initialized && !this.initializationError && !!this.brandService;
  }

  /**
   * Get integration status
   */
  getStatus(): {
    initialized: boolean;
    available: boolean;
    error?: string;
  } {
    return {
      initialized: this.initialized,
      available: this.isAvailable(),
      error: this.initializationError?.message
    };
  }

  /**
   * Default TDC brand theme (fallback)
   */
  private getDefaultTheme(): BrandedTheme {
    return {
      colors: {
        background: '#FFFFFF',
        text: '#1A1A1A',
        accent1: '#1A1A1A',
        accent2: '#4A90E2',
        accent3: '#FF6B35'
      },
      fonts: {
        headlineFont: 'TDC Sans',
        bodyFont: 'TDC Sans',
        titleSize: 48,
        bodySize: 16
      }
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Singleton Export
// ════════════════════════════════════════════════════════════════════════════

let instance: ShowpadBrandIntegration | null = null;

export function getShowpadBrandIntegration(): ShowpadBrandIntegration {
  if (!instance) {
    instance = new ShowpadBrandIntegration();
  }
  return instance;
}

export { ShowpadBrandIntegration };
export default ShowpadBrandIntegration;
