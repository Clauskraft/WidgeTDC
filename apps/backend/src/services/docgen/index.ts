/**
 * Document Generation Services
 * Exports for PowerPoint, Word, and Excel generation
 */

export {
  MCPPowerPointBackend,
  getMCPPowerPointBackend
} from './MCPPowerPointBackend.js';

export {
  default as DocumentGenerationService,
  getDocumentGenerationService
} from './DocumentGenerationService.js';

export {
  ShowpadBrandIntegration,
  getShowpadBrandIntegration
} from './ShowpadBrandIntegration.js';
export type { BrandedPresentationConfig, BrandedTheme } from './ShowpadBrandIntegration.js';
