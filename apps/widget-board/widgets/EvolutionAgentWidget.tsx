import React, { useState, useEffect } from 'react';

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

const EvolutionAgentWidget: React.FC = () => {
  const [agentId, setAgentId] = useState('procurement-agent');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAgentData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load current prompt
      const promptResponse = await fetch(`http://localhost:3001/api/evolution/prompt/${agentId}`);

      if (promptResponse.ok) {
        const promptData = await promptResponse.json();
        setCurrentPrompt(promptData.prompt);
      } else {
        setCurrentPrompt(null);
      }

      // Load recent runs
      const runsResponse = await fetch(
        `http://localhost:3001/api/evolution/runs/${agentId}?limit=5`
      );

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        setRecentRuns(runsData.runs || []);
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
    <div
      style={{
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        🧬 Evolution & KPI Monitor
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Agent ID</label>
        <select
          value={agentId}
          onChange={e => setAgentId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '14px',
          }}
        >
          <option value="procurement-agent">Procurement Agent</option>
          <option value="cma-agent">CMA Agent</option>
          <option value="srag-agent">SRAG Agent</option>
          <option value="pal-agent">PAL Agent</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#ff3333',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          Loading agent data...
        </div>
      ) : (
        <>
          {/* Current Prompt */}
          {currentPrompt ? (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Current Prompt</h3>
                <div
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  v{currentPrompt.version}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '4px',
                  padding: '12px',
                  fontSize: '13px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {currentPrompt.promptText}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                Created by {currentPrompt.createdBy} •{' '}
                {new Date(currentPrompt.createdAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                marginBottom: '20px',
                color: '#888',
                fontSize: '14px',
              }}
            >
              No prompt found for this agent
            </div>
          )}

          {/* KPI Status */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Performance Status
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '10px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                  Avg KPI Delta
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: avgKpi >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {avgKpi >= 0 ? '+' : ''}
                  {(avgKpi * 100).toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: needsRefinement ? '#dc2626' : '#10b981',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontSize: '12px', marginBottom: '5px' }}>Status</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {needsRefinement ? '⚠️ Needs Refinement' : '✅ Performing Well'}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Runs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Recent Runs ({recentRuns.length})
            </h3>
            {recentRuns.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '4px',
                  color: '#888',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                No runs recorded yet
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#2a2a2a',
                  borderRadius: '4px',
                  padding: '10px',
                  overflowY: 'auto',
                }}
              >
                {recentRuns.map(run => (
                  <div
                    key={run.id}
                    style={{
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${run.kpi_delta >= 0 ? '#10b981' : '#ef4444'}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{run.kpi_name}</span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: run.kpi_delta >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {run.kpi_delta >= 0 ? '+' : ''}
                        {(run.kpi_delta * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      Prompt v{run.prompt_version} • {new Date(run.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EvolutionAgentWidget;
