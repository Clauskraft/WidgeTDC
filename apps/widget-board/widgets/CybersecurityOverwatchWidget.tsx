import React, { useMemo, useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Shield, AlertOctagon, Activity, Lock, Eye, ExternalLink } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface ThreatAlert {
  id: string;
  vector: string;
  severity: Severity;
  source: string;
  detectedAt: string;
  status: 'Investigating' | 'Contained' | 'Escalated';
  action: string;
  riskScore: number;
}

const THREAT_ALERTS: ThreatAlert[] = [
  {
    id: 'th-1021',
    vector: 'Dark web credential spill',
    severity: 'critical',
    source: 'Darktrace / Intel 471',
    detectedAt: '2025-02-11T06:32:00Z',
    status: 'Escalated',
    action: 'Trigger password rotation and revoke partner tokens',
    riskScore: 91,
  },
  {
    id: 'th-1020',
    vector: 'Anomalt netværkstraffik',
    severity: 'high',
    source: 'NetFlow EU-West',
    detectedAt: '2025-02-10T22:15:00Z',
    status: 'Investigating',
    action: 'Kør isolationsplaybook på affected cluster',
    riskScore: 78,
  },
  {
    id: 'th-1019',
    vector: 'Patch exposure (CVE-2025-1123)',
    severity: 'medium',
    source: 'Vuln Scanner',
    detectedAt: '2025-02-10T09:45:00Z',
    status: 'Contained',
    action: 'Deploy hotfix til rest af EU prod nodes',
    riskScore: 54,
  },
];

const NETWORK_METRICS = [
  { label: 'Egress anomali', value: 27, unit: '%', trend: '+5% d/d', status: 'warning' },
  { label: 'Zero-trust policy', value: 96, unit: '%', trend: '+1% w/w', status: 'success' },
  { label: 'SIEM latency', value: 142, unit: 'ms', trend: '-18% d/d', status: 'success' },
  { label: 'Active investigations', value: 8, unit: '', trend: '+2 cases', status: 'neutral' },
];

const COMPLIANCE_CONTROLS = [
  {
    name: 'GDPR - Art. 32',
    status: 'success',
    detail: 'Kryptering & kontinuitet kontrolleret',
    due: 'Næste audit 15/03',
  },
  {
    name: 'ISO 27001 A.16',
    status: 'warning',
    detail: 'Hændelseslogging skal udvides',
    due: 'Opfølgning 28/02',
  },
  {
    name: 'NIS2 Annex II',
    status: 'critical',
    detail: 'Dokumentation for leverandørkæde',
    due: 'Haster',
  },
];

const severityConfig: Record<Severity, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const CybersecurityOverwatchWidget: React.FC<{ widgetId: string }> = () => {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [autoResponse, setAutoResponse] = useState(true);
  const [retentionMonths, setRetentionMonths] = useState(12);

  const filteredAlerts = useMemo(() => {
    return THREAT_ALERTS.filter(
      alert => severityFilter === 'all' || alert.severity === severityFilter
    );
  }, [severityFilter]);

  return (
    <MatrixWidgetWrapper title="Cybersecurity Overwatch">
      <div className="flex flex-col gap-6">
        
        {/* Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {NETWORK_METRICS.map(metric => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20 transition-colors"
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{metric.label}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-xl font-bold text-white">
                  {metric.value}
                  <span className="text-sm font-normal text-gray-500 ml-0.5">{metric.unit}</span>
                </p>
              </div>
              <span className={`text-[10px] font-medium ${
                metric.status === 'success' ? 'text-emerald-400' : 
                metric.status === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`}>
                  {metric.trend}
              </span>
            </div>
          ))}
        </section>

        {/* Threat Monitoring */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
               <Shield size={16} className="text-[#00B5CB]" />
               <h4 className="text-sm font-semibold text-gray-200">Active Threats</h4>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoResponse ? 'bg-[#00B5CB]' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${autoResponse ? 'translate-x-4' : ''}`} />
                </div>
                <input type="checkbox" checked={autoResponse} onChange={() => setAutoResponse(!autoResponse)} className="hidden" />
                <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">Auto-Response</span>
              </label>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value as Severity | 'all')}
                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#00B5CB]"
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {filteredAlerts.map(alert => {
                const style = severityConfig[alert.severity];
                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-3 transition-all ${style.border} ${style.bg} hover:bg-opacity-20`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                         <AlertOctagon size={14} className={style.text} />
                         <span className="text-xs font-bold text-white">{alert.vector}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/20 ${style.text}`}>
                        {alert.severity}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <Activity size={10} /> {alert.source} • Risk Score: {alert.riskScore}
                    </p>
                    <p className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-white/5 font-mono">
                       👉 {alert.action}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500">{new Date(alert.detectedAt).toLocaleTimeString()} • {alert.status}</span>
                        <button className="text-[10px] flex items-center gap-1 text-[#00B5CB] hover:text-white transition-colors">
                            View Details <ExternalLink size={10} />
                        </button>
                    </div>
                  </div>
                );
            })}
            {filteredAlerts.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
                No alerts matching filter.
              </div>
            )}
          </div>
        </section>

        {/* Compliance Grid */}
        <section>
             <div className="flex items-center gap-2 mb-3">
               <Lock size={16} className="text-[#00B5CB]" />
               <h4 className="text-sm font-semibold text-gray-200">Compliance Status</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
            {COMPLIANCE_CONTROLS.map(control => {
                 const statusColor = control.status === 'success' ? 'bg-emerald-500' : control.status === 'warning' ? 'bg-amber-500' : 'bg-red-500';
                 return (
                    <div
                    key={control.name}
                    className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-semibold text-gray-200">{control.name}</p>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_5px_currentColor]`} />
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">{control.detail}</p>
                        <p className="text-[9px] mt-2 text-[#00B5CB]">{control.due}</p>
                    </div>
                 );
            })}
            </div>
        </section>

        {/* Retention Slider */}
        <section className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                 <Eye size={14} className="text-gray-400" />
                 <h4 className="text-xs font-medium text-gray-300">Log Retention Period</h4>
            </div>
            <span className="text-xs font-bold text-[#00B5CB]">{retentionMonths} Months</span>
          </div>
          <input
            type="range"
            min={6}
            max={36}
            value={retentionMonths}
            onChange={e => setRetentionMonths(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00B5CB] [&::-webkit-slider-thumb]:rounded-full"
          />
        </section>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default CybersecurityOverwatchWidget;
