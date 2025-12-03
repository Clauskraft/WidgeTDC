/**
 * Showpad Brand Service
 * 
 * Extracts and manages TDC brand guidelines:
 * - Brand colors (primary, secondary, accent)
 * - Typography (fonts, sizes, weights)
 * - Logo specifications
 * - Layout guidelines
 */

import { ShowpadAssetService } from './showpad-asset-service';
import * as fs from 'fs';
import * as path from 'path';

interface BrandColors {
  primary: string[];
  secondary: string[];
  accent: string[];
  backgrounds: string[];
  text: string[];
  success: string;
  warning: string;
  error: string;
}

interface Typography {
  headline: {
    family: string;
    sizes: { [key: string]: number };
    weights: { [key: string]: number };
    lineHeights: { [key: string]: number };
  };
  body: {
    family: string;
    sizes: { [key: string]: number };
    weights: { [key: string]: number };
    lineHeights: { [key: string]: number };
  };
}

interface LogoSpecs {
  primary: {
    minWidth: number;
    clearSpace: number;
    colorVariants: string[];
    formats: string[];
  };
  icon: {
    minSize: number;
    formats: string[];
  };
}

interface BrandContext {
  colors: BrandColors;
  typography: Typography;
  logos: LogoSpecs;
  spacing: { [key: string]: number };
  borderRadius: { [key: string]: number };
}

export class ShowpadBrandService {
  private assetService: ShowpadAssetService;
  private brandContext: BrandContext | null = null;
  private cacheFile: string;

  constructor(assetService: ShowpadAssetService) {
    this.assetService = assetService;
    this.cacheFile = path.join(
      process.cwd(),
      'cache',
      'showpad',
      'brand-context.json'
    );

    this.loadBrandContextFromCache();
  }

  /**
   * Get complete TDC brand context
   */
  async getBrandContext(forceRefresh: boolean = false): Promise<BrandContext> {
    if (this.brandContext && !forceRefresh) {
      return this.brandContext;
    }

    // Extract from brand guidelines or templates
    await this.extractBrandContext();

    return this.brandContext!;
  }

  /**
   * Get TDC brand colors
   */
  async getTDCColors(): Promise<BrandColors> {
    const context = await this.getBrandContext();
    return context.colors;
  }

  /**
   * Get TDC typography guidelines
   */
  async getTDCTypography(): Promise<Typography> {
    const context = await this.getBrandContext();
    return context.typography;
  }

  /**
   * Get logo specifications
   */
  async getLogoSpecs(): Promise<LogoSpecs> {
    const context = await this.getBrandContext();
    return context.logos;
  }

  /**
   * Extract brand context from Showpad assets
   */
  private async extractBrandContext(): Promise<void> {
    // Get brand guidelines documents
    const guidelines = await this.assetService.getBrandGuidelines();

    if (guidelines.length === 0) {
      // Fallback to extracting from templates
      await this.extractFromTemplates();
      return;
    }

    // Download and parse main brand guideline doc
    const mainGuideline = guidelines[0];
    const docPath = await this.assetService.downloadAsset(mainGuideline.id);

    // Parse document (PDF/PPTX) to extract brand info
    this.brandContext = await this.parseBrandDocument(docPath);

    // Cache for future use
    this.saveBrandContextToCache();
  }

  /**
   * Extract brand context from PowerPoint templates
   */
  private async extractFromTemplates(): Promise<void> {
    const templates = await this.assetService.getTDCTemplates();

    if (templates.length === 0) {
      // Use default TDC brand values
      this.brandContext = this.getDefaultTDCBrand();
      return;
    }

    // Download first template
    const templatePath = await this.assetService.downloadAsset(templates[0].id);

    // Extract colors from template
    const colors = await this.extractColorsFromPPT(templatePath);
    const typography = await this.extractTypographyFromPPT(templatePath);

    this.brandContext = {
      colors,
      typography,
      logos: this.getDefaultLogoSpecs(),
      spacing: { small: 8, medium: 16, large: 24, xlarge: 32 },
      borderRadius: { small: 4, medium: 8, large: 16 }
    };

    this.saveBrandContextToCache();
  }

  /**
   * Parse brand document (PDF) to extract guidelines
   */
  private async parseBrandDocument(docPath: string): Promise<BrandContext> {
    // TODO: Implement PDF parsing using pdf-parse or similar
    // For now, return default TDC brand
    return this.getDefaultTDCBrand();
  }

  /**
   * Extract colors from PowerPoint template
   */
  private async extractColorsFromPPT(pptPath: string): Promise<BrandColors> {
    // TODO: Implement PPTX parsing using PptxGenJS or similar
    // For now, return known TDC colors
    return {
      primary: ['#1A1A1A', '#000000'],
      secondary: ['#4A90E2', '#2E5C8A'],
      accent: ['#FF6B35', '#E85A2E'],
      backgrounds: ['#FFFFFF', '#F5F5F5', '#E8E8E8'],
      text: ['#1A1A1A', '#666666', '#999999'],
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545'
    };
  }

