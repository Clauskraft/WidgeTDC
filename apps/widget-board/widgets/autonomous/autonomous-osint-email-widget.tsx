/**
 * Autonomous OSINT Email Investigation Widget
 * Multi-threaded investigation with spor-following capabilities
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ThreadStatus = 'pending' | 'running' | 'completed' | 'failed';
type FindingType = 'email' | 'phone' | 'breach' | 'social' | 'darkweb' | 'domain' | 'employment';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface InvestigationThread {
  id: string;
  name: string;
  source: string;
  status: ThreadStatus;
  progress: number;
  findings: Finding[];
  startTime: number;
  endTime?: number;
  dependencies: string[];
  priority: number;
}

interface Finding {
  id: string;
  threadId: string;
  source: string;
  type: FindingType;
  data: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  relatedFindings: string[];
  severity?: Severity;
}

interface InvestigationSummary {
  totalThreads: number;
  completedThreads: number;
  totalFindings: number;
  highConfidenceFindings: number;
  averageConfidence: number;
}

// ============================================================================
// INVESTIGATION ENGINE
// ============================================================================

class AutonomousInvestigationEngine {
  private threads: Map<string, InvestigationThread> = new Map();
  private findings: Finding[] = [];
  private onUpdate: (threads: InvestigationThread[], findings: Finding[]) => void;
  private isRunning = false;

  constructor(onUpdate: (threads: InvestigationThread[], findings: Finding[]) => void) {
    this.onUpdate = onUpdate;
  }

  async startInvestigation(email: string): Promise<void> {
    this.isRunning = true;
    this.threads.clear();
    this.findings = [];

    const threads = this.initializeThreads(email);
    threads.forEach(t => this.threads.set(t.id, t));
    this.notifyUpdate();

    await this.executeThreadsWithDependencies();
    this.correlateFindings();
    await this.spawnAdditionalThreads();

    this.isRunning = false;
  }

  private initializeThreads(email: string): InvestigationThread[] {
    const domain = email.split('@')[1] || 'unknown.com';
    const now = Date.now();

    return [
      // TIER 1: No dependencies
      {
        id: 'breach-check',
        name: 'Breach Database Check',
        source: 'HaveIBeenPwned + Dehashed',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: [],
        priority: 5
      },
      {
        id: 'email-validation',
        name: 'Email Validation',
        source: 'Email Validator API',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: [],
        priority: 5
      },
      {
        id: 'domain-whois',
        name: 'Domain WHOIS',
        source: 'WHOIS Database',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: [],
        priority: 4
      },
      // TIER 2: Depends on email validation
      {
        id: 'linkedin-search',
        name: 'LinkedIn Intelligence',
        source: 'LinkedIn OSINT',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['email-validation'],
        priority: 4
      },
      {
        id: 'twitter-search',
        name: 'Twitter/X Intelligence',
        source: 'Twitter API',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['email-validation'],
        priority: 3
      },
      {
        id: 'facebook-search',
        name: 'Facebook Intelligence',
        source: 'Facebook OSINT',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['email-validation'],
        priority: 3
      },
      // TIER 3: Deep intelligence
      {
        id: 'darkweb-scan',
        name: 'Dark Web Monitoring',
        source: 'Dark Web Crawler',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['breach-check'],
        priority: 4
      },
      {
        id: 'public-records',
        name: 'Public Records',
        source: 'Public Records DB',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['email-validation'],
        priority: 3
      },
      {
        id: 'employment-history',
        name: 'Employment Intelligence',
        source: 'Employment DB',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['linkedin-search'],
        priority: 3
      },
      // TIER 4: Pattern analysis
      {
        id: 'email-pattern-analysis',
        name: 'Pattern Detection',
        source: 'AI Pattern Analyzer',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: now,
        dependencies: ['email-validation', 'domain-whois'],
        priority: 2
      }
    ];
  }

  private async executeThreadsWithDependencies(): Promise<void> {
    const maxConcurrent = 5;
    const executing: Promise<void>[] = [];

    while (this.hasUncompletedThreads()) {
      const readyThreads = Array.from(this.threads.values())
        .filter(t => t.status === 'pending' && this.areDependenciesMet(t))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxConcurrent - executing.length);

      for (const thread of readyThreads) {
        const promise = this.executeThread(thread).finally(() => {
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
        });
        executing.push(promise);
      }

      if (executing.length === 0 && this.hasUncompletedThreads()) {
        console.error('Deadlock detected in thread execution');
        break;
      }

      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }

  private areDependenciesMet(thread: InvestigationThread): boolean {
    return thread.dependencies.every(depId => {
      const dep = this.threads.get(depId);
      return dep && dep.status === 'completed';
    });
  }

  private hasUncompletedThreads(): boolean {
    return Array.from(this.threads.values()).some(
      t => t.status === 'pending' || t.status === 'running'
    );
  }

  private async executeThread(thread: InvestigationThread): Promise<void> {
    thread.status = 'running';
    thread.progress = 0;
    this.notifyUpdate();

    try {
      const findings = await this.runThreadInvestigation(thread);
      thread.findings = findings;
      this.findings.push(...findings);
      thread.status = 'completed';
      thread.progress = 100;
      thread.endTime = Date.now();
    } catch (error) {
      console.error(`Thread ${thread.id} failed:`, error);
      thread.status = 'failed';
      thread.progress = 100;
      thread.endTime = Date.now();
    }

    this.notifyUpdate();
  }

  private async runThreadInvestigation(thread: InvestigationThread): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Simulate progressive investigation
    for (let i = 0; i <= 100; i += 10) {
      thread.progress = i;
      this.notifyUpdate();
      await this.delay(200 + Math.random() * 300);
    }

    // Generate simulated findings based on thread type
    const findingCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < findingCount; i++) {
      findings.push({
        id: `${thread.id}-finding-${i}`,
        threadId: thread.id,
        source: thread.source,
        type: this.getTypeForThread(thread.id),
        data: this.generateFindingData(thread.id),
        confidence: 60 + Math.floor(Math.random() * 40),
        timestamp: Date.now(),
        relatedFindings: [],
        severity: this.getRandomSeverity()
      });
    }

    return findings;
  }

  private getTypeForThread(threadId: string): FindingType {
    const typeMap: Record<string, FindingType> = {
      'breach-check': 'breach',
      'email-validation': 'email',
      'domain-whois': 'domain',
      'linkedin-search': 'social',
      'twitter-search': 'social',
      'facebook-search': 'social',
      'darkweb-scan': 'darkweb',
      'public-records': 'email',
      'employment-history': 'employment',
      'email-pattern-analysis': 'email'
    };
    return typeMap[threadId] || 'email';
  }

  private generateFindingData(threadId: string): Record<string, unknown> {
    const dataTemplates: Record<string, Record<string, unknown>> = {
      'breach-check': {
        breach: 'Data Breach 2024',
        exposedData: ['email', 'password_hash'],
        date: '2024-01-15',
        verified: true
      },
      'email-validation': {
        valid: true,
        disposable: false,
        mxRecords: ['mx1.domain.com', 'mx2.domain.com'],
        smtpCheck: true
      },
      'linkedin-search': {
        profileUrl: 'linkedin.com/in/user',
        headline: 'Professional Title',
        connections: '500+',
        verified: true
      },
      'darkweb-scan': {
        mentions: 1,
        context: 'Found in credential dump',
        risk: 'medium'
      }
    };
    return dataTemplates[threadId] || { found: true };
  }

  private getRandomSeverity(): Severity {
    const severities: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  private correlateFindings(): void {
    const bySource = new Map<string, Finding[]>();
    this.findings.forEach(f => {
      const existing = bySource.get(f.source) || [];
      existing.push(f);
      bySource.set(f.source, existing);
    });

    this.findings.forEach(finding => {
      const related = bySource.get(finding.source) || [];
      finding.relatedFindings = related
        .filter(f => f.id !== finding.id)
        .map(f => f.id);
    });
  }

  private async spawnAdditionalThreads(): Promise<void> {
    // Spawn additional threads based on findings
    const phoneFindings = this.findings.filter(f => 
      f.data && typeof f.data === 'object' && 'phone' in f.data
    );
    
    if (phoneFindings.length > 0) {
      const phoneThread: InvestigationThread = {
        id: 'phone-lookup-spawned',
        name: 'Phone Intelligence (Spawned)',
        source: 'Phone OSINT',
        status: 'pending',
        progress: 0,
        findings: [],
        startTime: Date.now(),
        dependencies: [],
        priority: 2
      };
      this.threads.set(phoneThread.id, phoneThread);
      await this.executeThread(phoneThread);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyUpdate(): void {
    this.onUpdate(Array.from(this.threads.values()), this.findings);
  }

  stop(): void {
    this.isRunning = false;
  }

  getSummary(): InvestigationSummary {
    const threads = Array.from(this.threads.values());
    const totalFindings = this.findings.length;
    const highConfidence = this.findings.filter(f => f.confidence >= 80).length;
    const avgConfidence = totalFindings > 0
      ? this.findings.reduce((sum, f) => sum + f.confidence, 0) / totalFindings
      : 0;

    return {
      totalThreads: threads.length,
      completedThreads: threads.filter(t => t.status === 'completed').length,
      totalFindings,
      highConfidenceFindings: highConfidence,
      averageConfidence: Math.round(avgConfidence)
    };
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const severityStyles: Record<Severity, string> = {
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-slate-100 text-slate-600 border-slate-200'
};

const statusStyles: Record<ThreadStatus, string> = {
  pending: 'text-slate-400',
  running: 'text-blue-500',
  completed: 'text-emerald-500',
  failed: 'text-rose-500'
};

const AutonomousOSINTEmailWidget: React.FC<{ widgetId: string }> = () => {
  const [email, setEmail] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [threads, setThreads] = useState<InvestigationThread[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  const engineRef = useRef<AutonomousInvestigationEngine | null>(null);

  useEffect(() => {
    engineRef.current = new AutonomousInvestigationEngine((updatedThreads, updatedFindings) => {
      setThreads([...updatedThreads]);
      setFindings([...updatedFindings]);
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startInvestigation = useCallback(async () => {
    if (!email || !engineRef.current) return;
    
    setIsInvestigating(true);
    setShowReport(false);
    
    try {
      await engineRef.current.startInvestigation(email);
      setShowReport(true);
    } catch (error) {
      console.error('Investigation failed:', error);
    } finally {
      setIsInvestigating(false);
    }
  }, [email]);

  const stopInvestigation = useCallback(() => {
    engineRef.current?.stop();
    setIsInvestigating(false);
  }, []);

  const summary = engineRef.current?.getSummary() || {
    totalThreads: 0,
    completedThreads: 0,
    totalFindings: 0,
    highConfidenceFindings: 0,
    averageConfidence: 0
  };

  const filteredFindings = selectedThread
    ? findings.filter(f => f.threadId === selectedThread)
    : findings;

  return (
    <div className="h-full flex flex-col -m-4" data-testid="autonomous-osint-email-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-b border-slate-700">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">Autonomous OSINT</p>
            <h3 className="text-2xl font-semibold">Email Investigation</h3>
            <p className="text-sm text-white/70">
              Multi-threaded spor-følging med auto-feature installation
            </p>
          </div>
          {isInvestigating && (
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-300">
                  {summary.completedThreads}/{summary.totalThreads} threads
                </span>
                <span className="text-emerald-300">
                  {summary.totalFindings} findings
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {Math.round((summary.completedThreads / summary.totalThreads) * 100) || 0}%
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address to investigate..."
            disabled={isInvestigating}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {!isInvestigating ? (
            <Button
              variant="primary"
              onClick={startInvestigation}
              disabled={!email.includes('@')}
            >
              Start Investigation
            </Button>
          ) : (
            <Button variant="subtle" onClick={stopInvestigation}>
              Stop
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Left: Thread List */}
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h4 className="font-semibold text-sm">Investigation Threads</h4>
            <p className="text-xs text-slate-500 mt-1">
              {threads.filter(t => t.status === 'running').length} active
            </p>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-700">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Enter an email and start investigation to see threads
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id === selectedThread ? null : thread.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedThread === thread.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">{thread.name}</span>
                    <span className={`text-xs ${statusStyles[thread.status]}`}>
                      {thread.status === 'running' ? '●' : thread.status === 'completed' ? '✓' : thread.status === 'failed' ? '✕' : '○'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        thread.status === 'completed' ? 'bg-emerald-500' :
                        thread.status === 'failed' ? 'bg-rose-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${thread.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{thread.source}</span>
                    <span>{thread.findings.length} findings</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Right: Findings */}
        <section className="col-span-12 lg:col-span-8 h-full flex flex-col gap-4 overflow-hidden">
          {/* Summary Stats */}
          {showReport && (
            <div className="grid grid-cols-4 gap-3">
              <MetricCard 
                label="Total Findings" 
                value={summary.totalFindings.toString()} 
              />
              <MetricCard 
                label="High Confidence" 
                value={summary.highConfidenceFindings.toString()} 
              />
              <MetricCard 
                label="Avg Confidence" 
                value={`${summary.averageConfidence}%`} 
              />
              <MetricCard 
                label="Threads" 
                value={`${summary.completedThreads}/${summary.totalThreads}`} 
              />
            </div>
          )}

          {/* Findings List */}
          <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">
                    {selectedThread ? 'Filtered Findings' : 'All Findings'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {filteredFindings.length} findings
                    {selectedThread && (
                      <button
                        onClick={() => setSelectedThread(null)}
                        className="ml-2 text-blue-500 hover:underline"
                      >
                        Show all
                      </button>
                    )}
                  </p>
                </div>
                {findings.length > 0 && (
                  <Button variant="subtle" size="small">
                    Export JSON
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-auto p-4 space-y-3" style={{ maxHeight: 'calc(100% - 80px)' }}>
              {filteredFindings.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8">
                  {isInvestigating ? 'Investigating...' : 'No findings yet'}
                </div>
              ) : (
                filteredFindings.map(finding => (
                  <article 
                    key={finding.id}
                    className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          severityStyles[finding.severity || 'info']
                        }`}>
                          {finding.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">{finding.source}</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        finding.confidence >= 80 ? 'text-emerald-600' :
                        finding.confidence >= 60 ? 'text-amber-600' :
                        'text-slate-500'
                      }`}>
                        {finding.confidence}% confidence
                      </span>
                    </div>

                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-2 rounded mt-2">
                      {JSON.stringify(finding.data, null, 2)}
                    </pre>

                    {finding.relatedFindings.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        🔗 {finding.relatedFindings.length} related findings
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/70 p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default AutonomousOSINTEmailWidget;
