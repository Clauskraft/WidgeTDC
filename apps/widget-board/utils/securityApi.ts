import axios from 'axios';
import { mcpClient } from '../src/mcpClient';

const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
const API_BASE_URL = (import.meta.env.VITE_WIDGET_API_URL as string | undefined) ?? defaultOrigin;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Security API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type FeedStatus = 'healthy' | 'warning' | 'error';

export interface FeedSource {
  id: string;
  name: string;
  endpoint: string;
  cadence: string;
  lastFetched: string;
  tags: string[];
  threatLevel: ThreatLevel;
  status: FeedStatus;
  documentsPerHour: number;
  duplicatesPerHour: number;
  backlogMinutes: number;
  regions: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  service: string;
  status: FeedStatus;
  latencyMs: number;
}

export interface NormalizedItem {
  id: string;
  feedId: string;
  title: string;
  severity: ThreatLevel;
  summary: string;
  tags: string[];
  dedupeHits: number;
  ingestedAt: string;
}

interface Metrics {
  documentsIndexed: number;
  ingestionLatency: number;
  dedupeRate: number;
  backlogMinutes: number;
}

interface Archive {
  sizeBytes: number;
  retentionDays: number;
  objectCount: number;
}

interface Environment {
  openSearchConnected: boolean;
  minioConnected: boolean;
}

export interface SecurityFeedsPayload {
  feeds: FeedSource[];
  pipelineStages: PipelineStage[];
  normalizedDocuments: NormalizedItem[];
  metrics: Metrics;
  archive: Archive;
  environment: Environment;
}

export interface SecurityTemplatesPayload {
  templates: any[];
}

export interface SecurityHistoryPayload {
  history: any[];
}

const FALLBACK_FEEDS: FeedSource[] = [
  {
    id: 'feed-darkweb',
    name: 'Dark Web Credential Markets',
    endpoint: 'https://cyberstreams.darkfeeds/api/v2',
    cadence: 'Every 2 min',
    lastFetched: '2025-11-18T08:22:00Z',
    tags: ['dark-web', 'credentials', 'leak'],
    threatLevel: 'critical',
    status: 'healthy',
    documentsPerHour: 420,
    duplicatesPerHour: 11,
    backlogMinutes: 2,
    regions: ['EU-West', 'US-East'],
  },
  {
    id: 'feed-cert',
    name: 'CERT-EU Advisories',
    endpoint: 'https://cert.europa.eu/rss',
    cadence: 'Every 15 min',
    lastFetched: '2025-11-18T08:15:00Z',
    tags: ['gov', 'advisory'],
    threatLevel: 'high',
    status: 'healthy',
    documentsPerHour: 96,
    duplicatesPerHour: 2,
    backlogMinutes: 0,
    regions: ['EU-West'],
  },
  {
    id: 'feed-vuln',
    name: 'Vendor Vulnerability Radar',
    endpoint: 'https://vendors.cyberstreams.io/vuln',
    cadence: 'Every 5 min',
    lastFetched: '2025-11-18T08:20:00Z',
    tags: ['patch', 'vendor', 'advisory'],
    threatLevel: 'medium',
    status: 'warning',
    documentsPerHour: 210,
    duplicatesPerHour: 19,
    backlogMinutes: 8,
    regions: ['Global'],
  },
  {
    id: 'feed-ics',
    name: 'ICS / OT Telemetry',
    endpoint: 'wss://ot.cyberstreams.io/stream',
    cadence: 'Streaming',
    lastFetched: '2025-11-18T08:21:00Z',
    tags: ['ics', 'ot', 'anomaly'],
    threatLevel: 'high',
    status: 'healthy',
    documentsPerHour: 310,
    duplicatesPerHour: 4,
    backlogMinutes: 1,
    regions: ['EU-North', 'US-Central'],
  },
  {
    id: 'feed-finsec',
    name: 'Financial Sector OSINT',
    endpoint: 'https://finsec-osint.cyberstreams.io/rss',
    cadence: 'Every 30 min',
    lastFetched: '2025-11-18T07:55:00Z',
    tags: ['finance', 'osint'],
    threatLevel: 'low',
    status: 'healthy',
    documentsPerHour: 62,
    duplicatesPerHour: 1,
    backlogMinutes: 0,
    regions: ['Global'],
  },
];

const FALLBACK_PIPELINE: PipelineStage[] = [
  { id: 'ingest', name: 'Ingest', service: 'RSS Poller', status: 'healthy', latencyMs: 120 },
  { id: 'normalize', name: 'Normalize', service: 'Feed Normalizer', status: 'healthy', latencyMs: 150 },
  { id: 'tag', name: 'Tag', service: 'NLP Tagger', status: 'healthy', latencyMs: 90 },
  { id: 'classify', name: 'Classify', service: 'Threat Classifier', status: 'warning', latencyMs: 210 },
  { id: 'index', name: 'Index', service: 'OpenSearch Writer', status: 'healthy', latencyMs: 80 },
  { id: 'archive', name: 'Archive', service: 'MinIO Bucket', status: 'healthy', latencyMs: 65 },
];