  /**
   * Extract typography from PowerPoint template
   */
  private async extractTypographyFromPPT(pptPath: string): Promise<Typography> {
    // TODO: Implement PPTX font extraction
    // For now, return known TDC typography
    return {
      headline: {
        family: 'TDC Sans, Arial, sans-serif',
        sizes: { h1: 48, h2: 36, h3: 28, h4: 24 },
        weights: { light: 300, regular: 400, bold: 700 },
        lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 }
      },
      body: {
        family: 'TDC Sans, Arial, sans-serif',
        sizes: { large: 18, base: 16, small: 14, xs: 12 },
        weights: { light: 300, regular: 400, medium: 500, bold: 700 },
        lineHeights: { tight: 1.4, normal: 1.6, relaxed: 1.8 }
      }
    };
  }

  /**
   * Get default TDC brand values (fallback)
   */
  private getDefaultTDCBrand(): BrandContext {
    return {
      colors: {
        primary: ['#1A1A1A', '#000000'],
        secondary: ['#4A90E2', '#2E5C8A'],
        accent: ['#FF6B35', '#E85A2E'],
        backgrounds: ['#FFFFFF', '#F5F5F5', '#E8E8E8'],
        text: ['#1A1A1A', '#666666', '#999999'],
        success: '#28A745',
        warning: '#FFC107',
        error: '#DC3545'
      },
      typography: {
        headline: {
          family: 'TDC Sans, Arial, sans-serif',
          sizes: { h1: 48, h2: 36, h3: 28, h4: 24 },
          weights: { light: 300, regular: 400, bold: 700 },
          lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 }
        },
        body: {
          family: 'TDC Sans, Arial, sans-serif',
          sizes: { large: 18, base: 16, small: 14, xs: 12 },
          weights: { light: 300, regular: 400, medium: 500, bold: 700 },
          lineHeights: { tight: 1.4, normal: 1.6, relaxed: 1.8 }
        }
      },
      logos: this.getDefaultLogoSpecs(),
      spacing: {
        xs: 4,
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32,
        xxlarge: 48
      },
      borderRadius: {
        none: 0,
        small: 4,
        medium: 8,
        large: 16,
        full: 9999
      }
    };
  }

  /**
   * Get default logo specifications
   */
  private getDefaultLogoSpecs(): LogoSpecs {
    return {
      primary: {
        minWidth: 120,
        clearSpace: 20,
        colorVariants: ['full-color', 'white', 'black', 'reversed'],
        formats: ['png', 'svg', 'eps', 'pdf']
      },
      icon: {
        minSize: 32,
        formats: ['png', 'svg', 'ico']
      }
    };
  }

  /**
   * Load brand context from cache file
   */
  private loadBrandContextFromCache(): void {
    if (!fs.existsSync(this.cacheFile)) return;

    try {
      const data = fs.readFileSync(this.cacheFile, 'utf-8');
      this.brandContext = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load brand context cache:', error);
    }
  }

  /**
   * Save brand context to cache file
   */
  private saveBrandContextToCache(): void {
    if (!this.brandContext) return;

    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      fs.writeFileSync(
        this.cacheFile,
        JSON.stringify(this.brandContext, null, 2)
      );
    } catch (error) {
      console.error('Failed to save brand context cache:', error);
    }
  }

  /**
   * Clear cached brand context
   */
  clearCache(): void {
    this.brandContext = null;
    
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
  }

  /**
   * Get color palette for PowerPoint generation
   */
  async getColorPaletteForPPT(): Promise<{
    background: string;
    text: string;
    accent1: string;
    accent2: string;
    accent3: string;
  }> {
    const colors = await this.getTDCColors();

    return {
      background: colors.backgrounds[0],
      text: colors.text[0],
      accent1: colors.primary[0],
      accent2: colors.secondary[0],
      accent3: colors.accent[0]
    };
  }

  /**
   * Get font configuration for PowerPoint generation
   */
  async getFontConfigForPPT(): Promise<{
    headlineFont: string;
    bodyFont: string;
    titleSize: number;
    bodySize: number;
  }> {
    const typography = await this.getTDCTypography();

    return {
      headlineFont: typography.headline.family.split(',')[0].trim(),
      bodyFont: typography.body.family.split(',')[0].trim(),
      titleSize: typography.headline.sizes.h1,
      bodySize: typography.body.sizes.base
    };
  }
}

// Example usage:
// const auth = createShowpadAuthFromEnv();
// const assets = new ShowpadAssetService(auth);
// const brand = new ShowpadBrandService(assets);
// const colors = await brand.getTDCColors();
// const typography = await brand.getTDCTypography();
