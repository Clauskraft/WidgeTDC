/**
 * Widget Registry System 2.0
 * 
 * Enterprise registry for dynamic widget discovery, version management,
 * and lifecycle operations. Supports local and remote widget sources,
 * dependency resolution, and signature verification.
 */

import type {
  WidgetDefinition,
  WidgetManifest,
  WidgetTypeId,
  WidgetVersion,
  WidgetValidationResult,
  WidgetSource,
} from './types';

/**
 * Widget registry entry with version and validation metadata
 */
export interface WidgetRegistryEntry {
  /** Widget definition */
  definition: WidgetDefinition;
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Validation result */
  validation: WidgetValidationResult;
  
  /** Whether widget is enabled */
  enabled: boolean;
  
  /** Usage statistics */
  stats?: {
    instanceCount: number;
    lastUsed?: Date;
  };
}

/**
 * Query parameters for widget registry search
 */
export interface WidgetRegistryQuery {
  /** Filter by widget ID (exact match) */
  id?: WidgetTypeId;
  
  /** Filter by name (case-insensitive partial match) */
  name?: string;
  
  /** Filter by source type */
  source?: WidgetSource['type'];
  
  /** Filter by capability */
  capability?: string;
  
  /** Filter by enabled status */
  enabled?: boolean;
  
  /** Sort by field */
  sortBy?: 'name' | 'version' | 'registeredAt' | 'lastUsed';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Widget Registry interface
 * 
 * Manages the lifecycle of widget definitions including registration,
 * discovery, validation, and unregistration.
 */
export interface WidgetRegistry {
  /**
   * Register a new widget definition
   * @param definition Widget definition to register
   * @returns Validation result
   */
  register(definition: WidgetDefinition): Promise<WidgetValidationResult>;
  
  /**
   * Unregister a widget by ID
   * @param id Widget type ID
   * @returns Whether unregistration was successful
   */
  unregister(id: WidgetTypeId): Promise<boolean>;
  
  /**
   * Get a widget definition by ID
   * @param id Widget type ID
   * @returns Widget registry entry or undefined if not found
   */
  get(id: WidgetTypeId): Promise<WidgetRegistryEntry | undefined>;
  
  /**
   * Query widgets matching criteria
   * @param query Query parameters
   * @returns Array of matching widget entries
   */
  query(query: WidgetRegistryQuery): Promise<WidgetRegistryEntry[]>;
  
  /**
   * List all registered widgets
   * @returns Array of all widget entries
   */
  listAll(): Promise<WidgetRegistryEntry[]>;
  
  /**
   * Validate a widget manifest
   * @param manifest Widget manifest to validate
   * @returns Validation result
   */
  validate(manifest: WidgetManifest): Promise<WidgetValidationResult>;
  
  /**
   * Enable or disable a widget
   * @param id Widget type ID
   * @param enabled Whether to enable the widget
   * @returns Whether operation was successful
   */
  setEnabled(id: WidgetTypeId, enabled: boolean): Promise<boolean>;
  
  /**
   * Check if a widget is registered
   * @param id Widget type ID
   * @returns Whether widget is registered
   */
  has(id: WidgetTypeId): Promise<boolean>;
  
  /**
   * Get widget count
   * @returns Total number of registered widgets
   */
  count(): Promise<number>;
}

/**
 * Widget registry factory options
 */
export interface WidgetRegistryOptions {
  /** Whether to enable signature verification */
  verifySignatures?: boolean;
  
  /** Whether to allow duplicate registrations (by ID) */
  allowDuplicates?: boolean;
  
  /** Custom validation function */
  customValidator?: (manifest: WidgetManifest) => Promise<WidgetValidationResult>;
}

/**
 * Widget Registry Factory
 * 
 * Creates registry instances with specified configuration
 */
export interface WidgetRegistryFactory {
  /**
   * Create a new widget registry instance
   * @param options Registry options
   * @returns Widget registry instance
   */
  createRegistry(options?: WidgetRegistryOptions): WidgetRegistry;
}
