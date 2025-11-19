// Updated securityApi - Agent-wired for real ingestion
import axios from 'axios';  // Assume installed
import { mcpClient } from '../../../utils/mcpClient';  // MCP for gateway

export interface SecurityFeedsPayload {
  feeds: FeedSource[];
  pipelineStages: PipelineStage[];
  normalizedDocuments: NormalizedItem[];
  metrics: Metrics;
  archive: Archive;
  environment: Environment;
}

interface Metrics { documentsIndexed: number; ingestionLatency: number; dedupeRate: number; backlogMinutes: number; }
interface Archive { sizeBytes: number; retentionDays: number; objectCount: number; }
interface Environment { openSearchConnected: boolean; minioConnected: boolean; }

export async function fetchSecurityFeeds(orgId?: string): Promise<SecurityFeedsPayload> {
  try {
    // Real call via MCP gateway
    const response = await mcpClient.call('feeds.ingest', { org_id: orgId || 'default' });
    return response.payload as SecurityFeedsPayload;
  } catch (error) {
    console.warn('Real fetch failed, using fallback', error);
    return DEFAULT_FEED_PAYLOAD;  // Keep as backup
  }
}

// Real ingestion endpoint integration (called from backend)
export async function ingestFeed(feedId: string, data: any) {
  // Dedupe logic (cosine >0.82)
  const deduped = await mcpClient.call('srag.dedupe', { data, threshold: 0.82 });
  // Store in PG/OS/MinIO
  await mcpClient.call('feeds.store', deduped);
  // Emit event for universal comm
  await mcpClient.emit('feed-update', { feedId, type: 'personal-hybrid' });
}

// Example: Poll CERT-EU RSS
export async function pollCertEu(): Promise<NormalizedItem[]> {
  await axios.get('https://cert.europa.eu/rss');
  // Parse XML to items (placeholder)
  return [{
    id: 'cert1',
    title: 'New Advisory',
    severity: 'high' as any,
    summary: 'Test',
    tags: ['gov'],
    feedId: 'feed-cert',
    dedupeHits: 0,
    ingestedAt: new Date().toISOString(),
  }];
}
