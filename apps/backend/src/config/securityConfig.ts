import { z } from 'zod';

const openSearchSchema = z.object({
  node: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  index: z.string().default('ti-feeds'),
});

const minioSchema = z.object({
  endpoint: z.string().optional(),
  port: z.coerce.number().default(9000),
  useSSL: z.coerce.boolean().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  bucket: z.string().default('security-feeds'),
});

const registrySchema = z.object({
  retentionDays: z.coerce.number().default(14),
  streamHeartbeatMs: z.coerce.number().default(10_000),
});

export type OpenSearchConfig = z.infer<typeof openSearchSchema>;
export type MinioConfig = z.infer<typeof minioSchema>;
export type RegistryStreamConfig = z.infer<typeof registrySchema>;

export interface SecurityIntegrationConfig {
  openSearch: OpenSearchConfig;
  minio: MinioConfig;
  registry: RegistryStreamConfig;
}

let cachedConfig: SecurityIntegrationConfig | null = null;

export function getSecurityIntegrationConfig(): SecurityIntegrationConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const openSearch = openSearchSchema.parse({
    node: process.env.OPENSEARCH_NODE,
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
    index: process.env.OPENSEARCH_FEED_INDEX ?? 'ti-feeds',
  });

  const minio = minioSchema.parse({
    endpoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ?? 9000,
    useSSL: process.env.MINIO_USE_SSL ?? false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET ?? 'security-feeds',
  });

  const registry = registrySchema.parse({
    retentionDays: process.env.SECURITY_ACTIVITY_RETENTION_DAYS ?? 14,
    streamHeartbeatMs: process.env.SECURITY_ACTIVITY_HEARTBEAT_MS ?? 10_000,
  });

  cachedConfig = { openSearch, minio, registry };
  return cachedConfig;
}

export function isOpenSearchConfigured(): boolean {
  const { node } = getSecurityIntegrationConfig().openSearch;
  return Boolean(node);
}

export function isMinioConfigured(): boolean {
  const { endpoint, accessKey, secretKey } = getSecurityIntegrationConfig().minio;
  return Boolean(endpoint && accessKey && secretKey);
}

