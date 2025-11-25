/**
 * Autonomous System Admin Dashboard
 * 
 * Real-time monitoring of autonomous intelligence system
 */

import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { MainLayout } from './MainLayout';

interface Source {
    name: string;
    type: string;
    healthy: boolean;
    score: number;
    capabilities: string[];
    estimatedLatency?: number;
    costPerQuery?: number;
}

interface AgentStats {
    totalDecisions: number;
    averageConfidence: number;
    topSources: { source: string; count: number }[];
}

export const AdminDashboard: React.FC = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [systemHealth, setSystemHealth] = useState<{
        status: string;
        healthySourcesCount: number;
        totalSourcesCount: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Fetch data
    const fetchData = async () => {
        try {
            const [sourcesRes, statsRes, healthRes] = await Promise.all([
                fetch('/api/mcp/autonomous/sources'),
                fetch('/api/mcp/autonomous/stats'),
                fetch('/api/mcp/autonomous/health')
            ]);

            const sourcesData = await sourcesRes.json();
            const statsData = await statsRes.json();
            const healthData = await healthRes.json();

            setSources(sourcesData.sources || []);
            setStats(statsData);
            setSystemHealth(healthData);
            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Use setTimeout to avoid synchronous setState
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 0);

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return (
            <div className="admin-dashboard loading">
                <div className="spinner"></div>
                <p>Loading autonomous system status...</p>
            </div>
        );
    }

    const headerActions = (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                🔄 Refresh
            </button>
        </div>
    );

    return (
        <MainLayout title="Autonomous Intelligence Dashboard" headerActions={headerActions}>
            <div className="admin-dashboard">
                {/* System Health Overview */}
                <section className="health-overview">
                    <div className={`health-card ${systemHealth?.status}`}>
                        <h2>System Status</h2>
                        <div className="status-indicator">
                            {systemHealth?.status === 'healthy' ? '✅' : '⚠️'}
                            <span className="status-text">{systemHealth?.status?.toUpperCase()}</span>
                        </div>
                        <div className="health-stats">
                            <div className="stat">
                                <span className="label">Healthy Sources</span>
                                <span className="value">
                                    {systemHealth?.healthySourcesCount} / {systemHealth?.totalSourcesCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    {stats && (
                        <div className="health-card">
                            <h2>Agent Intelligence</h2>
                            <div className="health-stats">
                                <div className="stat">
                                    <span className="label">Total Decisions</span>
                                    <span className="value">{stats.totalDecisions.toLocaleString()}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Avg Confidence</span>
                                    <span className="value">
                                        {(stats.averageConfidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Data Sources */}
                <section className="sources-section">
                    <h2>Data Sources ({sources.length})</h2>
                    <div className="sources-grid">
                        {sources.map(source => (
                            <div key={source.name} className={`source-card ${source.healthy ? 'healthy' : 'unhealthy'}`}>
                                <div className="source-header">
                                    <h3>{source.name}</h3>
                                    <span className={`status-badge ${source.healthy ? 'healthy' : 'unhealthy'}`}>
                                        {source.healthy ? '✅ Healthy' : '❌ Unhealthy'}
                                    </span>
                                </div>
                                <div className="source-details">
                                    <div className="detail">
                                        <span className="label">Type:</span>
                                        <span className="value">{source.type}</span>
                                    </div>
                                    {source.estimatedLatency !== undefined && (
                                        <div className="detail">
                                            <span className="label">Latency:</span>
                                            <span className="value">{source.estimatedLatency}ms</span>
                                        </div>
                                    )}
                                    {source.costPerQuery !== undefined && (
                                        <div className="detail">
                                            <span className="label">Cost:</span>
                                            <span className="value">
                                                {source.costPerQuery === 0 ? 'Free' : `$${source.costPerQuery.toFixed(4)}`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="detail">
                                        <span className="label">Health Score:</span>
                                        <span className="value">{(source.score * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="capabilities">
                                    <span className="label">Capabilities:</span>
                                    <div className="capability-tags">
                                        {source.capabilities.slice(0, 3).map((cap, idx) => (
                                            <span key={idx} className="capability-tag">{cap}</span>
                                        ))}
                                        {source.capabilities.length > 3 && (
                                            <span className="capability-tag more">
                                                +{source.capabilities.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Top Sources */}
                {stats && stats.topSources.length > 0 && (
                    <section className="top-sources-section">
                        <h2>Most Used Sources</h2>
                        <div className="top-sources-list">
                            {stats.topSources.map((item, idx) => (
                                <div key={idx} className="top-source-item">
                                    <span className="rank">#{idx + 1}</span>
                                    <span className="source-name">{item.source}</span>
                                    <span className="usage-count">{item.count} queries</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Learning Status */}
                <section className="learning-section">
                    <h2>🧠 Cognitive Memory Status</h2>
                    <div className="learning-metrics">
                        <div className="metric-card">
                            <h3>Pattern Learning</h3>
                            <p className="metric-status">✅ Active</p>
                            <p className="metric-description">
                                Recording query patterns and usage statistics
                            </p>
                        </div>
                        <div className="metric-card">
                            <h3>Failure Learning</h3>
                            <p className="metric-status">✅ Active</p>
                            <p className="metric-description">
                                Tracking failures and learning recovery paths
                            </p>
                        </div>
                        <div className="metric-card">
                            <h3>Self-Healing</h3>
                            <p className="metric-status">✅ Active</p>
                            <p className="metric-description">
                                Auto-recovery and circuit breakers enabled
                            </p>
                        </div>
                        <div className="metric-card">
                            <h3>Predictive Pre-fetch</h3>
                            <p className="metric-status">✅ Active</p>
                            <p className="metric-description">
                                Anticipating widget needs based on patterns
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};
