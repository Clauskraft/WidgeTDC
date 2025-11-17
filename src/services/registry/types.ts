export interface WidgetMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  dependencies: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetVersion {
  version: string;
  releaseDate: Date;
  changelog: string;
  deprecated: boolean;
}

export interface WidgetCapability {
  name: string;
  category: 'ui' | 'data' | 'integration' | 'analytics';
  required: boolean;
}

export interface RegistryFilter {
  capabilities?: string[];
  version?: string;
  author?: string;
  deprecated?: boolean;
}
