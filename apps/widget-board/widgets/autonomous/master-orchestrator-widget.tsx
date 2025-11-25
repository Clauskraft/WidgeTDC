/**
 * Master Orchestrator Widget
 * Coordinates OSINT and Cybersecurity investigations simultaneously
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type InvestigationType = 'osint' | 'threat' | 'combined';
type OrchestrationStatus = 'idle' | 'planning' | 'executing' | 'correlating' | 'completed';
type AgentStatus = 'idle' | 'active' | 'paused' | 'completed' | 'error';

interface InvestigationAgent {
  id: string;
  name: string;
  type: InvestigationType;
  status: AgentStatus;
  tasksTotal: number;
  tasksCompleted: number;
  findingsCount: number;
  riskScore: number;
  lastUpdate: number;
}

interface UnifiedFinding {
  id: string;
  agentId: string;
  type: 'osint' | 'threat';
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  data: Record<string, unknown>;
  correlatedWith: string[];
  timestamp: number;
}

interface CorrelationCluster {
  id: string;
  findings: string[];
  theme: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendedActions: string[];
}

interface OrchestrationPlan {
  id: string;
  target: string;
  type: InvestigationType;
  phases: {
    name: string;
    status: 'pending' | 'active' | 'completed';
    agents: string[];
  }[];
  startTime: number;
  estimatedDuration: number;
}

// ============================================================================
// MASTER ORCHESTRATION ENGINE
// ============================================================================

class MasterOrchestrationEngine {
  private agents: Map<string, InvestigationAgent> = new Map();
  private findings: UnifiedFinding[] = [];
  private clusters: CorrelationCluster[] = [];
  private plan: OrchestrationPlan | null = null;
  private onUpdate: (
    agents: InvestigationAgent[],
    findings: UnifiedFinding[],
    clusters: CorrelationCluster[],
    plan: OrchestrationPlan | null
  ) => void;
  private isRunning = false;

  constructor(onUpdate: (
    agents: InvestigationAgent[],
    findings: UnifiedFinding[],
    clusters: CorrelationCluster[],
    plan: OrchestrationPlan | null
  ) => void) {
    this.onUpdate = onUpdate;
  }

  async startOrchestration(target: string, type: InvestigationType): Promise<void> {
    this.isRunning = true;
    this.agents.clear();
    this.findings = [];
    this.clusters = [];

    // Create orchestration plan
    this.plan = this.createPlan(target, type);
    this.notifyUpdate();

    // Initialize agents based on type
    const agentConfigs = this.getAgentConfigs(type);
    agentConfigs.forEach(config => {
      this.agents.set(config.id, {
        ...config,
        status: 'idle',
        tasksCompleted: 0,
        findingsCount: 0,
        lastUpdate: Date.now()
      });
    });
    this.notifyUpdate();

    // Execute phases
    for (const phase of this.plan.phases) {
      if (!this.isRunning) break;
      
      phase.status = 'active';
      this.notifyUpdate();

      await this.executePhase(phase);
      
      phase.status = 'completed';
      this.notifyUpdate();
    }

    // Correlation phase
    await this.performCrossCorrelation();

    this.isRunning = false;
    this.notifyUpdate();
  }

  private createPlan(target: string, type: InvestigationType): OrchestrationPlan {
    const phases = type === 'combined' ? [
      { name: 'Initial Reconnaissance', status: 'pending' as const, agents: ['osint-primary', 'threat-scanner'] },
      { name: 'Deep Intelligence', status: 'pending' as const, agents: ['social-intel', 'dark-web', 'threat-feeds'] },
      { name: 'Pattern Analysis', status: 'pending' as const, agents: ['correlator', 'risk-assessor'] },
      { name: 'Cross-Domain Correlation', status: 'pending' as const, agents: ['master-correlator'] }
    ] : type === 'osint' ? [
      { name: 'OSINT Reconnaissance', status: 'pending' as const, agents: ['osint-primary', 'social-intel'] },
      { name: 'Deep OSINT', status: 'pending' as const, agents: ['dark-web', 'public-records'] },
      { name: 'OSINT Correlation', status: 'pending' as const, agents: ['correlator'] }
    ] : [
      { name: 'Threat Scanning', status: 'pending' as const, agents: ['threat-scanner', 'threat-feeds'] },
      { name: 'Deep Threat Analysis', status: 'pending' as const, agents: ['dark-web', 'ioc-analyzer'] },
      { name: 'Threat Correlation', status: 'pending' as const, agents: ['risk-assessor'] }
    ];

    return {
      id: `orch-${Date.now()}`,
      target,
      type,
      phases,
      startTime: Date.now(),
      estimatedDuration: phases.length * 15000
    };
  }

  private getAgentConfigs(type: InvestigationType): Partial<InvestigationAgent>[] {
    const osintAgents = [
      { id: 'osint-primary', name: 'OSINT Primary', type: 'osint' as const, tasksTotal: 5, riskScore: 0 },
      { id: 'social-intel', name: 'Social Intelligence', type: 'osint' as const, tasksTotal: 4, riskScore: 0 },
      { id: 'public-records', name: 'Public Records', type: 'osint' as const, tasksTotal: 3, riskScore: 0 }
    ];

    const threatAgents = [
      { id: 'threat-scanner', name: 'Threat Scanner', type: 'threat' as const, tasksTotal: 5, riskScore: 0 },
      { id: 'threat-feeds', name: 'Threat Intelligence Feeds', type: 'threat' as const, tasksTotal: 4, riskScore: 0 },
      { id: 'ioc-analyzer', name: 'IOC Analyzer', type: 'threat' as const, tasksTotal: 3, riskScore: 0 }
    ];

    const sharedAgents = [
      { id: 'dark-web', name: 'Dark Web Scanner', type: 'combined' as const, tasksTotal: 4, riskScore: 0 },
      { id: 'correlator', name: 'Pattern Correlator', type: 'combined' as const, tasksTotal: 2, riskScore: 0 },
      { id: 'risk-assessor', name: 'Risk Assessor', type: 'combined' as const, tasksTotal: 2, riskScore: 0 },
      { id: 'master-correlator', name: 'Master Correlator', type: 'combined' as const, tasksTotal: 1, riskScore: 0 }
    ];

    if (type === 'combined') {
      return [...osintAgents, ...threatAgents, ...sharedAgents];
    } else if (type === 'osint') {
      return [...osintAgents, ...sharedAgents.slice(0, 2)];
    } else {
      return [...threatAgents, ...sharedAgents.slice(0, 2)];
    }
  }

  private async executePhase(phase: { name: string; agents: string[] }): Promise<void> {
    const phaseAgents = phase.agents
      .map(id => this.agents.get(id))
      .filter((a): a is InvestigationAgent => a !== undefined);

    // Start all agents in this phase
    phaseAgents.forEach(agent => {
      agent.status = 'active';
    });
    this.notifyUpdate();

    // Execute agents concurrently
    await Promise.all(phaseAgents.map(agent => this.executeAgent(agent)));
  }

  private async executeAgent(agent: InvestigationAgent): Promise<void> {
    agent.status = 'active';
    this.notifyUpdate();

    try {
      for (let i = 0; i < agent.tasksTotal; i++) {
        if (!this.isRunning) break;

        await this.delay(500 + Math.random() * 500);
        agent.tasksCompleted = i + 1;
        agent.lastUpdate = Date.now();

        // Generate findings
        if (Math.random() > 0.3) {
          const finding = this.generateFinding(agent);
          this.findings.push(finding);
          agent.findingsCount++;
          agent.riskScore = Math.min(100, agent.riskScore + Math.floor(Math.random() * 15));
        }

        this.notifyUpdate();
      }

      agent.status = 'completed';
    } catch (error) {
      agent.status = 'error';
    }

    this.notifyUpdate();
  }

  private generateFinding(agent: InvestigationAgent): UnifiedFinding {
    const categories = agent.type === 'osint' 
      ? ['email', 'social', 'employment', 'domain']
      : ['malware', 'phishing', 'intrusion', 'apt'];
    
    const severities: UnifiedFinding['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];

    return {
      id: `finding-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      agentId: agent.id,
      type: agent.type === 'combined' ? (Math.random() > 0.5 ? 'osint' : 'threat') : agent.type,
      category: categories[Math.floor(Math.random() * categories.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      confidence: 50 + Math.floor(Math.random() * 50),
      data: {
        source: agent.name,
        discovered: new Date().toISOString(),
        details: `Finding from ${agent.name} analysis`
      },
      correlatedWith: [],
      timestamp: Date.now()
    };
  }

  private async performCrossCorrelation(): Promise<void> {
    // Group findings by category
    const byCategory = new Map<string, UnifiedFinding[]>();
    this.findings.forEach(f => {
      const existing = byCategory.get(f.category) || [];
      existing.push(f);
      byCategory.set(f.category, existing);
    });

    // Create correlation clusters
    byCategory.forEach((categoryFindings, category) => {
      if (categoryFindings.length >= 2) {
        const riskLevels: CorrelationCluster['riskLevel'][] = ['critical', 'high', 'medium', 'low'];
        const avgSeverityIndex = Math.floor(
          categoryFindings.reduce((sum, f) => {
            const severityMap: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            return sum + severityMap[f.severity];
          }, 0) / categoryFindings.length
        );

        this.clusters.push({
          id: `cluster-${category}`,
          findings: categoryFindings.map(f => f.id),
          theme: category.charAt(0).toUpperCase() + category.slice(1),
          riskLevel: riskLevels[Math.min(avgSeverityIndex, 3)],
          description: `${categoryFindings.length} related findings in ${category} category`,
          recommendedActions: this.getRecommendedActions(category)
        });

        // Mark findings as correlated
        categoryFindings.forEach(f => {
          f.correlatedWith = categoryFindings.filter(cf => cf.id !== f.id).map(cf => cf.id);
        });
      }
    });

    this.notifyUpdate();
  }

  private getRecommendedActions(category: string): string[] {
    const actionMap: Record<string, string[]> = {
      email: ['Verify email ownership', 'Check for breaches', 'Monitor for phishing'],
      social: ['Analyze social connections', 'Check privacy settings', 'Document profiles'],
      malware: ['Isolate affected systems', 'Run full AV scan', 'Block IOCs'],
      phishing: ['Alert users', 'Block sender domains', 'Update email filters'],
      intrusion: ['Review access logs', 'Rotate credentials', 'Enable additional monitoring'],
      apt: ['Engage incident response', 'Preserve forensic evidence', 'Notify stakeholders']
    };
    return actionMap[category] || ['Review findings', 'Document evidence', 'Plan response'];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyUpdate(): void {
    this.onUpdate(
      Array.from(this.agents.values()),
      this.findings,
      this.clusters,
      this.plan
    );
  }

  stop(): void {
    this.isRunning = false;
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const severityColors: Record<string, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  info: 'bg-slate-400'
};

const MasterOrchestratorWidget: React.FC<{ widgetId: string }> = () => {
  const [target, setTarget] = useState('');
  const [investigationType, setInvestigationType] = useState<InvestigationType>('combined');
  const [status, setStatus] = useState<OrchestrationStatus>('idle');
  const [agents, setAgents] = useState<InvestigationAgent[]>([]);
  const [findings, setFindings] = useState<UnifiedFinding[]>([]);
  const [clusters, setClusters] = useState<CorrelationCluster[]>([]);
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'findings' | 'clusters'>('agents');

  const engineRef = useRef<MasterOrchestrationEngine | null>(null);

  useEffect(() => {
    engineRef.current = new MasterOrchestrationEngine((a, f, c, p) => {
      setAgents([...a]);
      setFindings([...f]);
      setClusters([...c]);
      setPlan(p);
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startOrchestration = useCallback(async () => {
    if (!target || !engineRef.current) return;

    setStatus('executing');
    try {
      await engineRef.current.startOrchestration(target, investigationType);
      setStatus('completed');
    } catch (error) {
      console.error('Orchestration failed:', error);
      setStatus('idle');
    }
  }, [target, investigationType]);

  const stopOrchestration = useCallback(() => {
    engineRef.current?.stop();
    setStatus('idle');
  }, []);

  const stats = useMemo(() => ({
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    completedAgents: agents.filter(a => a.status === 'completed').length,
    totalFindings: findings.length,
    criticalFindings: findings.filter(f => f.severity === 'critical').length,
    highFindings: findings.filter(f => f.severity === 'high').length,
    clusters: clusters.length,
    overallRisk: agents.length > 0 
      ? Math.round(agents.reduce((s, a) => s + a.riskScore, 0) / agents.length)
      : 0
  }), [agents, findings, clusters]);

  const phaseProgress = useMemo(() => {
    if (!plan) return 0;
    const completed = plan.phases.filter(p => p.status === 'completed').length;
    return Math.round((completed / plan.phases.length) * 100);
  }, [plan]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="master-orchestrator-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 text-white border-b border-purple-700/50">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Master Orchestrator</p>
            <h3 className="text-2xl font-semibold">Unified Investigation</h3>
            <p className="text-sm text-white/70">
              Koordinerer OSINT + Cybersecurity undersøgelser autonomt
            </p>
          </div>
          {status !== 'idle' && (
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-300">{phaseProgress}%</div>
              <p className="text-sm text-white/70">
                Phase {plan?.phases.filter(p => p.status === 'completed').length || 0} of {plan?.phases.length || 0}
              </p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-4">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter email, domain, IP, or organization..."
            disabled={status === 'executing'}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <select
            value={investigationType}
            onChange={(e) => setInvestigationType(e.target.value as InvestigationType)}
            disabled={status === 'executing'}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
          >
            <option value="combined">Combined OSINT + Threat</option>
            <option value="osint">OSINT Only</option>
            <option value="threat">Threat Hunt Only</option>
          </select>
          {status !== 'executing' ? (
            <Button variant="primary" onClick={startOrchestration} disabled={!target}>
              Start Orchestration
            </Button>
          ) : (
            <Button variant="subtle" onClick={stopOrchestration}>
              Stop
            </Button>
          )}
        </div>
      </header>

      {/* Phase Progress Bar */}
      {plan && (
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            {plan.phases.map((phase, index) => (
              <div key={phase.name} className="flex-1">
                <div className={`h-2 rounded-full ${
                  phase.status === 'completed' ? 'bg-emerald-500' :
                  phase.status === 'active' ? 'bg-purple-500 animate-pulse' :
                  'bg-slate-300 dark:bg-slate-600'
                }`} />
                <p className="text-xs text-slate-500 mt-1 truncate">{phase.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-slate-500">Agents:</span>{' '}
            <span className="font-medium">{stats.activeAgents}/{stats.totalAgents}</span>
          </div>
          <div>
            <span className="text-slate-500">Findings:</span>{' '}
            <span className="font-medium">{stats.totalFindings}</span>
            {stats.criticalFindings > 0 && (
              <span className="ml-1 text-rose-600">({stats.criticalFindings} critical)</span>
            )}
          </div>
          <div>
            <span className="text-slate-500">Clusters:</span>{' '}
            <span className="font-medium">{stats.clusters}</span>
          </div>
          <div>
            <span className="text-slate-500">Risk Score:</span>{' '}
            <span className={`font-medium ${
              stats.overallRisk >= 70 ? 'text-rose-600' :
              stats.overallRisk >= 40 ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {stats.overallRisk}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          {(['agents', 'findings', 'clusters'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'agents' && `Agents (${agents.length})`}
              {tab === 'findings' && `Findings (${findings.length})`}
              {tab === 'clusters' && `Clusters (${clusters.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/30">
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                Start orchestration to deploy investigation agents
              </div>
            ) : (
              agents.map(agent => (
                <div
                  key={agent.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/70 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">{agent.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      agent.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      agent.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      agent.status === 'error' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        agent.status === 'completed' ? 'bg-emerald-500' :
                        agent.status === 'error' ? 'bg-rose-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${(agent.tasksCompleted / agent.tasksTotal) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{agent.tasksCompleted}/{agent.tasksTotal} tasks</span>
                    <span>{agent.findingsCount} findings</span>
                    <span className={agent.riskScore >= 50 ? 'text-rose-600' : ''}>
                      Risk: {agent.riskScore}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-3">
            {findings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No findings yet
              </div>
            ) : (
              findings.slice().reverse().map(finding => (
                <div
                  key={finding.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/70 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${severityColors[finding.severity]}`} />
                    <span className="text-xs uppercase text-slate-500">{finding.type}</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {finding.category}
                    </span>
                    <span className={`ml-auto text-xs font-medium ${
                      finding.confidence >= 80 ? 'text-emerald-600' :
                      finding.confidence >= 60 ? 'text-amber-600' :
                      'text-slate-500'
                    }`}>
                      {finding.confidence}% confidence
                    </span>
                  </div>
                  
                  <pre className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(finding.data, null, 2)}
                  </pre>

                  {finding.correlatedWith.length > 0 && (
                    <p className="text-xs text-purple-600 mt-2">
                      🔗 Correlated with {finding.correlatedWith.length} other findings
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                Correlation clusters will appear after analysis
              </div>
            ) : (
              clusters.map(cluster => (
                <div
                  key={cluster.id}
                  className={`border rounded-xl p-4 ${
                    cluster.riskLevel === 'critical' ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20' :
                    cluster.riskLevel === 'high' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' :
                    cluster.riskLevel === 'medium' ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' :
                    'border-slate-200 bg-white dark:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{cluster.theme}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cluster.riskLevel === 'critical' ? 'bg-rose-100 text-rose-700' :
                      cluster.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                      cluster.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {cluster.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {cluster.description}
                  </p>

                  <div className="text-xs text-slate-500 mb-3">
                    {cluster.findings.length} correlated findings
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Recommended Actions:</p>
                    <ul className="text-sm space-y-1">
                      {cluster.recommendedActions.map((action, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-purple-500">→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterOrchestratorWidget;
