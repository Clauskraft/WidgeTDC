/**
 * TDC Showpad Integration Module
 *
 * Provides access to TDC's Showpad brand assets:
 * - Authentication with OAuth 2.0 / Password auth
 * - Asset management (templates, logos, guidelines)
 * - Brand context extraction (colors, typography, logos)
 *
 * @module showpad
 */

export { ShowpadAuthService, createShowpadAuthFromEnv } from './showpad-auth.js';
export type { ShowpadCredentials, TokenResponse, AuthState } from './showpad-auth.js';

export { ShowpadAssetService } from './showpad-asset-service.js';
export type { ShowpadAsset, AssetSearchOptions, CachedAsset } from './showpad-asset-service.js';

export { ShowpadBrandService } from './showpad-brand-service.js';
export type { BrandColors, Typography, LogoSpecs, BrandContext } from './showpad-brand-service.js';

/**
 * Create a fully initialized Showpad service stack from environment variables
 */
export async function createShowpadServices() {
  const { createShowpadAuthFromEnv } = await import('./showpad-auth.js');
  const { ShowpadAssetService } = await import('./showpad-asset-service.js');
  const { ShowpadBrandService } = await import('./showpad-brand-service.js');

  const auth = createShowpadAuthFromEnv();
  await auth.authenticate();

  const assetService = new ShowpadAssetService(auth);
  const brandService = new ShowpadBrandService(assetService);

  return {
    auth,
    assets: assetService,
    brand: brandService
  };
}
