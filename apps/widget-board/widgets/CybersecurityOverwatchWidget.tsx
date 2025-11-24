import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';

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
  { label: 'Egress anomali', value: 27, unit: '%', trend: '+5% d/d' },
  { label: 'Zero-trust policy coverage', value: 96, unit: '%', trend: '+1% w/w' },
  { label: 'SIEM latency', value: 142, unit: 'ms', trend: '-18% d/d' },
  { label: 'Active investigations', value: 8, unit: '', trend: '+2 cases' },
];

const COMPLIANCE_CONTROLS = [
  {
    name: 'GDPR - Art. 32',
    status: 'grøn',
    detail: 'Kryptering & kontinuitet kontrolleret',
    due: 'Næste audit 15/03',
  },
  {
    name: 'ISO 27001 A.16',
    status: 'gul',
    detail: 'Automatiseret hændelseslogging skal udvides',
    due: 'Opfølgning 28/02',
  },
  {
    name: 'NIS2 Annex II',
    status: 'rød',
    detail: 'Dokumentation for leverandørkæde påkrævet',
    due: 'Haster',
  },
];

const severityColors: Record<Severity, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-rose-600',
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
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-slate-950/70 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Security Operations</p>
            <h3 className="text-xl font-semibold">Cybersecurity Overwatch</h3>
            <p className="text-sm text-white/80">
              Netværk, dark web og compliance monitorering samlet ét sted.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Realtime SLA</p>
            <p className="text-3xl font-bold">99.99%</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <section className="grid grid-cols-2 gap-3">
          {NETWORK_METRICS.map(metric => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">{metric.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-semibold">
                  {metric.value}
                  {metric.unit}
                </p>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="font-semibold">Trusselsovervågning</h4>
              <p className="text-xs text-gray-500">Dark web, netværk og vulnerability feeds</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoResponse}
                  onChange={() => setAutoResponse(v => !v)}
                  className="ms-focusable"
                />
                Auto-respons playbooks
              </label>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value as Severity | 'all')}
                className="ms-focusable border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">Alle severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{alert.vector}</p>
                    <p className="text-xs text-gray-500">{alert.source}</p>
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-semibold text-white px-3 py-1 rounded-full ${severityColors[alert.severity]}`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">{alert.action}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                  <span>ID: {alert.id}</span>
                  <span>Risk score: {alert.riskScore}</span>
                  <span>{new Date(alert.detectedAt).toLocaleString()}</span>
                  <span>Status: {alert.status}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" size="small">
                    Åbn hændelse
                  </Button>
                  <Button variant="subtle" size="small">
                    Del med SOC
                  </Button>
                  <Button variant="subtle" size="small">
                    Exportér evidens
                  </Button>
                </div>
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500 border border-dashed rounded-xl">
                Ingen alarmer på valgt severity-niveau.
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {COMPLIANCE_CONTROLS.map(control => (
            <div
              key={control.name}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-slate-900/60"
            >
              <p className="text-sm font-semibold">{control.name}</p>
              <p className="text-xs text-gray-500">{control.detail}</p>
              <p className="text-xs mt-2 text-gray-400">{control.due}</p>
              <span
                className={`inline-flex mt-3 px-3 py-1 text-xs rounded-full ${
                  control.status === 'grøn'
                    ? 'bg-emerald-100 text-emerald-700'
                    : control.status === 'gul'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                }`}
              >
                Status: {control.status.toUpperCase()}
              </span>
            </div>
          ))}
        </section>

        <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Log retention & audit trail</h4>
              <p className="text-xs text-gray-500">GDPR Art. 30 & SOC2 evidens</p>
            </div>
            <span className="text-sm font-semibold">{retentionMonths} måneder</span>
          </div>
          <input
            type="range"
            min={6}
            max={36}
            value={retentionMonths}
            onChange={e => setRetentionMonths(Number(e.target.value))}
            className="w-full mt-4"
          />
        </section>
      </div>
    </div>
  );
};

export default CybersecurityOverwatchWidget;
