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
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

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
  private async parseBrandDocument(_docPath: string): Promise<BrandContext> {
    // TODO: Implement PDF parsing using pdf-parse or similar
    // For now, return default TDC brand
    return this.getDefaultTDCBrand();
  }

  /**
   * Extract colors from PowerPoint template using JSZip
   */
  private async extractColorsFromPPT(pptPath: string): Promise<BrandColors> {
    try {
      // Read the PPTX file
      const pptxBuffer = fs.readFileSync(pptPath);
      const zip = await JSZip.loadAsync(pptxBuffer);

      // Extract colors from theme XML
      const themeColors = await this.extractThemeColors(zip);
      
      if (themeColors && themeColors.length > 0) {
        return this.mapExtractedColors(themeColors);
      }
    } catch (error) {
      console.error('Failed to extract colors from PPTX:', error);
    }

    // Fallback to default TDC colors
    return this.getDefaultBrandColors();
  }

  /**
   * Extract theme colors from PPTX theme XML
   */
  private async extractThemeColors(zip: JSZip): Promise<string[]> {
    const colors: string[] = [];
    
    // Try to find theme file (usually at ppt/theme/theme1.xml)
    const themeFile = zip.file(/ppt\/theme\/theme\d+\.xml/);
    
    if (themeFile && themeFile.length > 0) {
      const themeXml = await themeFile[0].async('text');
      const parsed = await parseStringPromise(themeXml, { explicitArray: false });
      
      // Navigate to color scheme (a:clrScheme)
      const theme = parsed?.['a:theme'];
      const themeElements = theme?.['a:themeElements'];
      const clrScheme = themeElements?.['a:clrScheme'];
      
      if (clrScheme) {
        // Extract color values from scheme
        // DrawingML color scheme elements in standard PPTX theme
        const colorElements = [
          'a:dk1', 'a:lt1', 'a:dk2', 'a:lt2',
          'a:accent1', 'a:accent2', 'a:accent3', 'a:accent4',
          'a:accent5', 'a:accent6', 'a:hlink', 'a:folHlink'
        ];
        
        for (const elem of colorElements) {
          const colorElem = clrScheme[elem];
          if (colorElem) {
            const hexColor = this.extractHexFromColorElement(colorElem);
            if (hexColor) {
              colors.push(hexColor);
            }
          }
        }
      }
    }
    
    // Also try to extract colors from slide masters
    const slideMasterColors = await this.extractSlideLayoutColors(zip);
    colors.push(...slideMasterColors);
    
    // Remove duplicates
    return [...new Set(colors)];
  }

  /**
   * Extract hex color from DrawingML color element
   */
  private extractHexFromColorElement(colorElem: unknown): string | null {
    if (!colorElem || typeof colorElem !== 'object') return null;
    
    const elem = colorElem as Record<string, unknown>;
    
    // Check for srgbClr (RGB color)
    if (elem['a:srgbClr']) {
      const srgb = elem['a:srgbClr'] as Record<string, unknown>;
      const val = srgb?.$ as Record<string, string> | undefined;
      if (val?.val) {
        return `#${val.val}`;
      }
    }
    
    // Check for sysClr (system color)
    if (elem['a:sysClr']) {
      const sysClr = elem['a:sysClr'] as Record<string, unknown>;
      const attr = sysClr?.$ as Record<string, string> | undefined;
      if (attr?.lastClr) {
        return `#${attr.lastClr}`;
      }
    }
    
    return null;
  }

  /**
   * Extract colors from slide layouts
   */
  private async extractSlideLayoutColors(zip: JSZip): Promise<string[]> {
    const colors: string[] = [];
    
    // Find slide layout files
    const layoutFiles = zip.file(/ppt\/slideLayouts\/slideLayout\d+\.xml/);
    
    for (const file of layoutFiles.slice(0, 3)) { // Check first 3 layouts
      try {
        const layoutXml = await file.async('text');
        
        // Extract hex colors using regex (faster than full XML parse)
        const hexMatches = layoutXml.match(/srgbClr val="([0-9A-Fa-f]{6})"/g);
        if (hexMatches) {
          for (const match of hexMatches) {
            const hex = match.match(/([0-9A-Fa-f]{6})/);
            if (hex) {
              colors.push(`#${hex[1]}`);
            }
          }
        }
      } catch {
        // Continue if layout parsing fails
      }
    }
    
    return colors;
  }

  /**
   * Map extracted colors to BrandColors structure
   * 
   * PowerPoint theme color order:
   * Index 0-3: dk1, lt1, dk2, lt2 (base colors)
   * Index 4-9: accent1-6 (accent colors)
   * Index 10-11: hlink, folHlink (hyperlink colors)
   */
  private mapExtractedColors(extractedColors: string[]): BrandColors {
    const defaults = this.getDefaultBrandColors();
    
    // Theme color indices
    const ACCENT_START_INDEX = 4;
    const ACCENT_END_INDEX = 10;
    const MIN_COLORS_FOR_MAPPING = 4;
    
    // If we have extracted colors, try to categorize them
    if (extractedColors.length >= MIN_COLORS_FOR_MAPPING) {
      // First colors typically: dark1, light1, dark2, light2, accents...
      const darkColors = extractedColors.filter(c => this.isColorDark(c));
      const lightColors = extractedColors.filter(c => !this.isColorDark(c));
      const accentColors = extractedColors.slice(ACCENT_START_INDEX, ACCENT_END_INDEX);
      
      return {
        primary: darkColors.slice(0, 2).length > 0 ? darkColors.slice(0, 2) : defaults.primary,
        secondary: accentColors.slice(0, 2).length > 0 ? accentColors.slice(0, 2) : defaults.secondary,
        accent: accentColors.slice(2, 4).length > 0 ? accentColors.slice(2, 4) : defaults.accent,
        backgrounds: lightColors.slice(0, 3).length > 0 ? lightColors.slice(0, 3) : defaults.backgrounds,
        text: darkColors.slice(0, 3).length > 0 ? darkColors.slice(0, 3) : defaults.text,
        success: defaults.success,
        warning: defaults.warning,
        error: defaults.error
      };
    }
    
    return defaults;
  }

  /**
   * Check if a hex color is dark
   */
  private isColorDark(hex: string): boolean {
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // Luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  /**
   * Get default brand colors
   */
  private getDefaultBrandColors(): BrandColors {
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
   * Extract typography from PowerPoint template using JSZip
   */
  private async extractTypographyFromPPT(pptPath: string): Promise<Typography> {
    try {
      // Read the PPTX file
      const pptxBuffer = fs.readFileSync(pptPath);
      const zip = await JSZip.loadAsync(pptxBuffer);

      // Extract fonts from theme XML
      const fonts = await this.extractThemeFonts(zip);
      
      if (fonts.majorFont || fonts.minorFont) {
        return {
          headline: {
            family: `${fonts.majorFont || 'Arial'}, Arial, sans-serif`,
            sizes: { h1: 48, h2: 36, h3: 28, h4: 24 },
            weights: { light: 300, regular: 400, bold: 700 },
            lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 }
          },
          body: {
            family: `${fonts.minorFont || fonts.majorFont || 'Arial'}, Arial, sans-serif`,
            sizes: { large: 18, base: 16, small: 14, xs: 12 },
            weights: { light: 300, regular: 400, medium: 500, bold: 700 },
            lineHeights: { tight: 1.4, normal: 1.6, relaxed: 1.8 }
          }
        };
      }
    } catch (error) {
      console.error('Failed to extract typography from PPTX:', error);
    }

    // Fallback to default TDC typography
    return this.getDefaultTypography();
  }

  /**
   * Extract fonts from PPTX theme XML
   */
  private async extractThemeFonts(zip: JSZip): Promise<{ majorFont: string | null; minorFont: string | null }> {
    // Try to find theme file
    const themeFile = zip.file(/ppt\/theme\/theme\d+\.xml/);
    
    if (themeFile && themeFile.length > 0) {
      try {
        const themeXml = await themeFile[0].async('text');
        const parsed = await parseStringPromise(themeXml, { explicitArray: false });
        
        const theme = parsed?.['a:theme'];
        const themeElements = theme?.['a:themeElements'];
        const fontScheme = themeElements?.['a:fontScheme'];
        
        if (fontScheme) {
          const majorFont = this.extractFontFromScheme(fontScheme['a:majorFont']);
          const minorFont = this.extractFontFromScheme(fontScheme['a:minorFont']);
          
          return { majorFont, minorFont };
        }
      } catch {
        // Continue if parsing fails
      }
    }
    
    return { majorFont: null, minorFont: null };
  }

  /**
   * Extract font name from font scheme element
   */
  private extractFontFromScheme(fontElem: unknown): string | null {
    if (!fontElem || typeof fontElem !== 'object') return null;
    
    const elem = fontElem as Record<string, unknown>;
    
    // Check for Latin font
    if (elem['a:latin']) {
      const latin = elem['a:latin'] as Record<string, unknown>;
      const attr = latin?.$ as Record<string, string> | undefined;
      if (attr?.typeface) {
        return attr.typeface;
      }
    }
    
    return null;
  }

  /**
   * Get default typography
   */
  private getDefaultTypography(): Typography {
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
      colors: this.getDefaultBrandColors(),
      typography: this.getDefaultTypography(),
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
