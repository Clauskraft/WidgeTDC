import { Client } from '@opensearch-project/opensearch';
import { getSecurityIntegrationConfig, isOpenSearchConfigured } from '../../config/securityConfig.js';
let cachedClient = null;
export function getOpenSearchClient() {
    if (!isOpenSearchConfigured()) {
        return null;
    }
    if (cachedClient) {
        return cachedClient;
    }
    const { openSearch } = getSecurityIntegrationConfig();
    cachedClient = new Client({
        node: openSearch.node,
        auth: openSearch.username && openSearch.password
            ? {
                username: openSearch.username,
                password: openSearch.password,
            }
            : undefined,
        ssl: {
            rejectUnauthorized: false,
        },
    });
    return cachedClient;
}
export function getFeedIndex() {
    return getSecurityIntegrationConfig().openSearch.index;
}
export async function safeCall(promise) {
    try {
        const response = await promise;
        return response.body;
    }
    catch (error) {
        console.warn('⚠️  OpenSearch request failed:', error);
        return null;
    }
}
