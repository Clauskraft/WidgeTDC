/**
 * Widget Platform Types
 * 
 * Enterprise-grade type definitions for the Widget Registry 2.0 system.
 * Supports dynamic widget discovery, version management, security verification,
 * and performance monitoring as specified in SystemOverSeer Phase 1.
 */

import type { ComponentType, ReactNode } from 'react';

/**
 * Semantic version string (e.g., "1.2.3")
 */
export type WidgetVersion = string;

/**
 * Unique identifier for a widget type
 */
export type WidgetTypeId = string;

/**
 * Unique identifier for a widget instance
 */
export type WidgetInstanceId = string;

/**
 * Widget capability identifiers
 */
export type WidgetCapability = 
  | 'chat'
  | 'visualization'
  | 'data-query'
  | 'file-upload'
  | 'export'
  | 'collaboration'
  | 'real-time'
  | 'offline'
  | 'audit-aware'
  | 'accessibility-enhanced';

/**
 * Widget manifest describing a widget's metadata, capabilities, and requirements
 */
export interface WidgetManifest {
  /** Unique identifier for the widget type */
  id: WidgetTypeId;
  
  /** Display name shown in UI */
  name: string;
  
  /** Semantic version */
  version: WidgetVersion;
  
  /** Brief description of widget functionality */
  description: string;
  
  /** Widget author/vendor information */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** Widget capabilities */
  capabilities: WidgetCapabilities;
  
  /** Default layout dimensions */
  defaultLayout: WidgetLayout;
  
  /** Layout constraints */
  constraints?: {
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
  };
  
  /** Dependencies on other widgets or platform features */
  dependencies?: {
    widgets?: { id: WidgetTypeId; version: string }[];
    platformVersion?: string;
  };
  
  /** Digital signature for verification (Phase 1: optional, Phase 2: required) */
  signature?: WidgetSignature;
  
  /** Source of the widget */
  source: WidgetSource;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Widget capabilities definition
 */
export interface WidgetCapabilities {
  /** List of capability identifiers */
  features: WidgetCapability[];
  
  /** Whether widget requires network access */
  requiresNetwork: boolean;
  
  /** Whether widget stores user data locally */
  storesData: boolean;
  
  /** Whether widget is GDPR compliant */
  gdprCompliant: boolean;
  
  /** Required permissions */
  permissions?: string[];
}

/**
 * Widget layout definition for react-grid-layout
 */
export interface WidgetLayout {
  /** Width in grid units */
  w: number;
  
  /** Height in grid units */
  h: number;
  
  /** X position (optional, for saved layouts) */
  x?: number;
  
  /** Y position (optional, for saved layouts) */
  y?: number;
}

/**
 * Widget instance representing an active widget on the dashboard
 */
export interface WidgetInstance {
  /** Unique instance identifier */
  id: WidgetInstanceId;
  
  /** Reference to widget type */
  widgetType: WidgetTypeId;
  
  /** Current layout position and size */
  layout: WidgetLayout;
  
  /** Instance-specific configuration */
  config?: Record<string, unknown>;
  
  /** Instance state (if persistence is enabled) */
  state?: Record<string, unknown>;
  
  /** Performance metrics */
  metrics?: WidgetPerformanceMetrics;
  
  /** Timestamp of creation */
  createdAt: Date;
  
  /** Timestamp of last update */
  updatedAt: Date;
}

/**
 * Widget performance metrics for monitoring and optimization
 */
export interface WidgetPerformanceMetrics {
  /** Render time in milliseconds */
  renderTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** Number of re-renders */
  renderCount: number;
  
  /** Error count */
  errorCount: number;
  
  /** Last error timestamp */
  lastErrorAt?: Date;
}

/**
 * Widget validation result
 */
export interface WidgetValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  
  /** Validation warnings */
  warnings: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

/**
 * Digital signature for widget verification
 */
export interface WidgetSignature {
  /** Signature algorithm (e.g., "RS256", "ES256") */
  algorithm: string;
  
  /** Base64-encoded signature */
  signature: string;
  
  /** Public key or certificate for verification */
  publicKey: string;
  
  /** Timestamp of signing */
  signedAt: Date;
}

/**
 * Widget source information
 */
export type WidgetSource = 
  | { type: 'proprietary' }
  | { type: 'microsoft'; msWidgetData?: Record<string, unknown> }
  | { type: 'marketplace'; marketplaceId: string; vendor: string }
  | { type: 'custom'; url: string };

/**
 * Widget component props
 */
export interface WidgetComponentProps {
  /** Instance ID */
  instanceId: WidgetInstanceId;
  
  /** Instance configuration */
  config?: Record<string, unknown>;
  
  /** Callback to update instance configuration */
  onConfigChange?: (config: Record<string, unknown>) => void;
  
  /** Callback to report errors */
  onError?: (error: Error) => void;
  
  /** Platform services (injected via context) */
  services?: unknown; // Will be typed in PlatformContext
}

/**
 * Widget component type
 */
export type WidgetComponent = ComponentType<WidgetComponentProps>;

/**
 * Widget definition combining manifest and component
 */
export interface WidgetDefinition {
  /** Widget manifest */
  manifest: WidgetManifest;
  
  /** React component */
  component: WidgetComponent;
}
