// Strategic Cockpit - Agent Council Component
// Dock at bottom showing AI agent status

import React from 'react';
import {
  Shield,
  Scale,
  Gavel,
  Database,
  Network,
  Palette,
  Activity,
  AlertTriangle,
  Pause,
  XCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CockpitAgent, AgentStatus, AGENT_STATUS_COLORS } from './types';
import { useCockpitStore } from './cockpitStore';

interface AgentCouncilProps {
  agents: CockpitAgent[];
  isExpanded: boolean;
  onToggle: () => void;
}

const ROLE_ICONS: Record<CockpitAgent['role'], React.FC<{ className?: string }>> = {
  security: Shield,
  governance: Scale,
  legal: Gavel,
  data: Database,
  orchestrator: Network,
  creative: Palette,
};

const STATUS_ICONS: Record<AgentStatus, React.FC<{ className?: string }>> = {
  idle: Pause,
  active: Activity,
  warning: AlertTriangle,
  blocked: XCircle,
};

export const AgentCouncil: React.FC<AgentCouncilProps> = ({
  agents,
  isExpanded,
  onToggle,
}) => {
  const formatTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isExpanded ? 'h-32' : 'h-12'
      }`}
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* Neon accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="relative h-full max-w-[1800px] mx-auto px-4">
        {/* Header bar - always visible */}
        <div className="h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Agent-Rådet</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            
            {/* Quick status indicators */}
            <div className="flex items-center gap-2 ml-4">
              {agents.map((agent) => {
                const statusColor = AGENT_STATUS_COLORS[agent.status];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-1.5"
                    title={`${agent.name}: ${agent.statusMessage || agent.status}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'animate-pulse' : ''
                      }`}
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="text-xs text-white/40">{agent.name.charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>
              {agents.filter((a) => a.status === 'active').length} aktive ·{' '}
              {agents.reduce((sum, a) => sum + (a.metrics?.tasksInProgress || 0), 0)} opgaver
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WebSocket Connected
            </span>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="flex gap-3 pb-3 overflow-x-auto">
            {agents.map((agent) => {
              const RoleIcon = ROLE_ICONS[agent.role];
              const StatusIcon = STATUS_ICONS[agent.status];
              const statusColor = AGENT_STATUS_COLORS[agent.status];

              return (
                <div
                  key={agent.id}
                  className="flex-shrink-0 w-56 bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                >
                  {/* Agent header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded"
                        style={{ backgroundColor: `${statusColor}20` }}
                      >
                        <RoleIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
                      </div>
                      <span className="text-sm font-medium text-white">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusIcon className="w-3 h-3" style={{ color: statusColor }} />
                      <span
                        className="text-[10px] font-bold uppercase"
                        style={{ color: statusColor }}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Agent content */}
                  <div className="px-3 py-2">
                    {agent.currentTask ? (
                      <p className="text-xs text-white/70 line-clamp-2">{agent.currentTask}</p>
                    ) : (
                      <p className="text-xs text-white/40 italic">{agent.statusMessage}</p>
                    )}
                    
                    {/* Metrics */}
                    {agent.metrics && (
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                        <span>{agent.metrics.tasksCompleted} done</span>
                        <span>{agent.metrics.tasksInProgress} in progress</span>
                        {agent.metrics.alertsRaised > 0 && (
                          <span className="text-amber-400">
                            {agent.metrics.alertsRaised} alerts
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCouncil;