const FALLBACK_DOCUMENTS: NormalizedItem[] = [
  {
    id: 'ti-90311',
    feedId: 'feed-darkweb',
    title: 'APT41 credential bundle targeting Nordic finance leadership',
    severity: 'critical',
    summary: 'Fresh dump with 1.2k employee accounts and MFA reset instructions.',
    tags: ['APT41', 'credential', 'darkweb'],
    dedupeHits: 3,
    ingestedAt: '2025-11-18T08:18:00Z',
  },
  {
    id: 'ti-90302',
    feedId: 'feed-cert',
    title: 'CERT-EU advisory on OpenSSL CVE-2025-1123',
    severity: 'high',
    summary: 'Advisory with mitigation steps and detection artifacts.',
    tags: ['CVE-2025-1123', 'openssl', 'patch'],
    dedupeHits: 0,
    ingestedAt: '2025-11-18T08:11:00Z',
  },
  {
    id: 'ti-90277',
    feedId: 'feed-vuln',
    title: 'Vendor bulletin: Zero-day exploitation of procurement suite',
    severity: 'medium',
    summary: 'Vendor confirms limited exploitation with SQL injection payload.',
    tags: ['procurement', 'zero-day'],
    dedupeHits: 1,
    ingestedAt: '2025-11-18T08:05:00Z',
  },
  {
    id: 'ti-90241',
    feedId: 'feed-ics',
    title: 'ICS anomaly: PLC config drift detected in EU wind farm',
    severity: 'high',
    summary: 'Deviation in firmware hash and unexpected Modbus command burst.',
    tags: ['ICS', 'OT', 'anomaly'],
    dedupeHits: 0,
    ingestedAt: '2025-11-18T08:02:00Z',
  },
];

const FALLBACK_METRICS: Metrics = {
  documentsIndexed: 98231,
  ingestionLatency: 380,
  dedupeRate: 0.89,
  backlogMinutes: 6,
};

const FALLBACK_ARCHIVE: Archive = {
  sizeBytes: 1_900_000_000_000,
  retentionDays: 60,
  objectCount: 18_240,
};

export const DEFAULT_FEED_PAYLOAD: SecurityFeedsPayload = {
  feeds: FALLBACK_FEEDS,
  pipelineStages: FALLBACK_PIPELINE,
  normalizedDocuments: FALLBACK_DOCUMENTS,
  metrics: FALLBACK_METRICS,
  archive: FALLBACK_ARCHIVE,
  environment: {
    openSearchConnected: false,
    minioConnected: false,
  },
};

export async function fetchSecurityFeeds(orgId?: string): Promise<SecurityFeedsPayload> {
  try {
    const response = await mcpClient.call<{ payload?: SecurityFeedsPayload }>('feeds.ingest', {
      org_id: orgId ?? 'default',
    });
    return response?.payload ?? (response as unknown as SecurityFeedsPayload);
  } catch (error) {
    console.warn('MCP feeds ingest failed, using fallback payload', error);
    return DEFAULT_FEED_PAYLOAD;
  }
}

export async function ingestFeed(feedId: string, data: unknown): Promise<void> {
  const deduped = await mcpClient.call('srag.dedupe', { data, threshold: 0.82 });
  await mcpClient.call('feeds.store', deduped);
  await mcpClient.emit('feed-update', { feedId, type: 'personal-hybrid' });
}

export async function pollCertEu(): Promise<NormalizedItem[]> {
  try {
    const response = await axios.get('https://cert.europa.eu/rss');
    const xml = response.data as string;
    const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch?.[1] ?? 'CERT-EU Advisory';
    return [
      {
        id: 'cert-eu-1',
        feedId: 'feed-cert',
        title,
        severity: 'high',
        summary: 'CERT-EU advisory feed entry.',
        tags: ['cert-eu', 'advisory'],
        dedupeHits: 0,
        ingestedAt: new Date().toISOString(),
      },
    ];
  } catch (error) {
    console.warn('CERT-EU poll failed, returning fallback item', error);
    return DEFAULT_FEED_PAYLOAD.normalizedDocuments.filter(item => item.feedId === 'feed-cert').slice(0, 1);
  }
}

export async function fetchSecurityTemplates(): Promise<SecurityTemplatesPayload> {
  return request<SecurityTemplatesPayload>('/api/security/search/templates');
}

export async function fetchSecuritySearchHistory(limit = 6): Promise<SecurityHistoryPayload> {
  return request<SecurityHistoryPayload>(`/api/security/search/history?limit=${limit}`);
}

export async function runSecuritySearch(body: {
  query: string;
  severity: string;
  timeframe: string;
  sources: string[];
}): Promise<any> {
  return request('/api/security/search/query', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchSecurityActivity(params: { severity?: string; category?: string; limit?: number } = {}): Promise<any> {
  const url = new URL('/api/security/activity', API_BASE_URL);
  if (params.severity) url.searchParams.set('severity', params.severity);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch activity events');
  return response.json();
}

export async function acknowledgeActivityEvent(id: string, acknowledged: boolean): Promise<any> {
  return request(`/api/security/activity/${id}/ack`, {
    method: 'POST',
    body: JSON.stringify({ acknowledged }),
  });
}

export function getActivityStreamUrl(severity?: string, category?: string): string {
  const url = new URL('/api/security/activity/stream', API_BASE_URL);
  if (severity) url.searchParams.set('severity', severity);
  if (category) url.searchParams.set('category', category);
  return url.toString();
}

export { API_BASE_URL };

