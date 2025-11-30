import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Wifi,
  Globe,
  Search,
  AlertTriangle,
  Activity,
  Eye,
  Server,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileWarning,
  Scan,
  Radio,
  Zap,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Network,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  OctagonX,
  Dna,
  FileStack,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type Severity = 'low' | 'medium' | 'high' | 'critical';
type ThreatStatus = 'active' | 'investigating' | 'contained' | 'resolved';
type ConnectionStatus = 'established' | 'listening' | 'blocked';

interface Threat {
  id: string;
  vector: string;
  severity: Severity;
  source: string;
  detectedAt: Date;
  status: ThreatStatus;
  action: string;
  riskScore: number;
}

interface DarkWebAlert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  source: string;
  timestamp: Date;
  priceUSD?: number;
}

interface NetworkConnection {
  id: string;
  provider: string;
  ip: string;
  port: number;
  status: ConnectionStatus;
  bytesIn: number;
  bytesOut: number;
}

interface ScanFinding {
  id: string;
  path: string;
  filename: string;
  keyword: string;
  threatScore: number;
  snippet: string;
}

interface ComplianceItem {
  name: string;
  status: 'green' | 'yellow' | 'red';
  detail: string;
  dueDate: string;
}

interface CyberOpsData {
  threats: Threat[];
  darkWebAlerts: DarkWebAlert[];
  connections: NetworkConnection[];
  scanFindings: ScanFinding[];
  compliance: ComplianceItem[];
}

// ============================================
// API SERVICE - Real Data Integration
// ============================================
const API_BASE = 'http://localhost:3001';

async function fetchCyberOpsData(): Promise<CyberOpsData> {
  try {
    const response = await fetch(`${API_BASE}/api/cyber-ops/overview`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    // Parse dates from API response
    return {
      threats: (data.threats || []).map((t: Threat) => ({
        ...t,
        detectedAt: new Date(t.detectedAt),
      })),
      darkWebAlerts: (data.darkWebAlerts || []).map((a: DarkWebAlert) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      })),
      connections: data.connections || [],
      scanFindings: data.scanFindings || [],
      compliance: data.compliance || [],
    };
  } catch (error) {
    console.error('[CyberOps] API fetch failed:', error);
    // Return empty data - NO MOCK FALLBACK
    return {
      threats: [],
      darkWebAlerts: [],
      connections: [],
      scanFindings: [],
      compliance: [],
    };
  }
}

