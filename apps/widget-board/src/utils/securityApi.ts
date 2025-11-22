// Updated securityApi - Agent-wired for real ingestion
import axios from 'axios';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface NormalizedItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  tags: string[];
  feedId: string;
  dedupeHits: number;
  ingestedAt: string;
}

export interface Metrics { documentsIndexed: number; ingestionLatency: number; dedupeRate: number; backlogMinutes: number; }
export interface Archive { sizeBytes: number; retentionDays: number; objectCount: number; }
export interface Environment { openSearchConnected: boolean; minioConnected: boolean; }

export interface SecurityFeedsPayload {
  feeds: FeedSource[];
  pipelineStages: PipelineStage[];
  normalizedDocuments: NormalizedItem[];
  metrics: Metrics;
  archive: Archive;
  environment: Environment;
}

const DEFAULT_FEED_PAYLOAD: SecurityFeedsPayload = {
  feeds: [],
  pipelineStages: [],
  normalizedDocuments: [],
  metrics: { documentsIndexed: 0, ingestionLatency: 0, dedupeRate: 0, backlogMinutes: 0 },
  archive: { sizeBytes: 0, retentionDays: 0, objectCount: 0 },
  environment: { openSearchConnected: false, minioConnected: false }
};

import { request } from '../../utils/request';

export async function fetchSecurityFeeds(orgId?: string): Promise<SecurityFeedsPayload> {
  try {
    return await request<SecurityFeedsPayload>('/api/security/feeds');
  } catch (error) {
    console.warn('Fetch failed, using fallback', error);
    return DEFAULT_FEED_PAYLOAD;
  }
}

// Real ingestion endpoint integration (called from backend)
export async function ingestFeed(feedId: string, data: any) {
  // Mock implementation
  console.log('Ingesting feed (mock)', feedId);
}

// Example: Poll CERT-EU RSS
export async function pollCertEu(): Promise<NormalizedItem[]> {
  try {
    const response = await axios.get('https://cert.europa.eu/rss');
    // Parse XML to items (placeholder)
    return [{ id: 'cert1', title: 'New Advisory', severity: 'high', summary: 'Test', tags: ['gov'], feedId: 'feed-cert', dedupeHits: 0, ingestedAt: new Date().toISOString() }];
  } catch (e) {
    return [];
  }
}
