import React, { useState, useEffect } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface Prompt {
  agentId: string;
  version: number;
  promptText: string;
  createdAt: string;
  createdBy: string;
}

interface AgentRun {
  id: number;
  agent_id: string;
  prompt_version: number;
  kpi_name: string;
  kpi_delta: number;
  created_at: string;
}

const EvolutionAgentWidget: React.FC<{ widgetId?: string }> = () => {
  const [agentId, setAgentId] = useState('procurement-agent');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAgentData = async () => {
    setLoading(true);
    setError('');

    try {
      // Use MCP tool: evolution.analyze-prompts
      const response = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'evolution.analyze-prompts',
          payload: {
            agentId,
            limit: 5,
          },
          context: {
            orgId: 'org-1',
            userId: 'user-1',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Set current prompt from analysis
        if (data.latestPrompt) {
          setCurrentPrompt({
            agentId: data.agentId,
            version: data.latestPrompt.version,
            promptText: data.latestPrompt.text,
            createdAt: data.latestPrompt.createdAt,
            createdBy: 'system',
          });
        } else {
          setCurrentPrompt(null);
        }

        // Set recent runs from analysis
        if (data.recentRuns) {
          setRecentRuns(data.recentRuns.map((run: any) => ({
            id: run.runId,
            agent_id: data.agentId,
            prompt_version: data.latestPrompt?.version || 1,
            kpi_name: 'Performance',
            kpi_delta: run.kpiDelta,
            created_at: run.timestamp,
          })));
        }
      } else {
        // Mock data fallback for demo
        setCurrentPrompt({
            agentId: agentId,
            version: 42,
            promptText: "You are an optimized procurement agent. Focus on cost reduction while maintaining supplier relationships...",
            createdAt: new Date().toISOString(),
            createdBy: 'EvolutionEngine'
        });
        setRecentRuns([
            { id: 1, agent_id: agentId, prompt_version: 42, kpi_name: 'Savings', kpi_delta: 0.15, created_at: new Date().toISOString() },
            { id: 2, agent_id: agentId, prompt_version: 41, kpi_name: 'Savings', kpi_delta: 0.08, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const calculateAverageKpi = () => {
    if (recentRuns.length === 0) return 0;
    const sum = recentRuns.reduce((acc, run) => acc + run.kpi_delta, 0);
    return sum / recentRuns.length;
  };

  const avgKpi = calculateAverageKpi();
  const needsRefinement = avgKpi < 0;

  return (
    <MatrixWidgetWrapper 
        title="Evolution & KPI Monitor"
        controls={
            <button onClick={loadAgentData} className="hover:text-[#00B5CB] transition-colors">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
        }
    >
      <div className="flex flex-col h-full gap-4">
        {/* Agent Selector */}
        <div className="relative">
            <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#00B5CB]"
            >
            <option value="procurement-agent">Procurement Agent</option>
            <option value="cma-agent">CMA Agent</option>
            <option value="srag-agent">SRAG Agent</option>
            <option value="pal-agent">PAL Agent</option>
            </select>
        </div>

        {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
            </div>
        )}

        {/* KPI Status */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] text-gray-400 uppercase mb-1">Avg KPI Delta</div>
                <div className={`text-2xl font-bold ${avgKpi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {avgKpi >= 0 ? '+' : ''}{(avgKpi * 100).toFixed(1)}%
                </div>
            </div>
            <div className={`bg-white/5 border rounded-xl p-3 flex flex-col justify-center ${needsRefinement ? 'border-red-500/30' : 'border-green-500/30'}`}>
                <div className="text-[10px] text-gray-400 uppercase mb-1">Status</div>
                <div className="flex items-center gap-2 font-semibold text-sm text-white">
                    {needsRefinement ? <AlertTriangle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-400" />}
                    {needsRefinement ? 'Needs Refinement' : 'Performing Well'}
                </div>
            </div>
        </div>

        {/* Current Prompt */}
        <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                Current Prompt
                {currentPrompt && <span className="bg-[#00B5CB]/20 text-[#00B5CB] px-1.5 rounded text-[9px]">v{currentPrompt.version}</span>}
            </h3>
            
            {currentPrompt ? (
                <div className="bg-black/20 border border-white/10 rounded-lg p-3 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {currentPrompt.promptText}
                    </p>
                    <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-gray-500 flex justify-between">
                        <span>By: {currentPrompt.createdBy}</span>
                        <span>{new Date(currentPrompt.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500/50 text-xs border border-dashed border-white/10 rounded-lg">
                    No active prompt
                </div>
            )}
        </div>

        {/* Recent Runs List */}
        <div className="h-1/3 flex flex-col">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Runs</h3>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {recentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                        <div className={`w-1 h-8 rounded-full ${run.kpi_delta >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                            <div className="text-xs font-medium text-gray-200">{run.kpi_name}</div>
                            <div className="text-[10px] text-gray-500">v{run.prompt_version} • {new Date(run.created_at).toLocaleTimeString()}</div>
                        </div>
                    </div>
                    <span className={`text-xs font-bold ${run.kpi_delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {run.kpi_delta >= 0 ? '+' : ''}{(run.kpi_delta * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
                {recentRuns.length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-500">No runs recorded</div>
                )}
             </div>
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default EvolutionAgentWidget;
