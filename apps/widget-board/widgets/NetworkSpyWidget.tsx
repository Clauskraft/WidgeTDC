import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Shield, Globe, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { useMCP } from '../src/hooks/useMCP';
import { useWidgetSync } from '../src/hooks/useWidgetSync';

interface ConnectionData {
    provider: string;
    process: string;
    destination: string;
    port: number;
    status: 'established' | 'listening' | 'close_wait';
}

interface NetworkData {
    connections: ConnectionData[];
    stats: Record<string, number>;
    timestamp?: string;
}

const LOGO_COLORS: Record<string, string> = {
    'Google': 'bg-blue-500',
    'Microsoft': 'bg-blue-400',
    'Amazon': 'bg-orange-500',
    'Cloudflare': 'bg-yellow-500',
    'Unknown': 'bg-gray-500'
};

const NetworkSpyWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
    const { send } = useMCP();
    const [data, setData] = useState<NetworkData>({ connections: [], stats: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync state
    useWidgetSync(widgetId, {
        activeConnections: data.connections.length,
        topProvider: Object.keys(data.stats)[0] || 'None'
    });

    const fetchNetworkData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Call backend tool (future implementation)
            const response = await send('agent-orchestrator', 'widgets.network.scan', {});
            if (response && response.data) {
                setData(response.data);
            } else {
                // No data available
                setData({ connections: [], stats: {} });
            }
        } catch (err) {
            console.warn('Network scan failed:', err);
            setError('Network Agent not connected');
        } finally {
            setLoading(false);
        }
    }, [send]);

    useEffect(() => {
        fetchNetworkData();
        const interval = setInterval(fetchNetworkData, 5000);
        return () => clearInterval(interval);
    }, [fetchNetworkData]);

    const sortedProviders = Object.entries(data.stats).sort((a, b) => b[1] - a[1]);

    return (
        <div className="h-full flex flex-col" data-testid="network-spy-widget">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#00B5CB]" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Network Spy</h3>
                        <p className="text-xs text-gray-400">Active Connections</p>
                    </div>
                </div>
                <button 
                    onClick={fetchNetworkData}
                    disabled={loading}
                    className={`p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors ${loading ? 'animate-spin text-[#00B5CB]' : ''}`}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Status Board */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#0B3E6F]/20 rounded-lg p-2 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Active</p>
                    <p className="text-lg font-bold text-green-400">{data.connections.filter(c => c.status === 'established').length}</p>
                </div>
                <div className="bg-[#0B3E6F]/20 rounded-lg p-2 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Listening</p>
                    <p className="text-lg font-bold text-blue-400">{data.connections.filter(c => c.status === 'listening').length}</p>
                </div>
                <div className="bg-[#0B3E6F]/20 rounded-lg p-2 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Blocked</p>
                    <p className="text-lg font-bold text-red-400">0</p>
                </div>
            </div>

            {/* Connection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
                        <Wifi size={32} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">{error}</p>
                        <p className="text-xs mt-1">Start Network Agent i backend</p>
                    </div>
                ) : sortedProviders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
                        <Globe size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Ingen aktivitet</p>
                    </div>
                ) : (
                    sortedProviders.map(([provider, count]) => (
                        <div key={provider} className="relative group bg-[#0B3E6F]/20 rounded-lg overflow-hidden">
                            <div
                                className={`absolute inset-0 opacity-10 transition-all duration-500 ${LOGO_COLORS[provider] || 'bg-gray-500'}`}
                                style={{ width: `${(count / data.connections.length) * 100}%` }}
                            />
                            <div className="relative flex justify-between items-center p-3 z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${LOGO_COLORS[provider] || 'bg-gray-500'}`} />
                                    <span className="font-medium text-sm text-gray-200">{provider}</span>
                                </div>
                                <span className="text-xs font-mono text-gray-400">{count} conn</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NetworkSpyWidget;
