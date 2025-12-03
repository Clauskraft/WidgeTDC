/**
 * TDC Showpad Integration Types
 *
 * Shared type definitions for Showpad brand asset integration
 */

// ════════════════════════════════════════════════════════════════════════════
// Authentication Types
// ════════════════════════════════════════════════════════════════════════════

export interface ShowpadCredentials {
  subdomain: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ShowpadTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface ShowpadAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  scope: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// Asset Types
// ════════════════════════════════════════════════════════════════════════════

export type ShowpadAssetType = 'document' | 'image' | 'video' | 'other';

export interface ShowpadAsset {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  type: ShowpadAssetType;
  description?: string;
  tags: string[];
  permissions: ShowpadAssetPermissions;
  previewUrl?: string;
  downloadUrl?: string;
  metadata: ShowpadAssetMetadata;
}

export interface ShowpadAssetPermissions {
  share: boolean;
  annotate: boolean;
  download: boolean;
}

export interface ShowpadAssetMetadata {
  size?: number;
  mimeType?: string;
  dimensions?: { width: number; height: number };
  createdAt?: string;
  modifiedAt?: string;
}

export interface ShowpadAssetSearchOptions {
  query?: string;
  tags?: string[];
  type?: ShowpadAssetType;
  limit?: number;
  offset?: number;
}

export interface ShowpadCachedAsset {
  asset: ShowpadAsset;
  localPath: string;
  cachedAt: number;
  size: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Brand Types
// ════════════════════════════════════════════════════════════════════════════

export interface ShowpadBrandColors {
  primary: string[];
  secondary: string[];
  accent: string[];
  backgrounds: string[];
  text: string[];
  success: string;
  warning: string;
  error: string;
}

export interface ShowpadTypography {
  headline: ShowpadFontConfig;
  body: ShowpadFontConfig;
}

export interface ShowpadFontConfig {
  family: string;
  sizes: { [key: string]: number };
  weights: { [key: string]: number };
  lineHeights: { [key: string]: number };
}

export interface ShowpadLogoSpecs {
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

export interface ShowpadBrandContext {
  colors: ShowpadBrandColors;
  typography: ShowpadTypography;
  logos: ShowpadLogoSpecs;
  spacing: { [key: string]: number };
  borderRadius: { [key: string]: number };
}

// ════════════════════════════════════════════════════════════════════════════
// PowerPoint Integration Types
// ════════════════════════════════════════════════════════════════════════════

export interface ShowpadPPTColorPalette {
  background: string;
  text: string;
  accent1: string;
  accent2: string;
  accent3: string;
}

export interface ShowpadPPTFontConfig {
  headlineFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Event Types
// ════════════════════════════════════════════════════════════════════════════

export interface ShowpadAuthEvent {
  type: 'authenticated' | 'token_refreshed' | 'logged_out' | 'auth_error' | 'token_refresh_failed';
  scope?: string[];
  error?: Error;
}

export interface ShowpadAssetEvent {
  type: 'asset_downloaded' | 'sync_started' | 'sync_completed' | 'sync_error' | 'cache_cleared';
  assetId?: string;
  path?: string;
  templates?: number;
  logos?: number;
  guidelines?: number;
  error?: Error;
}
