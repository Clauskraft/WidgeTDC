import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useMCP } from '../src/hooks/useMCP';

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

interface SecurityFeedsPayload {
    feeds: FeedSource[];
    pipelineStages: PipelineStage[];
    normalizedDocuments: NormalizedItem[];
    metrics: {
        documentsIndexed: number;
        ingestionLatency: number;
        dedupeRate: number;
        backlogMinutes: number;
    };
    archive: {
        sizeBytes: number;
        retentionDays: number;
        objectCount: number;
    };
    environment: {
        openSearchConnected: boolean;
        minioConnected: boolean;
    };
}

const DEFAULT_FEED_PAYLOAD: SecurityFeedsPayload = {
  feeds: [],
  pipelineStages: [
    { id: 'ingest', name: 'Ingest', service: 'RSS Poller', status: 'healthy', latencyMs: 0 },
    { id: 'index', name: 'Index', service: 'Vector Store', status: 'healthy', latencyMs: 0 }
  ],
  normalizedDocuments: [],
  metrics: {
    documentsIndexed: 0,
    ingestionLatency: 0,
    dedupeRate: 0,
    backlogMinutes: 0,
  },
  archive: {
    sizeBytes: 0,
    retentionDays: 30,
    objectCount: 0,
  },
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
  healthy: 'Operational',
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
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)} TB`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} GB`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  return `${value.toLocaleString()} B`;
};

const FeedIngestionWidget: React.FC<{ widgetId: string }> = () => {
  const { send } = useMCP();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<ThreatLevel | 'all'>('all');
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [autoPolling, setAutoPolling] = useState(true);
  const [feedPayload, setFeedPayload] = useState<SecurityFeedsPayload>(DEFAULT_FEED_PAYLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshFeeds = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await send('agent-orchestrator', 'ingestion.status', {});
      
      if (response && response.success) {
          // Map real stats
          setFeedPayload(prev => ({
              ...prev,
              metrics: {
                  ...prev.metrics,
                  documentsIndexed: response.totalDocuments || 0
              },
              environment: {
                  openSearchConnected: true, // Neo4j vector store is active
                  minioConnected: false
              }
          }));
          setErrorMessage(null);
      } else {
          throw new Error('Backend error');
      }
    } catch (error) {
      console.warn('Feed ingestion refresh failed', error);
      setErrorMessage('Backend connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [send]);

  useEffect(() => {
    refreshFeeds();
  }, [refreshFeeds]);

  useEffect(() => {
    if (!autoPolling) return;
    const intervalId = setInterval(refreshFeeds, 10000); // 10s polling
    return () => clearInterval(intervalId);
  }, [autoPolling, refreshFeeds]);

  const feeds = feedPayload.feeds || [];
  const normalizedDocuments = feedPayload.normalizedDocuments || [];
  const metrics = feedPayload.metrics;
  const pipelineStages = feedPayload.pipelineStages;

  const filteredFeeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return feeds.filter(feed => {
      const matchesTerm = term.length === 0 || feed.name.toLowerCase().includes(term);
      const matchesLevel = levelFilter === 'all' ? true : feed.threatLevel === levelFilter;
      return matchesTerm && matchesLevel;
    });
  }, [searchTerm, levelFilter, feeds]);

  const selectedFeed = feeds.find(feed => feed.id === selectedFeedId) || feeds[0];
  const selectedFeedItems = normalizedDocuments.filter(item => item.feedId === selectedFeed?.id).slice(0, 3);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="feed-ingestion-widget">
      <header className="p-4 bg-slate-950/80 text-white border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">DATA PIPELINE</p>
            <h3 className="text-2xl font-semibold">Feed Ingestion</h3>
            <p className="text-sm text-white/80">
              Real-time ingestion status from backend scrapers & agents.
            </p>
          </div>
          <div className="text-right">
            <div className="flex flex-col text-xs mt-2 gap-1">
              {isLoading && <span className="text-white/70">Syncing...</span>}
              {errorMessage && <span className="text-rose-300">{errorMessage}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-xs mt-3">
          <span className={`px-2 py-1 rounded-full ${feedPayload.environment.openSearchConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100'}`}>
            Vector Store {feedPayload.environment.openSearchConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        <section className="col-span-12 lg:col-span-5 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-sm">Active Feeds</h4>
            </div>
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-4">
                {feeds.length === 0 ? 'No active feeds reporting status.' : 'Feeds list here...'}
            </div>
        </section>

        <section className="col-span-12 lg:col-span-7 h-full flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Documents"
              helper="Indexed in Vector DB"
              value={metrics.documentsIndexed.toLocaleString()}
            />
            <MetricCard label="Latency" helper="Avg" value={`${metrics.ingestionLatency} ms`} />
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col flex-1">
              <h4 className="font-semibold text-sm mb-3">Pipeline Status</h4>
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
                  </div>
                ))}
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
