import { Client } from '@opensearch-project/opensearch';
import type { ApiResponse } from '@opensearch-project/opensearch/lib/Transport.js';
import { getSecurityIntegrationConfig, isOpenSearchConfigured } from '../../config/securityConfig.js';

let cachedClient: Client | null = null;

export function getOpenSearchClient(): Client | null {
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

export function getFeedIndex(): string {
  return getSecurityIntegrationConfig().openSearch.index;
}

export async function safeCall<T>(promise: Promise<ApiResponse<T>>): Promise<T | null> {
  try {
    const response = await promise;
    return response.body;
  } catch (error) {
    console.warn('⚠️  OpenSearch request failed:', error);
    return null;
  }
}

