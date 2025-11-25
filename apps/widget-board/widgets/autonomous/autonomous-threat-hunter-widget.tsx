/**
 * Autonomous Cybersecurity Threat Hunter Widget
 * Multi-threaded threat investigation with auto-response capabilities
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ThreatCategory = 'malware' | 'phishing' | 'intrusion' | 'data_exfil' | 'apt' | 'ransomware' | 'ddos';
type HuntStatus = 'idle' | 'hunting' | 'analyzing' | 'correlating' | 'completed';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ResponseAction = 'isolate' | 'block' | 'alert' | 'quarantine' | 'investigate';

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'cve' | 'email' | 'url';
  value: string;
  category: ThreatCategory;
  severity: Severity;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  hits: number;
  context: string;
  relatedIndicators: string[];
  responseActions: ResponseAction[];
  autoResponseEnabled: boolean;
}

interface HuntThread {
  id: string;
  name: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  indicatorsFound: number;
  startTime: number;
  endTime?: number;
}

interface ThreatIntelFeed {
  id: string;
  name: string;
  type: 'commercial' | 'opensource' | 'internal' | 'government';
  lastUpdate: number;
  indicatorCount: number;
  status: 'active' | 'stale' | 'error';
}

interface CorrelationResult {
  indicatorId: string;
  matchedFeeds: string[];
  relatedCampaigns: string[];
  ttps: string[];
  riskScore: number;
}

// ============================================================================
// THREAT HUNTING ENGINE
// ============================================================================

class ThreatHuntingEngine {
  private threads: Map<string, HuntThread> = new Map();
  private indicators: ThreatIndicator[] = [];
  private correlations: CorrelationResult[] = [];
  private onUpdate: (
    threads: HuntThread[], 
    indicators: ThreatIndicator[], 
    correlations: CorrelationResult[]
  ) => void;
  private isRunning = false;

  constructor(onUpdate: (
    threads: HuntThread[], 
    indicators: ThreatIndicator[], 
    correlations: CorrelationResult[]
  ) => void) {
    this.onUpdate = onUpdate;
  }

  async startHunt(target: string, category: ThreatCategory | 'all'): Promise<void> {
    this.isRunning = true;
    this.threads.clear();
    this.indicators = [];
    this.correlations = [];

    const threads = this.initializeHuntThreads(target, category);
    threads.forEach(t => this.threads.set(t.id, t));
    this.notifyUpdate();

    await this.executeHuntThreads();
    await this.correlateIndicators();
    await this.executeAutoResponses();

    this.isRunning = false;
  }

  private initializeHuntThreads(target: string, category: ThreatCategory | 'all'): HuntThread[] {
    return [
      {
        id: 'ioc-scan',
        name: 'IOC Database Scan',
        source: 'Internal IOC DB + VirusTotal',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'mitre-mapping',
        name: 'MITRE ATT&CK Mapping',
        source: 'MITRE Framework',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'threat-feeds',
        name: 'Threat Intel Feeds',
        source: 'AlienVault, AbuseIPDB, Shodan',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'yara-scan',
        name: 'YARA Rule Matching',
        source: 'YARA Rule Engine',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'sigma-detection',
        name: 'SIGMA Detection Rules',
        source: 'SIGMA Rule Engine',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'network-analysis',
        name: 'Network Traffic Analysis',
        source: 'NetFlow + PCAP',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'endpoint-forensics',
        name: 'Endpoint Forensics',
        source: 'EDR + Sysmon',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      },
      {
        id: 'dark-web',
        name: 'Dark Web Intelligence',
        source: 'Dark Web Crawler',
        status: 'pending',
        progress: 0,
        indicatorsFound: 0,
        startTime: Date.now()
      }
    ];
  }

  private async executeHuntThreads(): Promise<void> {
    const maxConcurrent = 4;
    const executing: Promise<void>[] = [];
    const pending = Array.from(this.threads.values()).filter(t => t.status === 'pending');

    for (const thread of pending) {
      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
      }

      const promise = this.executeThread(thread).finally(() => {
        const index = executing.indexOf(promise);
        if (index > -1) executing.splice(index, 1);
      });
      executing.push(promise);
    }

    await Promise.all(executing);
  }

  private async executeThread(thread: HuntThread): Promise<void> {
    thread.status = 'running';
    thread.progress = 0;
    this.notifyUpdate();

    try {
      // Simulate progressive hunting
      for (let i = 0; i <= 100; i += 15) {
        thread.progress = Math.min(i, 100);
        this.notifyUpdate();
        await this.delay(150 + Math.random() * 200);

        // Add indicators progressively
        if (i % 30 === 0 && Math.random() > 0.3) {
          const newIndicators = this.generateIndicators(thread);
          this.indicators.push(...newIndicators);
          thread.indicatorsFound = newIndicators.length;
        }
      }

      thread.status = 'completed';
      thread.progress = 100;
      thread.endTime = Date.now();
    } catch (error) {
      thread.status = 'failed';
      thread.progress = 100;
    }

    this.notifyUpdate();
  }

  private generateIndicators(thread: HuntThread): ThreatIndicator[] {
    const categories: ThreatCategory[] = ['malware', 'phishing', 'intrusion', 'apt'];
    const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const types: ThreatIndicator['type'][] = ['ip', 'domain', 'hash', 'cve', 'url'];

    const count = Math.floor(Math.random() * 3) + 1;
    const indicators: ThreatIndicator[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      indicators.push({
        id: `${thread.id}-ioc-${Date.now()}-${i}`,
        type,
        value: this.generateIOCValue(type),
        category: categories[Math.floor(Math.random() * categories.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        confidence: 50 + Math.floor(Math.random() * 50),
        firstSeen: Date.now() - Math.floor(Math.random() * 86400000 * 30),
        lastSeen: Date.now(),
        hits: Math.floor(Math.random() * 100),
        context: `Detected by ${thread.source}`,
        relatedIndicators: [],
        responseActions: this.suggestResponseActions(),
        autoResponseEnabled: false
      });
    }

    return indicators;
  }

  private generateIOCValue(type: ThreatIndicator['type']): string {
    switch (type) {
      case 'ip':
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      case 'domain':
        return `malicious-${Math.random().toString(36).substring(7)}.com`;
      case 'hash':
        return Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      case 'cve':
        return `CVE-2024-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
      case 'url':
        return `https://malicious.com/${Math.random().toString(36).substring(7)}`;
      default:
        return 'unknown';
    }
  }

  private suggestResponseActions(): ResponseAction[] {
    const actions: ResponseAction[] = ['isolate', 'block', 'alert', 'quarantine', 'investigate'];
    const count = Math.floor(Math.random() * 3) + 1;
    return actions.slice(0, count);
  }

  private async correlateIndicators(): Promise<void> {
    const campaigns = ['APT29', 'Lazarus Group', 'FIN7', 'Cozy Bear'];
    const ttps = ['T1566', 'T1059', 'T1053', 'T1021', 'T1105'];

    for (const indicator of this.indicators) {
      this.correlations.push({
        indicatorId: indicator.id,
        matchedFeeds: ['VirusTotal', 'AbuseIPDB'].slice(0, Math.floor(Math.random() * 2) + 1),
        relatedCampaigns: Math.random() > 0.5 
          ? [campaigns[Math.floor(Math.random() * campaigns.length)]]
          : [],
        ttps: ttps.slice(0, Math.floor(Math.random() * 3) + 1),
        riskScore: Math.floor(indicator.confidence * (indicator.severity === 'critical' ? 1.5 : 1))
      });
    }

    this.notifyUpdate();
  }

  private async executeAutoResponses(): Promise<void> {
    const criticalIndicators = this.indicators.filter(
      i => i.severity === 'critical' && i.autoResponseEnabled
    );

    for (const indicator of criticalIndicators) {
      console.log(`Auto-response triggered for ${indicator.value}`);
      // In production, this would trigger actual response actions
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyUpdate(): void {
    this.onUpdate(
      Array.from(this.threads.values()),
      this.indicators,
      this.correlations
    );
  }

  stop(): void {
    this.isRunning = false;
  }

  enableAutoResponse(indicatorId: string): void {
    const indicator = this.indicators.find(i => i.id === indicatorId);
    if (indicator) {
      indicator.autoResponseEnabled = true;
      this.notifyUpdate();
    }
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const severityStyles: Record<Severity, string> = {
  critical: 'bg-rose-100 text-rose-700 border-rose-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  low: 'bg-blue-100 text-blue-700 border-blue-300',
  info: 'bg-slate-100 text-slate-600 border-slate-300'
};

const categoryIcons: Record<ThreatCategory, string> = {
  malware: '🦠',
  phishing: '🎣',
  intrusion: '🔓',
  data_exfil: '📤',
  apt: '🎯',
  ransomware: '💰',
  ddos: '⚡'
};

const AutonomousThreatHunterWidget: React.FC<{ widgetId: string }> = () => {
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<ThreatCategory | 'all'>('all');
  const [huntStatus, setHuntStatus] = useState<HuntStatus>('idle');
  const [threads, setThreads] = useState<HuntThread[]>([]);
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [autoResponseMode, setAutoResponseMode] = useState(false);

  const engineRef = useRef<ThreatHuntingEngine | null>(null);

  useEffect(() => {
    engineRef.current = new ThreatHuntingEngine((t, i, c) => {
      setThreads([...t]);
      setIndicators([...i]);
      setCorrelations([...c]);
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startHunt = useCallback(async () => {
    if (!target || !engineRef.current) return;

    setHuntStatus('hunting');
    try {
      await engineRef.current.startHunt(target, category);
      setHuntStatus('completed');
    } catch (error) {
      console.error('Hunt failed:', error);
      setHuntStatus('idle');
    }
  }, [target, category]);

  const stopHunt = useCallback(() => {
    engineRef.current?.stop();
    setHuntStatus('idle');
  }, []);

  const filteredIndicators = useMemo(() => {
    return indicators.filter(i => 
      selectedSeverity === 'all' || i.severity === selectedSeverity
    ).sort((a, b) => {
      const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [indicators, selectedSeverity]);

  const stats = useMemo(() => ({
    total: indicators.length,
    critical: indicators.filter(i => i.severity === 'critical').length,
    high: indicators.filter(i => i.severity === 'high').length,
    medium: indicators.filter(i => i.severity === 'medium').length,
    threadsComplete: threads.filter(t => t.status === 'completed').length,
    threadsTotal: threads.length,
    avgConfidence: indicators.length > 0
      ? Math.round(indicators.reduce((s, i) => s + i.confidence, 0) / indicators.length)
      : 0
  }), [indicators, threads]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="autonomous-threat-hunter-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-900 text-white border-b border-rose-700/50">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-rose-300/80">Autonomous Hunting</p>
            <h3 className="text-2xl font-semibold">Threat Hunter</h3>
            <p className="text-sm text-white/70">
              Multi-threaded threat detection med auto-respons
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoResponseMode}
                onChange={() => setAutoResponseMode(!autoResponseMode)}
                className="rounded"
              />
              Auto-Response Mode
            </label>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex gap-3 mt-4">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter IP, domain, hash, or CVE..."
            disabled={huntStatus === 'hunting'}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 disabled:opacity-50"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ThreatCategory | 'all')}
            disabled={huntStatus === 'hunting'}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
          >
            <option value="all">All Categories</option>
            <option value="malware">Malware</option>
            <option value="phishing">Phishing</option>
            <option value="intrusion">Intrusion</option>
            <option value="apt">APT</option>
            <option value="ransomware">Ransomware</option>
          </select>
          {huntStatus !== 'hunting' ? (
            <Button variant="primary" onClick={startHunt} disabled={!target}>
              Start Hunt
            </Button>
          ) : (
            <Button variant="subtle" onClick={stopHunt}>
              Stop Hunt
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Left: Hunt Threads */}
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col gap-4 overflow-hidden">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-rose-200 dark:border-rose-800 rounded-xl bg-white dark:bg-slate-900/70 p-3 text-center">
              <p className="text-xs text-slate-500">Critical</p>
              <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
            </div>
            <div className="border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-slate-900/70 p-3 text-center">
              <p className="text-xs text-slate-500">High</p>
              <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h4 className="font-semibold text-sm">Hunt Threads</h4>
              <p className="text-xs text-slate-500">
                {stats.threadsComplete}/{stats.threadsTotal} complete
              </p>
            </div>

            <div className="overflow-auto divide-y divide-slate-100 dark:divide-slate-700" style={{ maxHeight: 'calc(100% - 60px)' }}>
              {threads.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Enter a target and start hunt
                </div>
              ) : (
                threads.map(thread => (
                  <div key={thread.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{thread.name}</span>
                      <span className="text-xs text-slate-500">
                        {thread.indicatorsFound} IOCs
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          thread.status === 'completed' ? 'bg-emerald-500' :
                          thread.status === 'failed' ? 'bg-rose-500' :
                          'bg-rose-400'
                        }`}
                        style={{ width: `${thread.progress}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 truncate">{thread.source}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right: Indicators */}
        <section className="col-span-12 lg:col-span-8 h-full flex flex-col overflow-hidden">
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70 flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Threat Indicators</h4>
                  <p className="text-xs text-slate-500">{filteredIndicators.length} indicators</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
                    className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  {indicators.length > 0 && (
                    <Button variant="subtle" size="small">
                      Export STIX
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-auto p-4 space-y-3" style={{ maxHeight: 'calc(100% - 80px)' }}>
              {filteredIndicators.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8">
                  {huntStatus === 'hunting' ? 'Hunting for threats...' : 'No indicators found'}
                </div>
              ) : (
                filteredIndicators.map(indicator => {
                  const correlation = correlations.find(c => c.indicatorId === indicator.id);
                  return (
                    <article 
                      key={indicator.id}
                      className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryIcons[indicator.category]}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityStyles[indicator.severity]}`}>
                                {indicator.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-500 uppercase">{indicator.type}</span>
                            </div>
                            <p className="font-mono text-sm mt-1 break-all">{indicator.value}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            indicator.confidence >= 80 ? 'text-emerald-600' :
                            indicator.confidence >= 60 ? 'text-amber-600' :
                            'text-slate-500'
                          }`}>
                            {indicator.confidence}%
                          </p>
                          <p className="text-xs text-slate-500">{indicator.hits} hits</p>
                        </div>
                      </div>

                      {/* Correlation Data */}
                      {correlation && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {correlation.relatedCampaigns.map(c => (
                              <span key={c} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded">
                                🎯 {c}
                              </span>
                            ))}
                            {correlation.ttps.map(t => (
                              <span key={t} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-2">
                          {indicator.responseActions.map(action => (
                            <Button key={action} variant="subtle" size="small">
                              {action === 'isolate' && '🔒'}
                              {action === 'block' && '🚫'}
                              {action === 'alert' && '🔔'}
                              {action === 'quarantine' && '📦'}
                              {action === 'investigate' && '🔍'}
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </Button>
                          ))}
                        </div>
                        {autoResponseMode && (
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={indicator.autoResponseEnabled}
                              onChange={() => engineRef.current?.enableAutoResponse(indicator.id)}
                            />
                            Auto-response
                          </label>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AutonomousThreatHunterWidget;
