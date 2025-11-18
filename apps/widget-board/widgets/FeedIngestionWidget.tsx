import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import type { SecurityFeedsPayload } from '../utils/securityApi';
import { fetchSecurityFeeds } from '../utils/securityApi';
import { usePermissions } from '../contexts/PermissionContext';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
type FeedStatus = 'healthy' | 'warning' | 'error';

interface FeedSource {
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

interface PipelineStage {
  id: string;
  name: string;
  service: string;
  status: FeedStatus;
  latencyMs: number;
}

interface NormalizedItem {
  id: string;
  feedId: string;
  title: string;
  severity: ThreatLevel;
  summary: string;
  tags: string[];
  dedupeHits: number;
  ingestedAt: string;
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

const FALLBACK_METRICS = {
  documentsIndexed: 98231,
  ingestionLatency: 380,
  dedupeRate: 0.89,
  backlogMinutes: 6,
};

const FALLBACK_ARCHIVE = {
  sizeBytes: 1_900_000_000_000,
  retentionDays: 60,
  objectCount: 18_240,
};

const DEFAULT_FEED_PAYLOAD: SecurityFeedsPayload = {
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

const severityStyles: Record<ThreatLevel, string> = {
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIndicators: Record<FeedStatus, string> = {
  healthy: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
};

const statusLabels: Record<FeedStatus, string> = {
  healthy: 'Fully Operational',
  warning: 'Degraded',
  error: 'Offline',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
};

const formatBytes = (value?: number) => {
  if (!value) return '—';
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)} TB`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} GB`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} MB`;
  }
  return `${value.toLocaleString()} B`;
};

const FeedIngestionWidget: React.FC<{ widgetId: string }> = () => {
  const { loading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<ThreatLevel | 'all'>('all');
  const [selectedFeedId, setSelectedFeedId] = useState(FALLBACK_FEEDS[0].id);
  const [autoPolling, setAutoPolling] = useState(true);
  const [feedPayload, setFeedPayload] = useState<SecurityFeedsPayload>(DEFAULT_FEED_PAYLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const feeds = feedPayload.feeds ?? FALLBACK_FEEDS;
  const normalizedDocuments = feedPayload.normalizedDocuments ?? FALLBACK_DOCUMENTS;
  const metrics = feedPayload.metrics ?? FALLBACK_METRICS;
  const archive = feedPayload.archive ?? FALLBACK_ARCHIVE;
  const pipelineStages = feedPayload.pipelineStages ?? FALLBACK_PIPELINE;

  const refreshFeeds = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchSecurityFeeds();
      setFeedPayload({
        feeds: response.feeds?.length ? response.feeds : DEFAULT_FEED_PAYLOAD.feeds,
        pipelineStages: response.pipelineStages?.length
          ? response.pipelineStages
          : DEFAULT_FEED_PAYLOAD.pipelineStages,
        normalizedDocuments: response.normalizedDocuments?.length
          ? response.normalizedDocuments
          : DEFAULT_FEED_PAYLOAD.normalizedDocuments,
        metrics: response.metrics ?? DEFAULT_FEED_PAYLOAD.metrics,
        archive: response.archive ?? DEFAULT_FEED_PAYLOAD.archive,
        environment: response.environment ?? DEFAULT_FEED_PAYLOAD.environment,
      });
      setErrorMessage(null);
    } catch (error) {
      console.warn('Feed ingestion refresh failed', error);
      setErrorMessage('Live feeds temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    refreshFeeds();
  }, [refreshFeeds, loading]);

  useEffect(() => {
    if (!autoPolling) {
      return;
    }
    const intervalId = setInterval(() => {
      refreshFeeds();
    }, 120_000);
    return () => clearInterval(intervalId);
  }, [autoPolling, refreshFeeds]);

  const filteredFeeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return feeds.filter(feed => {
      const matchesTerm =
        term.length === 0 ||
        feed.name.toLowerCase().includes(term) ||
        feed.tags.some(tag => tag.includes(term));
      const matchesLevel = levelFilter === 'all' ? true : feed.threatLevel === levelFilter;
      return matchesTerm && matchesLevel;
    });
  }, [searchTerm, levelFilter]);

  useEffect(() => {
    if (filteredFeeds.length === 0) {
      return;
    }
    if (!filteredFeeds.some(feed => feed.id === selectedFeedId)) {
      setSelectedFeedId(filteredFeeds[0].id);
    }
  }, [filteredFeeds, selectedFeedId]);

  const selectedFeed =
    filteredFeeds.find(feed => feed.id === selectedFeedId) ??
    feeds.find(feed => feed.id === selectedFeedId) ??
    feeds[0];

  const selectedFeedItems = normalizedDocuments.filter(item => item.feedId === selectedFeed?.id).slice(0, 3);

  if (loading) return <div>Loading permissions...</div>;

  return (
    <div className="h-full flex flex-col -m-4" data-testid="feed-ingestion-widget">
      <header className="p-4 bg-slate-950/80 text-white border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cyberstreams Track 2.B</p>
            <h3 className="text-2xl font-semibold">Feed Ingestion · Threat Intelligence</h3>
            <p className="text-sm text-white/80">
              Multi-source RSS + streaming ingestion with normalization, deduplication and OpenSearch indexing.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Background polling</p>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoPolling}
                onChange={() => setAutoPolling(v => !v)}
                aria-label="Toggle background polling"
                className="ms-focusable"
              />
              Auto refresh every 2 min
            </label>
            <div className="flex flex-col text-xs mt-2 gap-1">
              {isLoading && <span className="text-white/70">Syncing live metrics…</span>}
              {errorMessage && <span className="text-rose-300">{errorMessage}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-xs mt-3">
          <span
            className={`px-2 py-1 rounded-full ${
              feedPayload.environment.openSearchConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100'
            }`}
          >
            OpenSearch {feedPayload.environment.openSearchConnected ? 'online' : 'offline'}
          </span>
          <span
            className={`px-2 py-1 rounded-full ${
              feedPayload.environment.minioConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100'
            }`}
          >
            MinIO {feedPayload.environment.minioConnected ? 'online' : 'offline'}
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        <section className="col-span-12 lg:col-span-5 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search feed name, tag or region"
                  aria-label="Search feeds"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 px-3 py-2 text-sm"
                />
                <select
                  value={levelFilter}
                  onChange={event => setLevelFilter(event.target.value as ThreatLevel | 'all')}
                  aria-label="Threat level filter"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 px-3 py-2 text-sm"
                >
                  <option value="all">All severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <p className="text-xs text-slate-500">
                {filteredFeeds.length} feeds · {feeds.reduce((sum, feed) => sum + (feed.documentsPerHour ?? 0), 0)} docs/hr capacity
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-800" role="tablist">
            {filteredFeeds.map(feed => (
              <button
                type="button"
                key={feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                role="tab"
                aria-selected={feed.id === selectedFeedId ? 'true' : 'false'}
                className={`w-full text-left px-4 py-3 transition-colors focus-visible:outline-blue-500 ${
                  feed.id === selectedFeedId ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                }`}
                data-testid="feed-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm" data-testid="feed-card-name">
                      {feed.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Last sync {formatDate(feed.lastFetched)}
                      {feed.cadence ? ` · ${feed.cadence}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${severityStyles[feed.threatLevel]}`}
                  >
                    {feed.threatLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className={statusIndicators[feed.status]}>{statusLabels[feed.status]}</span>
                  <span>{feed.documentsPerHour ?? '—'} docs/hr</span>
                  <span>{feed.duplicatesPerHour ?? '—'} duplicates/hr</span>
                  <span>{feed.backlogMinutes ?? '—'} min backlog</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(feed.tags ?? []).map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {filteredFeeds.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">No feeds match the current filters.</div>
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-7 h-full flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Documents indexed"
              helper="OpenSearch /ti-feeds"
              value={metrics.documentsIndexed.toLocaleString()}
            />
            <MetricCard label="Ingestion latency" helper="P95" value={`${metrics.ingestionLatency} ms`} />
            <MetricCard label="Deduplication efficiency" helper="Sliding 1h window" value={`${Math.round(metrics.dedupeRate * 100)}%`} />
            <MetricCard label="Backlog" helper="Queue depth" value={`${metrics.backlogMinutes} min`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-auto">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-sm">Pipeline health</h4>
                  <p className="text-xs text-slate-500">Ingestion → normalization → indexing → MinIO archive</p>
                </div>
                <Button
                  variant="subtle"
                  size="small"
                  onClick={() => {
                    setAutoPolling(true);
                    refreshFeeds();
                  }}
                >
                  Resume polling
                </Button>
              </div>
              <div className="space-y-3">
                {pipelineStages.map(stage => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stage.name}</p>
                      <p className="text-xs text-slate-500">{stage.service}</p>
                    </div>
                    <span className={`text-xs font-semibold ${statusIndicators[stage.status]}`}>
                      {statusLabels[stage.status]}
                    </span>
                    <span className="text-xs text-slate-500">{stage.latencyMs} ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-sm">{selectedFeed?.name}</h4>
                  <p className="text-xs text-slate-500">{selectedFeed?.endpoint}</p>
                </div>
                <Button variant="primary" size="small">
                  Force poll now
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Documents/hr</dt>
                  <dd className="font-semibold">
                    {selectedFeed?.documentsPerHour
                      ? selectedFeed.documentsPerHour.toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Duplicate ratio</dt>
                  <dd className="font-semibold">
                    {selectedFeed && selectedFeed.documentsPerHour
                      ? Math.round(
                          ((selectedFeed.duplicatesPerHour ?? 0) /
                            Math.max(1, selectedFeed.documentsPerHour)) *
                            100,
                        )
                      : 0}
                    %
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Regions</dt>
                  <dd>{selectedFeed ? selectedFeed.regions.join(', ') : '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Backlog minutes</dt>
                  <dd>{selectedFeed?.backlogMinutes ?? '—'}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Connected services</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">OpenSearch</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">MinIO Archive</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Duplicate Detector</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Tagger</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 overflow-hidden">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm">Latest normalized items</h4>
                  <p className="text-xs text-slate-500">Stored in OpenSearch & archived to MinIO</p>
                </div>
                <Button variant="subtle" size="small">
                  Export CSV
                </Button>
              </div>
              <div className="space-y-3 flex-1 overflow-auto" aria-live="polite">
                {selectedFeedItems.map(item => (
                  <article key={item.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl" data-testid="normalized-item">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{item.id}</span>
                      <span>{formatDate(item.ingestedAt)}</span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border ${severityStyles[item.severity]}`}>
                        {item.severity.toUpperCase()}
                      </span>
                      <span className="text-slate-500">{item.dedupeHits ?? 0} dedupe hits</span>
                      {(item.tags ?? []).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
                {selectedFeedItems.length === 0 && (
                  <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-4">
                    No normalized items yet for this feed.
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col gap-4">
              <div>
                <h4 className="font-semibold text-sm">Archive & compliance</h4>
                <p className="text-xs text-slate-500">MinIO bucket retention and audit readiness</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Archive size</p>
                    <p className="font-semibold">{formatBytes(archive.sizeBytes)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Retention</p>
                    <p className="font-semibold">{archive.retentionDays} days</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Objects</p>
                    <p className="font-semibold">{archive.objectCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/40">
                <p className="text-xs uppercase text-slate-500 mb-2">Duplicate detection</p>
                <p className="text-sm">
                  Cosine similarity threshold: <strong>0.82</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Last duplicate cluster: {selectedFeed?.duplicatesPerHour ?? 0} items automatically merged.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" size="small">
                    Re-run dedupe
                  </Button>
                  <Button variant="subtle" size="small">
                    Adjust threshold
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 mb-2">Audit log</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>08:18 · Feed poll completed · {selectedFeed?.name}</li>
                  <li>08:17 · MinIO archive flush · 42 objects</li>
                  <li>08:16 · Dedupe engine updated similarity model</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; helper?: string }> = ({ label, value, helper }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
    {helper && <p className="text-xs text-slate-400">{helper}</p>}
  </div>
);

export default FeedIngestionWidget;
