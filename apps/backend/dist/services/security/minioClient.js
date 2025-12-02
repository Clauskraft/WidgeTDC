import { Client } from 'minio';
import { getSecurityIntegrationConfig, isMinioConfigured } from '../../config/securityConfig.js';
let cachedMinio = null;
export function getMinioClient() {
    if (!isMinioConfigured()) {
        return null;
    }
    if (cachedMinio) {
        return cachedMinio;
    }
    const { minio } = getSecurityIntegrationConfig();
    cachedMinio = new Client({
        endPoint: minio.endpoint,
        port: minio.port,
        useSSL: minio.useSSL,
        accessKey: minio.accessKey,
        secretKey: minio.secretKey,
    });
    return cachedMinio;
}
export function getMinioBucket() {
    return getSecurityIntegrationConfig().minio.bucket;
}
