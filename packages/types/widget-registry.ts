/**
 * Type-safe widget registry with full TypeScript support
 */
export interface WidgetMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  tags: string[];
  capabilities: string[];
  minVersionRequired?: string;
  deprecated?: boolean;
}

export interface WidgetCapability {
  name: string;
  version: string;
  required: boolean;
  description: string;
}

export interface WidgetSearchQuery {
  query?: string;
  tags?: string[];
  capabilities?: string[];
  versions?: string[];
  limit?: number;
  offset?: number;
}

export interface WidgetRegistry {
  widgets: Map<string, WidgetMetadata>;
  search(query: WidgetSearchQuery): WidgetMetadata[];
  register(metadata: WidgetMetadata): void;
  unregister(id: string): boolean;
  getById(id: string): WidgetMetadata | undefined;
}
