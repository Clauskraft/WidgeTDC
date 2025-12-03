import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  RefreshCw,
  Loader2,
  Radio,
  OctagonX,
  Dna,
  FileStack,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

// Import the real widgets we just fixed
import CybersecurityOverwatchWidget from '../widgets/CybersecurityOverwatchWidget';
import NetworkSpyWidget from '../widgets/NetworkSpyWidget';
import DarkWebMonitorWidget from '../widgets/DarkWebMonitorWidget';
import LocalScanWidget from '../widgets/LocalScanWidget';

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

  // Use relative paths for proxy support
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/evolution/harvest/status');
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/evolution/harvest/summary');
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
      const res = await fetch(endpoint, { method: 'POST' });
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
      const res = await fetch('/api/evolution/harvest/abort', { method: 'POST' });
      const data = await res.json();
      setMessage({ text: data.success ? `✓ ${data.message}` : data.message, type: data.success ? 'success' : 'info' });
    } catch { setMessage({ text: 'Failed to abort harvest', type: 'error' }); }
    finally { setAborting(false); await fetchStatus(); }
  };

  return (
    <div className="hud-border rounded-lg p-4 bg-[#0B3E6F]/20 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Dna className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-bold tracking-wider">HARVEST_CONTROL</span>
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
          message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
        }`}>{message.text}</div>
      )}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
            <p className="text-2xl font-bold text-green-400">{summary.project.totalFiles}</p>
            <p className="text-xs text-green-400/60">PROJECT FILES</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center">
            <p className="text-2xl font-bold text-purple-400">{summary.intel.totalFiles}</p>
            <p className="text-xs text-purple-400/60">INTEL FILES</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-center">
            <p className="text-2xl font-bold text-cyan-400">{summary.totalFiles}</p>
            <p className="text-xs text-cyan-400/60">TOTAL</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => startHarvest('project')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg
                     text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />} PROJECT
        </button>
        <button onClick={() => startHarvest('intel')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg
                     text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dna className="w-4 h-4" />} INTEL
        </button>
        <button onClick={() => startHarvest('all')} disabled={loading || status.isRunning}
          className="flex items-center justify-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg
                     text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} FULL SWEEP
        </button>
      </div>
    </div>
  );
};

// Metrics Bar - fetches from API (Relative path fixed)
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
        const response = await fetch('/api/cyber-ops/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        // console.error('[CyberOps] Metrics fetch failed:', error);
      }
    }
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map(metric => (
        <div key={metric.label} className="hud-border rounded-lg p-3 bg-[#0B3E6F]/20 backdrop-blur-sm border border-white/10">
          <p className="text-[10px] text-green-400/50 uppercase tracking-wider mb-1">{metric.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-green-400">{metric.value}</span>
            <span className={`text-xs flex items-center gap-0.5 ${metric.up ? 'text-green-400' : 'text-red-400'}`}>
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refresh = () => {
    setLastUpdate(new Date());
    // This triggers re-render which might cause child widgets to refetch if they depend on props, 
    // but currently they fetch on mount. To force update, we could pass a key.
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-bold tracking-wider">CYBER_OPS_CENTER</span>
          <span className="flex items-center gap-1 text-xs text-green-400/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-green-400/50">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="p-2 rounded hover:bg-white/10 text-green-400/60 hover:text-green-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* 🛑 HARVEST CONTROL with NØDSTOP */}
        <HarvestControlPanel />

        {/* Metrics Bar */}
        <MetricsBar />

        {/* Main Grid - USING REAL WIDGETS */}
        <div className="grid grid-cols-2 gap-4" key={lastUpdate.getTime()}>
          {/* Left Column */}
          <div className="space-y-4 h-[600px]">
            <div className="h-1/2">
                <CybersecurityOverwatchWidget />
            </div>
            <div className="h-1/2">
                <NetworkSpyWidget />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 h-[600px]">
            <div className="h-1/3">
                <DarkWebMonitorWidget />
            </div>
            <div className="h-2/3">
                <LocalScanWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
