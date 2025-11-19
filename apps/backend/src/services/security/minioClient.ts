import { Client } from 'minio';
import { getSecurityIntegrationConfig, isMinioConfigured } from '../../config/securityConfig.js';

let cachedMinio: Client | null = null;

export function getMinioClient(): Client | null {
  if (!isMinioConfigured()) {
    return null;
  }
  if (cachedMinio) {
    return cachedMinio;
  }

  const { minio } = getSecurityIntegrationConfig();
  cachedMinio = new Client({
    endPoint: minio.endpoint!,
    port: minio.port,
    useSSL: minio.useSSL,
    accessKey: minio.accessKey!,
    secretKey: minio.secretKey!,
  });

  return cachedMinio;
}

export function getMinioBucket(): string {
  return getSecurityIntegrationConfig().minio.bucket;
}

