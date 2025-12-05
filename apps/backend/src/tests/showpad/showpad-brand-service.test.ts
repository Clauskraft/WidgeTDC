/**
 * Tests for Showpad Brand Service - PPTX Parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import JSZip from 'jszip';

// Create a mock class for ShowpadAssetService
class MockShowpadAssetService {
  getBrandGuidelines = vi.fn().mockResolvedValue([]);
  getTDCTemplates = vi.fn().mockResolvedValue([]);
  downloadAsset = vi.fn().mockResolvedValue('/tmp/test.pptx');
}

// Mock the ShowpadAssetService module
vi.mock('../../services/showpad/showpad-asset-service.js', () => ({
  ShowpadAssetService: MockShowpadAssetService
}));

// Import after mocking
import { ShowpadBrandService } from '../../services/showpad/showpad-brand-service.js';

describe('ShowpadBrandService', () => {
  let brandService: ShowpadBrandService;
  let mockAssetService: MockShowpadAssetService;

  beforeEach(() => {
    mockAssetService = new MockShowpadAssetService();
    brandService = new ShowpadBrandService(mockAssetService as any);
  });

  describe('PPTX Color Extraction', () => {
    it('should extract colors from a valid PPTX theme', async () => {
      // Create a minimal PPTX with theme colors
      const zip = new JSZip();
      
      // Add theme XML with color scheme
      const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TestTheme">
  <a:themeElements>
    <a:clrScheme name="Test">
      <a:dk1><a:srgbClr val="1A1A1A"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="333333"/></a:dk2>
      <a:lt2><a:srgbClr val="F0F0F0"/></a:lt2>
      <a:accent1><a:srgbClr val="4A90E2"/></a:accent1>
      <a:accent2><a:srgbClr val="FF6B35"/></a:accent2>
      <a:accent3><a:srgbClr val="28A745"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC107"/></a:accent4>
      <a:accent5><a:srgbClr val="DC3545"/></a:accent5>
      <a:accent6><a:srgbClr val="6F42C1"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Test">
      <a:majorFont>
        <a:latin typeface="TDC Sans"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Arial"/>
      </a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`;
      
      zip.file('ppt/theme/theme1.xml', themeXml);
      
      // Write the test PPTX to a temp file
      const testPath = '/tmp/test-brand.pptx';
      const pptxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(testPath, pptxBuffer);
      
      // Access the private method via any type assertion
      const colors = await (brandService as any).extractColorsFromPPT(testPath);
      
      // Verify colors were extracted
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
      expect(colors.accent).toBeDefined();
      expect(colors.backgrounds).toBeDefined();
      expect(colors.text).toBeDefined();
      
      // Cleanup
      fs.unlinkSync(testPath);
    });

    it('should return default colors when PPTX parsing fails', async () => {
      // Use a non-existent file path
      const colors = await (brandService as any).extractColorsFromPPT('/non/existent/path.pptx');
      
      // Should return defaults
      expect(colors).toBeDefined();
      expect(colors.primary).toEqual(['#1A1A1A', '#000000']);
      expect(colors.secondary).toEqual(['#4A90E2', '#2E5C8A']);
    });

    it('should return default colors for empty PPTX', async () => {
      // Create an empty PPTX (no theme)
      const zip = new JSZip();
      zip.file('ppt/presentation.xml', '<?xml version="1.0"?><presentation/>');
      
      const testPath = '/tmp/test-empty.pptx';
      const pptxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(testPath, pptxBuffer);
      
      const colors = await (brandService as any).extractColorsFromPPT(testPath);
      
      // Should return defaults since no theme found
      expect(colors).toBeDefined();
      expect(colors.success).toBe('#28A745');
      expect(colors.warning).toBe('#FFC107');
      expect(colors.error).toBe('#DC3545');
      
      fs.unlinkSync(testPath);
    });
  });

  describe('PPTX Typography Extraction', () => {
    it('should extract fonts from a valid PPTX theme', async () => {
      const zip = new JSZip();
      
      const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TestTheme">
  <a:themeElements>
    <a:clrScheme name="Test">
      <a:dk1><a:srgbClr val="1A1A1A"/></a:dk1>
    </a:clrScheme>
    <a:fontScheme name="Test">
      <a:majorFont>
        <a:latin typeface="Helvetica Neue"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Roboto"/>
      </a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`;
      
      zip.file('ppt/theme/theme1.xml', themeXml);
      
      const testPath = '/tmp/test-fonts.pptx';
      const pptxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(testPath, pptxBuffer);
      
      const typography = await (brandService as any).extractTypographyFromPPT(testPath);
      
      expect(typography).toBeDefined();
      expect(typography.headline.family).toContain('Helvetica Neue');
      expect(typography.body.family).toContain('Roboto');
      
      fs.unlinkSync(testPath);
    });

    it('should return default typography when PPTX parsing fails', async () => {
      const typography = await (brandService as any).extractTypographyFromPPT('/non/existent/path.pptx');
      
      expect(typography).toBeDefined();
      expect(typography.headline.family).toBe('TDC Sans, Arial, sans-serif');
      expect(typography.body.family).toBe('TDC Sans, Arial, sans-serif');
    });
  });

  describe('Default Values', () => {
    it('should provide complete default brand context', async () => {
      const context = await brandService.getBrandContext();
      
      expect(context).toBeDefined();
      expect(context.colors).toBeDefined();
      expect(context.typography).toBeDefined();
      expect(context.logos).toBeDefined();
      expect(context.spacing).toBeDefined();
      expect(context.borderRadius).toBeDefined();
    });

    it('should provide color palette for PPT generation', async () => {
      const palette = await brandService.getColorPaletteForPPT();
      
      expect(palette).toBeDefined();
      expect(palette.background).toBeDefined();
      expect(palette.text).toBeDefined();
      expect(palette.accent1).toBeDefined();
      expect(palette.accent2).toBeDefined();
      expect(palette.accent3).toBeDefined();
    });

    it('should provide font config for PPT generation', async () => {
      const fontConfig = await brandService.getFontConfigForPPT();
      
      expect(fontConfig).toBeDefined();
      expect(fontConfig.headlineFont).toBeDefined();
      expect(fontConfig.bodyFont).toBeDefined();
      expect(fontConfig.titleSize).toBeGreaterThan(0);
      expect(fontConfig.bodySize).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    it('should correctly identify dark colors', () => {
      // Access private method
      const isColorDark = (brandService as any).isColorDark.bind(brandService);
      
      expect(isColorDark('#000000')).toBe(true);
      expect(isColorDark('#1A1A1A')).toBe(true);
      expect(isColorDark('#FFFFFF')).toBe(false);
      expect(isColorDark('#F0F0F0')).toBe(false);
    });
  });
});
