import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, Plus, AlertCircle, CheckCircle2, Clock, Move } from 'lucide-react';
import AcrylicCard from '../../components/AcrylicCard';

interface Agent {
    id: string;
    name: string;
    agent_type: string;
    block_number: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
    story_points: number;
}

export const AgentMonitorWidget: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/mcp/resources?uri=agents://status');
                const data = await response.json();

                let agentsData = data.data;
                if (!agentsData && data.content) {
                    try {
                        agentsData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                    } catch (e) {
                        console.error("Failed to parse agent status", e);
                    }
                }

                if (Array.isArray(agentsData)) {
                    setAgents(agentsData);
                }
            } catch (e) {
                console.error("Failed to fetch agent status", e);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: Agent['status']) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'running': return 'text-blue-400';
            case 'failed': return 'text-red-400';
            default: return 'text-slate-500';
        }
    };

    const getStatusIcon = (status: Agent['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} />;
            case 'running': return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Clock size={16} /></motion.div>;
            case 'failed': return <AlertCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const triggerAgent = async (agentId: string) => {
        try {
            setAgents(prev => prev.map(a =>
                a.id === agentId ? { ...a, status: 'running' as const } : a
            ));

            const response = await fetch('http://localhost:3001/api/mcp/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool: 'trigger_agent',
                    payload: { agentId }
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Failed to trigger agent:', error);
            setAgents(prev => prev.map(a =>
                a.id === agentId ? { ...a, status: 'failed' as const } : a
            ));
        }
    };

    return (
        <AcrylicCard
            title="Agent Mission Control"
            icon={Settings}
            className="h-full"
            headerAction={
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsOrchestratorRunning(!isOrchestratorRunning)}
                        className={`p-1.5 rounded-lg transition-colors ${isOrchestratorRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                        title={isOrchestratorRunning ? "Pause Orchestration" : "Resume Orchestration"}
                    >
                        {isOrchestratorRunning ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors" title="Add New Agent">
                        <Plus size={16} />
                    </button>
                </div>
            }
        >
            <div className="space-y-2 mt-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                <AnimatePresence>
                    {agents.map((agent, index) => (
                        <motion.div
                            key={agent.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing"
                        >
                            <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                                <Move size={14} />
                            </div>

                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/20 text-xs font-mono text-slate-400">
                                {agent.block_number}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-slate-200 truncate">{agent.name}</h4>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 ${getStatusColor(agent.status)}`}>
                                        {agent.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="truncate">{agent.agent_type}</span>
                                    <span>•</span>
                                    <span>{agent.story_points} SP</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Settings">
                                    <Settings size={14} />
                                </button>
                                {agent.status === 'idle' && (
                                    <button
                                        onClick={() => triggerAgent(agent.id)}
                                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                                        title="Trigger Agent"
                                    >
                                        <Play size={14} />
                                    </button>
                                )}
                            </div>

                            <div className={`ml-1 ${getStatusColor(agent.status)}`}>
                                {getStatusIcon(agent.status)}
                            </div>

                            {agent.status === 'running' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[2px] bg-blue-500/50"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 10, ease: "linear" }}
                                />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
                <span>Total Agents: {agents.length}</span>
                <span>Total SP: {agents.reduce((acc, curr) => acc + curr.story_points, 0)}</span>
            </div>
        </AcrylicCard>
    );
};
