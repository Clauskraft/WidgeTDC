import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, Plus, AlertCircle, CheckCircle2, Clock, Move } from 'lucide-react';
import AcrylicCard from '../../components/AcrylicCard';
import { usePlatform } from '../platform/core/PlatformContext';
import './AgentMonitorWidget.css';

interface Agent {
    id: string;
    name: string;
    agent_type: string;
    block_number: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
    story_points: number;
}

export const AgentMonitorWidget: React.FC = () => {
    const { agentService } = usePlatform();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            const agentsData = await agentService.getAgentStatus();
            // Use setTimeout to avoid synchronous setState
            setTimeout(() => {
                setAgents(agentsData);
            }, 0);
        };

        // Use setTimeout to avoid synchronous setState
        setTimeout(() => {
            fetchStatus();
        }, 0);

        // Subscribe to real-time updates via WebSocket
        const unsubscribe = agentService.subscribeToStatus((updatedAgents) => {
            setTimeout(() => {
                setAgents(updatedAgents);
            }, 0);
        });

        return () => unsubscribe();
    }, [agentService]);

    const getStatusClass = (status: Agent['status']) => {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'running': return 'status-running';
            case 'failed': return 'status-failed';
            default: return 'status-idle';
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
        setAgents(prev => prev.map(a =>
            a.id === agentId ? { ...a, status: 'running' as const } : a
        ));

        const success = await agentService.triggerAgent(agentId);

        if (!success) {
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
            isDarkMode={false}
        >
            <div className="agent-monitor-container">
                <div className="agent-list">
                    <AnimatePresence>
                        {agents.map((agent, index) => (
                            <motion.div
                                key={agent.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="agent-item"
                            >
                                <div className="agent-icon">
                                    <Move size={14} />
                                </div>

                                <div className="agent-block-number">
                                    {agent.block_number}
                                </div>

                                <div className="agent-details">
                                    <div className="agent-header">
                                        <h4 className="agent-name">{agent.name}</h4>
                                        <span className={`agent-status-badge ${getStatusClass(agent.status)}`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    <div className="agent-meta">
                                        <span className="truncate">{agent.agent_type}</span>
                                        <span>•</span>
                                        <span>{agent.story_points} SP</span>
                                    </div>
                                </div>

                                <div className="agent-actions">
                                    <button className="action-button" title="Settings">
                                        <Settings size={14} />
                                    </button>
                                    {agent.status === 'idle' && (
                                        <button
                                            onClick={() => triggerAgent(agent.id)}
                                            className="action-button trigger-button"
                                            title="Trigger Agent"
                                        >
                                            <Play size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className={`agent-status-icon ${getStatusClass(agent.status)}`}>
                                    {getStatusIcon(agent.status)}
                                </div>

                                {agent.status === 'running' && (
                                    <motion.div
                                        className="progress-bar"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 10, ease: "linear" }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="footer-stats">
                    <span>Total Agents: {agents.length}</span>
                    <span>Total SP: {agents.reduce((acc, curr) => acc + curr.story_points, 0)}</span>
                </div>
            </div>
        </AcrylicCard>
    );
};

export default AgentMonitorWidget;
