export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type FeedStatus = 'healthy' | 'warning' | 'error';
export type EventCategory = 'ingestion' | 'alert' | 'automation' | 'audit';

export interface SecurityFeed {
  id: string;
  name: string;
  endpoint?: string;
  cadence?: string;
  lastFetched?: string;
  tags: string[];
  threatLevel: ThreatLevel;
  status: FeedStatus;
  documentsPerHour?: number;
  duplicatesPerHour?: number;
  backlogMinutes?: number;
  regions?: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  service: string;
  status: FeedStatus;
  latencyMs?: number;
}

export interface NormalizedDocument {
  id: string;
  feedId: string;
  title: string;
  severity: ThreatLevel;
  summary: string;
  tags: string[];
  dedupeHits?: number;
  ingestedAt: string;
}

export interface FeedMetrics {
  documentsIndexed: number;
  ingestionLatency: number;
  dedupeRate: number;
  backlogMinutes: number;
}

export interface ArchiveSummary {
  sizeBytes: number;
  retentionDays: number;
  objectCount: number;
}

export interface FeedOverviewResponse {
  feeds: SecurityFeed[];
  pipelineStages: PipelineStage[];
  normalizedDocuments: NormalizedDocument[];
  metrics: FeedMetrics;
  archive: ArchiveSummary;
  environment: {
    openSearchConnected: boolean;
    minioConnected: boolean;
  };
}

export interface SecuritySearchTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: ThreatLevel | 'all';
  timeframe: string;
  sources: string[];
  createdAt: string;
}

export interface SecuritySearchResult {
  id: string;
  title: string;
  summary: string;
  source: string;
  severity: ThreatLevel;
  timestamp: string;
  tags: string[];
  score: number;
}

export interface SearchMetrics {
  latencyMs: number;
  totalDocs: number;
  coverage: number;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  severity: string;
  timeframe: string;
  sources: string[];
  results: number;
  latencyMs: number;
  ranAt: string;
}

export interface SearchResponsePayload {
  results: SecuritySearchResult[];
  metrics: SearchMetrics;
  auditEntry: SearchHistoryEntry;
}

export interface SecurityActivityEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: ThreatLevel;
  source: string;
  rule?: string;
  channel: 'SSE' | 'Webhook' | 'Job';
  payload?: Record<string, unknown>;
  createdAt: string;
  acknowledged: boolean;
}