async function fetchThreats(): Promise<Threat[]> {
  try {
    const response = await fetch(`${API_BASE}/api/cyber-ops/threats`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return (data || []).map((t: Threat) => ({
      ...t,
      detectedAt: new Date(t.detectedAt),
    }));
  } catch (error) {
    console.error('[CyberOps] Threats fetch failed:', error);
    return [];
  }
}

async function fetchDarkWebAlerts(): Promise<DarkWebAlert[]> {
  try {
    const response = await fetch(`${API_BASE}/api/cyber-ops/darkweb`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return (data || []).map((a: DarkWebAlert) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  } catch (error) {
    console.error('[CyberOps] DarkWeb fetch failed:', error);
    return [];
  }
}

async function fetchNetworkConnections(): Promise<NetworkConnection[]> {
  try {
    const response = await fetch(`${API_BASE}/api/cyber-ops/network`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json() || [];
  } catch (error) {
    console.error('[CyberOps] Network fetch failed:', error);
    return [];
  }
}

async function fetchScanFindings(path?: string): Promise<ScanFinding[]> {
  try {
    const url = path 
      ? `${API_BASE}/api/cyber-ops/scan?path=${encodeURIComponent(path)}`
      : `${API_BASE}/api/cyber-ops/scan`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json() || [];
  } catch (error) {
    console.error('[CyberOps] Scan fetch failed:', error);
    return [];
  }
}

async function fetchCompliance(): Promise<ComplianceItem[]> {
  try {
    const response = await fetch(`${API_BASE}/api/cyber-ops/compliance`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json() || [];
  } catch (error) {
    console.error('[CyberOps] Compliance fetch failed:', error);
    return [];
  }
}

// ============================================
// STYLE HELPERS
// ============================================
const getSeverityStyle = (severity: Severity) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-neon-green/20 text-neon-green border-neon-green/30';
  }
};

const getStatusStyle = (status: ThreatStatus) => {
  switch (status) {
    case 'active':
      return 'text-red-400';
    case 'investigating':
      return 'text-yellow-400';
    case 'contained':
      return 'text-orange-400';
    case 'resolved':
      return 'text-neon-green';
  }
};

const getComplianceStyle = (status: 'green' | 'yellow' | 'red') => {
  switch (status) {
    case 'green':
      return 'bg-neon-green/20 text-neon-green border-neon-green/30';
    case 'yellow':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'red':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ message, icon: Icon }: { message: string; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="flex flex-col items-center justify-center py-8 text-neon-green/40">
    <Icon className="w-8 h-8 mb-2" />
    <p className="text-xs">{message}</p>
    <p className="text-[10px] mt-1">Connect to backend API for live data</p>
  </div>
);

// ============================================
// MINI WIDGET COMPONENTS
// ============================================

// Threat Overview Panel
const ThreatOverview = ({ threats }: { threats: Threat[] }) => {
  const criticalCount = threats.filter(t => t.severity === 'critical').length;
  const highCount = threats.filter(t => t.severity === 'high').length;
  const activeCount = threats.filter(t => t.status === 'active' || t.status === 'investigating').length;

  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-red-400" />
        <span className="text-neon-green font-bold">THREAT_OVERVIEW</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-xs text-red-400/70">CRITICAL</p>
        </div>
        <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <p className="text-2xl font-bold text-orange-400">{highCount}</p>
          <p className="text-xs text-orange-400/70">HIGH</p>
        </div>
        <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{activeCount}</p>
          <p className="text-xs text-yellow-400/70">ACTIVE</p>
        </div>
      </div>

      {threats.length === 0 ? (
        <EmptyState message="No threats detected" icon={ShieldCheck} />
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {threats.map(threat => (
            <div
              key={threat.id}
              className="p-3 bg-cyber-black/40 rounded-lg border border-neon-green/10 hover:border-neon-green/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neon-green">{threat.vector}</p>
                  <p className="text-xs text-neon-green/50">{threat.source}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded border ${getSeverityStyle(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neon-green/60">
                <span>{threat.id}</span>
                <span className={getStatusStyle(threat.status)}>{threat.status}</span>
                <span>Risk: {threat.riskScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Dark Web Monitor Panel
const DarkWebMonitor = ({ alerts }: { alerts: DarkWebAlert[] }) => {
  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-purple-400" />
        <span className="text-neon-green font-bold">DARK_WEB_MONITOR</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-neon-green/50">
          <Radio className="w-3 h-3 animate-pulse text-neon-green" />
          LIVE
        </span>
      </div>

      {alerts.length === 0 ? (
        <EmptyState message="No dark web alerts" icon={Eye} />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-purple-300">{alert.title}</p>
                <span className={`px-2 py-0.5 text-xs rounded border ${getSeverityStyle(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neon-green/60 mb-2">{alert.description}</p>
              <div className="flex items-center gap-4 text-xs text-neon-green/50">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {alert.source}
                </span>
                {alert.priceUSD && (
                  <span className="text-yellow-400">${alert.priceUSD}</span>
                )}
                <span className="ml-auto">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Network Spy Panel
const NetworkSpy = ({ connections }: { connections: NetworkConnection[] }) => {
  const established = connections.filter(c => c.status === 'established').length;
  const listening = connections.filter(c => c.status === 'listening').length;
  const blocked = connections.filter(c => c.status === 'blocked').length;

  const providerColors: Record<string, string> = {
    'Google Cloud': 'bg-blue-500',
    'Microsoft Azure': 'bg-cyan-500',
    'Amazon AWS': 'bg-orange-500',
    'Cloudflare': 'bg-yellow-500',
    'Internal': 'bg-neon-green',
    'Unknown': 'bg-red-500',
  };

  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-neon-cyan" />
        <span className="text-neon-green font-bold">NETWORK_SPY</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-neon-green/10 rounded border border-neon-green/20">
          <p className="text-lg font-bold text-neon-green">{established}</p>
          <p className="text-[10px] text-neon-green/60">ACTIVE</p>
        </div>
        <div className="text-center p-2 bg-neon-cyan/10 rounded border border-neon-cyan/20">
          <p className="text-lg font-bold text-neon-cyan">{listening}</p>
          <p className="text-[10px] text-neon-cyan/60">LISTENING</p>
        </div>
        <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
          <p className="text-lg font-bold text-red-400">{blocked}</p>
          <p className="text-[10px] text-red-400/60">BLOCKED</p>
        </div>
      </div>

      {connections.length === 0 ? (
        <EmptyState message="No active connections" icon={Network} />
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="flex items-center gap-3 p-2 bg-cyber-black/40 rounded border border-neon-green/10"
            >
              <div className={`w-2 h-2 rounded-full ${providerColors[conn.provider] || 'bg-gray-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neon-green truncate">{conn.provider}</p>
                <p className="text-[10px] text-neon-green/50 font-mono">{conn.ip}:{conn.port}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                conn.status === 'established' ? 'bg-neon-green/20 text-neon-green' :
                conn.status === 'listening' ? 'bg-neon-cyan/20 text-neon-cyan' :
                'bg-red-500/20 text-red-400'
              }`}>
                {conn.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Local Scanner Panel
const LocalScanner = ({ findings, onScan }: { findings: ScanFinding[]; onScan: (path: string) => void }) => {
  const [scanPath, setScanPath] = useState('/var/www');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await onScan(scanPath);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-neon-cyan" />
        <span className="text-neon-green font-bold">LOCAL_SCANNER</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={scanPath}
          onChange={(e) => setScanPath(e.target.value)}
          className="flex-1 bg-cyber-black/50 border border-neon-green/30 rounded px-3 py-1.5 text-sm text-neon-green font-mono focus:outline-none focus:border-neon-green/60"
          placeholder="/path/to/scan"
        />
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded text-neon-green text-sm hover:bg-neon-green/20 transition-colors disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
        </button>
      </div>

      {findings.length === 0 ? (
        <EmptyState message="No findings - run a scan" icon={Search} />
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {findings.map(finding => (
            <div
              key={finding.id}
              className="p-2 bg-cyber-black/40 rounded border border-neon-green/10"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neon-green truncate">{finding.filename}</p>
                  <p className="text-[10px] text-neon-green/50 font-mono truncate">{finding.path}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  finding.threatScore >= 8 ? 'bg-red-500/20 text-red-400' :
                  finding.threatScore >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-neon-green/20 text-neon-green'
                }`}>
                  {finding.threatScore}/10
                </span>
              </div>
              <p className="text-[10px] text-neon-cyan/70 font-mono bg-cyber-black/60 p-1 rounded truncate">
                {finding.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Compliance Panel
const CompliancePanel = ({ items }: { items: ComplianceItem[] }) => {
  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-neon-green" />
        <span className="text-neon-green font-bold">COMPLIANCE_STATUS</span>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No compliance data" icon={ShieldCheck} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <div
              key={item.name}
              className={`p-3 rounded-lg border ${getComplianceStyle(item.status)}`}
            >
              <p className="text-sm font-medium mb-1">{item.name}</p>
              <p className="text-xs opacity-70 mb-2">{item.detail}</p>
              <p className="text-[10px] opacity-50">{item.dueDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// 🛑 HARVEST CONTROL PANEL with NØDSTOP
// ============================================
interface HarvestStatus {
  isRunning: boolean;
  harvestId: string | null;
  canAbort: boolean;
}

interface HarvestSummary {
  project: { totalFiles: number; byStrategy: Record<string, number> };
  intel: { totalFiles: number; byStrategy: Record<string, number> };
  totalFiles: number;
}

const HarvestControlPanel = () => {
  const [status, setStatus] = useState<HarvestStatus>({ isRunning: false, harvestId: null, canAbort: false });
  const [summary, setSummary] = useState<HarvestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/evolution/harvest/status`);
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/evolution/harvest/summary`);
      if (res.ok) setSummary(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchSummary();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchSummary]);

  const startHarvest = async (target: 'project' | 'intel' | 'all') => {
    setLoading(true);
    setMessage({ text: `Starting ${target} harvest...`, type: 'info' });
    try {
      const endpoint = target === 'all' ? '/api/evolution/harvest/all' :
                       target === 'intel' ? '/api/evolution/harvest/intel' :
                       '/api/evolution/harvest';
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMessage({ text: `Harvest complete! ${data.fileCount || data.combined?.totalFiles || 0} files processed.`, type: 'success' });
        await fetchSummary();
      } else throw new Error('Harvest failed');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ text: errMsg.includes('NØDSTOP') ? 'Harvest aborted by NØDSTOP' : `Harvest failed: ${errMsg}`, type: 'error' });
    } finally {
      setLoading(false);
      await fetchStatus();
    }
  };

  const abortHarvest = async () => {
    setAborting(true);
    setMessage({ text: 'NØDSTOP ACTIVATED - Aborting...', type: 'error' });
    try {
      const res = await fetch(`${API_BASE}/api/evolution/harvest/abort`, { method: 'POST' });
      const data = await res.json();
      setMessage({ text: data.success ? `✓ ${data.message}` : data.message, type: data.success ? 'success' : 'info' });
    } catch { setMessage({ text: 'Failed to abort harvest', type: 'error' }); }
    finally { setAborting(false); await fetchStatus(); }
  };

  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Dna className="w-5 h-5 text-neon-green" />
          <span className="text-neon-green font-bold">HARVEST_CONTROL</span>
          {status.isRunning && (
            <span className="flex items-center gap-1 text-xs text-yellow-400 animate-pulse">
              <Radio className="w-3 h-3" />
              RUNNING: {status.harvestId}
            </span>
          )}
        </div>
        {/* 🛑 NØDSTOP BUTTON */}
        <button
          onClick={abortHarvest}
          disabled={!status.canAbort || aborting}
          className={`relative px-6 py-3 rounded-lg font-black text-lg uppercase tracking-wider
                     transition-all duration-200 flex items-center gap-2
                     ${status.canAbort
                       ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-lg shadow-red-500/50 animate-pulse'
                       : 'bg-red-900/30 text-red-400/50 border border-red-800/30 cursor-not-allowed'
                     }`}
        >
          {aborting ? <Loader2 className="w-6 h-6 animate-spin" /> : <OctagonX className="w-6 h-6" />}
          NØDSTOP
        </button>
      </div>
      {message && (
        <div className={`mb-4 p-2 rounded text-sm ${
          message.type === 'success' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
          message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
        }`}>{message.text}</div>
      )}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-neon-green/10 rounded-lg border border-neon-green/20 text-center">
            <p className="text-2xl font-bold text-neon-green">{summary.project.totalFiles}</p>
            <p className="text-xs text-neon-green/60">PROJECT FILES</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center">
            <p className="text-2xl font-bold text-purple-400">{summary.intel.totalFiles}</p>
            <p className="text-xs text-purple-400/60">INTEL FILES</p>
          </div>
          <div className="p-3 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20 text-center">
            <p className="text-2xl font-bold text-neon-cyan">{summary.totalFiles}</p>
            <p className="text-xs text-neon-cyan/60">TOTAL</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => startHarvest('project')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg
                     text-neon-green text-sm font-medium hover:bg-neon-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />} PROJECT
        </button>
        <button onClick={() => startHarvest('intel')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg
                     text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dna className="w-4 h-4" />} INTEL
        </button>
        <button onClick={() => startHarvest('all')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg
                     text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} FULL SWEEP
        </button>
      </div>
    </div>
  );
};

// Metrics Bar - fetches from API
const MetricsBar = () => {
  const [metrics, setMetrics] = useState<Array<{ label: string; value: string; trend: string; up: boolean }>>([
    { label: 'Egress Anomaly', value: '--%', trend: '--', up: false },
    { label: 'Zero-Trust Coverage', value: '--%', trend: '--', up: false },
    { label: 'SIEM Latency', value: '--ms', trend: '--', up: false },
    { label: 'Active Cases', value: '--', trend: '--', up: false },
  ]);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch(`${API_BASE}/api/cyber-ops/metrics`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('[CyberOps] Metrics fetch failed:', error);
      }
    }
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map(metric => (
        <div key={metric.label} className="hud-border rounded-lg p-3 bg-cyber-black/60">
          <p className="text-[10px] text-neon-green/50 uppercase tracking-wider mb-1">{metric.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-neon-green">{metric.value}</span>
            <span className={`text-xs flex items-center gap-0.5 ${metric.up ? 'text-neon-green' : 'text-red-400'}`}>
              {metric.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {metric.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN CYBER OPS VIEW
// ============================================
export default function CyberOpsView() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [darkWebAlerts, setDarkWebAlerts] = useState<DarkWebAlert[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [scanFindings, setScanFindings] = useState<ScanFinding[]>([]);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load all data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCyberOpsData();
      setThreats(data.threats);
      setDarkWebAlerts(data.darkWebAlerts);
      setConnections(data.connections);
      setScanFindings(data.scanFindings);
      setCompliance(data.compliance);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler for local scanner
  const handleScan = useCallback(async (path: string) => {
    const findings = await fetchScanFindings(path);
    setScanFindings(findings);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !lastUpdate) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-16 h-16 text-neon-green animate-pulse" />
          <span className="text-neon-green">INITIALIZING CYBER OPS...</span>
          <span className="text-xs text-neon-green/50">Connecting to backend API</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neon-green/20">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-neon-green" />
          <span className="text-neon-green font-bold">CYBER_OPS_CENTER</span>
          <span className="flex items-center gap-1 text-xs text-neon-green/50">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-neon-green'} animate-pulse`} />
            {error ? 'API ERROR' : 'LIVE'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-neon-green/50">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
          <span className="text-xs text-red-400/50 ml-auto">Backend API unavailable</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 🛑 HARVEST CONTROL with NØDSTOP */}
        <HarvestControlPanel />

        {/* Metrics Bar */}
        <MetricsBar />

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <ThreatOverview threats={threats} />
            <NetworkSpy connections={connections} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <DarkWebMonitor alerts={darkWebAlerts} />
            <LocalScanner findings={scanFindings} onScan={handleScan} />
          </div>
        </div>

        {/* Compliance */}
        <CompliancePanel items={compliance} />
      </div>
    </div>
  );
}
