import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, AlertOctagon, Activity, X, Terminal } from 'lucide-react';

interface Anomaly {
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    source: string;
    details: string;
    path: string;
    timestamp: string;
}

const CybersecurityOverwatchWidget: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState({ critical: 0, high: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const scanSystem = async () => {
    try {
      const res = await fetch('/api/sys/security/anomalies');
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      
      setAnomalies(data.anomalies);
      setStats({
          critical: data.critical,
          high: data.high,
          total: data.count
      });
      setLoading(false);
    } catch (err) {
        console.error(err);
        setLoading(false);
    }
  };

  useEffect(() => {
    scanSystem();
    const interval = setInterval(scanSystem, 5000); // Real scan every 5s
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
      switch (severity) {
          case 'CRITICAL': return 'text-red-500';
          case 'HIGH': return 'text-orange-500';
          case 'MEDIUM': return 'text-yellow-500';
          default: return 'text-blue-400';
      }
  };

  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">SYSTEM_OVERWATCH</h3>
        </div>
        <div className="flex items-center gap-2">
            {loading && <Activity size={12} className="text-cyan-400 animate-spin" />}
            <span className="text-[10px] font-mono text-gray-400">{anomalies.length} ANOMALIES DETECTED</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
        <div className="bg-[#051e3c]/80 p-2 text-center">
            <div className="text-lg font-bold text-red-500">{stats.critical}</div>
            <div className="text-[8px] text-red-400/70 tracking-wider">CRITICAL</div>
        </div>
        <div className="bg-[#051e3c]/80 p-2 text-center">
            <div className="text-lg font-bold text-orange-500">{stats.high}</div>
            <div className="text-[8px] text-orange-400/70 tracking-wider">HIGH</div>
        </div>
        <div className="bg-[#051e3c]/80 p-2 text-center">
            <div className="text-lg font-bold text-cyan-500">{stats.total}</div>
            <div className="text-[8px] text-cyan-400/70 tracking-wider">TOTAL</div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {anomalies.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500/50">
                <Shield size={32} className="mb-2 text-green-500/20" />
                <span className="text-xs">SYSTEM SECURE - NO ANOMALIES</span>
            </div>
        ) : (
            anomalies.map(anomaly => (
                <button
                    key={anomaly.id}
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            {anomaly.severity === 'CRITICAL' ? <AlertOctagon size={12} className="text-red-500" /> : <AlertTriangle size={12} className={getSeverityColor(anomaly.severity)} />}
                            <span className={`text-xs font-bold ${getSeverityColor(anomaly.severity)}`}>{anomaly.type}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">{anomaly.timestamp.split('T')[1].split('.')[0]}</span>
                    </div>
                    <div className="text-sm text-white font-medium truncate">{anomaly.source}</div>
                    <div className="text-[10px] text-gray-400 truncate font-mono">{anomaly.details}</div>
                </button>
            ))
        )}
      </div>

      {/* Drill-Down Overlay (The "Real" Data View) */}
      {selectedAnomaly && (
          <div className="absolute inset-0 bg-[#051e3c]/95 backdrop-blur-md z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4">
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-red-900/20">
                  <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-red-400" />
                      <span className="text-xs font-bold text-red-100 tracking-widest">THREAT_INTEL :: {selectedAnomaly.id}</span>
                  </div>
                  <button onClick={() => setSelectedAnomaly(null)} className="text-gray-400 hover:text-white">
                      <X size={16} />
                  </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4">
                  <div>
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Source Identity</div>
                      <div className="text-cyan-300 text-lg">{selectedAnomaly.source}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 p-2 rounded border border-white/10">
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Severity Score</div>
                          <div className={`text-base font-bold ${getSeverityColor(selectedAnomaly.severity)}`}>{selectedAnomaly.severity}</div>
                      </div>
                      <div className="bg-black/30 p-2 rounded border border-white/10">
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Detection Type</div>
                          <div className="text-white">{selectedAnomaly.type}</div>
                      </div>
                  </div>

                  <div className="bg-black/30 p-3 rounded border border-white/10">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Technical Telemetry</div>
                      <div className="text-green-400 leading-relaxed break-all">
                          {selectedAnomaly.details}
                      </div>
                  </div>

                  <div className="bg-black/30 p-3 rounded border border-white/10">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">File System Path / Origin</div>
                      <div className="text-gray-300 break-all">
                          {selectedAnomaly.path || 'UNKNOWN_ORIGIN'}
                      </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
                      <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs rounded border border-red-500/50 transition-colors">
                          TERMINATE PROCESS
                      </button>
                      <button className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs rounded border border-blue-500/50 transition-colors">
                          ISOLATE NETWORK
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CybersecurityOverwatchWidget;
