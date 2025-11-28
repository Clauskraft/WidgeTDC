// Executive Risk Canvas - Executive Summary Panel
// Quick overview panel for board meetings

import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Clock,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { RiskSeverity, RiskCluster } from './types';

interface ExecutiveSummaryPanelProps {
  summary: {
    totalArrAtRisk: number;
    criticalIncidents: number;
    pendingDecisions: number;
    complianceScore: number;
    topRiskClusters: Array<{
      clusterId: string;
      name: string;
      severity: RiskSeverity;
      arrExposure: number;
    }>;
  };
  clusters: RiskCluster[];
  onClusterClick: (clusterId: string) => void;
  onExpandPanel?: () => void;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<RiskSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

export const ExecutiveSummaryPanel: React.FC<ExecutiveSummaryPanelProps> = ({
  summary,
  clusters,
  onClusterClick,
  onExpandPanel,
  compact = false,
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} mio`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toString();
  };

  // Calculate trends (mock data - would come from real analytics)
  const trends = {
    arrTrend: -12, // % change
    incidentsTrend: +2,
    decisionsTrend: -1,
    complianceTrend: +3,
  };

  if (compact) {
    return (
      <div className="flex items-center gap-6 px-4 py-2 bg-black/20 border-b border-white/10">
        <MetricBadge
          icon={<AlertTriangle className="w-4 h-4" />}
          value={summary.criticalIncidents}
          label="Critical"
          color="rose"
          trend={trends.incidentsTrend}
        />
        <MetricBadge
          icon={<Clock className="w-4 h-4" />}
          value={summary.pendingDecisions}
          label="Pending"
          color="amber"
          trend={trends.decisionsTrend}
        />
        <MetricBadge
          icon={<DollarSign className="w-4 h-4" />}
          value={formatCurrency(summary.totalArrAtRisk)}
          label="ARR at Risk"
          suffix=" DKK"
          color="cyan"
          trend={trends.arrTrend}
        />
        <MetricBadge
          icon={<Shield className="w-4 h-4" />}
          value={summary.complianceScore}
          suffix="%"
          label="Compliance"
          color="emerald"
          trend={trends.complianceTrend}
        />
        {onExpandPanel && (
          <button
            onClick={onExpandPanel}
            className="ml-auto text-white/40 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Executive Summary</h3>
          <p className="text-xs text-white/50">Real-time risk portfolio overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Last updated: Just now</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<AlertTriangle className="w-6 h-6" />}
            value={summary.criticalIncidents}
            label="Critical Incidents"
            color="rose"
            trend={trends.incidentsTrend}
            trendLabel="vs last week"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6" />}
            value={summary.pendingDecisions}
            label="Pending Decisions"
            color="amber"
            trend={trends.decisionsTrend}
            trendLabel="vs yesterday"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6" />}
            value={formatCurrency(summary.totalArrAtRisk)}
            suffix=" DKK"
            label="Total ARR at Risk"
            color="cyan"
            trend={trends.arrTrend}
            trendLabel="vs last month"
          />
          <MetricCard
            icon={<Shield className="w-6 h-6" />}
            value={summary.complianceScore}
            suffix="%"
            label="Compliance Score"
            color="emerald"
            trend={trends.complianceTrend}
            trendLabel="vs last audit"
          />
        </div>

        {/* Top Risk Clusters */}
        <div>
          <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">
            Top Risk Clusters
          </h4>
          <div className="space-y-2">
            {summary.topRiskClusters.map((cluster, index) => {
              const styles = SEVERITY_STYLES[cluster.severity];
              return (
                <button
                  key={cluster.clusterId}
                  onClick={() => onClusterClick(cluster.clusterId)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${styles.border} ${styles.bg} hover:bg-opacity-40 transition-all group`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white/40">#{index + 1}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{cluster.name}</p>
                      <p className="text-xs text-white/50">
                        {formatCurrency(cluster.arrExposure)} DKK exposure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${styles.bg} ${styles.text}`}>
                      {cluster.severity}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-sm transition-colors">
              <AlertTriangle className="w-4 h-4" />
              Review Critical
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors">
              <Clock className="w-4 h-4" />
              Pending Approvals
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors">
              <FileText className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  value: number | string;
  suffix?: string;
  label: string;
  color: 'rose' | 'amber' | 'cyan' | 'emerald';
  trend?: number;
  trendLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  suffix = '',
  label,
  color,
  trend,
  trendLabel,
}) => {
  const colorClasses = {
    rose: 'text-rose-400 bg-rose-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color]} border border-white/5`}>
      <div className="flex items-start justify-between">
        <div className={colorClasses[color].split(' ')[0]}>{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold text-white">
          {value}{suffix}
        </div>
        <div className="text-xs text-white/50 mt-1">{label}</div>
        {trendLabel && <div className="text-[10px] text-white/30 mt-0.5">{trendLabel}</div>}
      </div>
    </div>
  );
};

// Compact Metric Badge Component
interface MetricBadgeProps {
  icon: React.ReactNode;
  value: number | string;
  suffix?: string;
  label: string;
  color: 'rose' | 'amber' | 'cyan' | 'emerald';
  trend?: number;
}

const MetricBadge: React.FC<MetricBadgeProps> = ({
  icon,
  value,
  suffix = '',
  label,
  color,
  trend,
}) => {
  const colorClasses = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={colorClasses[color]}>{icon}</div>
      <div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-white">{value}{suffix}</span>
          {trend !== undefined && (
            <span className={`text-[10px] ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/40 uppercase">{label}</span>
      </div>
    </div>
  );
};

export default ExecutiveSummaryPanel;
