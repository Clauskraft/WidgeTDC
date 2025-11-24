import React, { useEffect, useState } from 'react';

// Simpelt logo map til visuel lir
const LOGO_COLORS: Record<string, string> = {
    'Google': 'bg-blue-500',
    'Adobe': 'bg-red-600',
    'Valve': 'bg-gray-700',
    'Spotify AB': 'bg-green-500',
    'NVIDIA': 'bg-green-400',
    'Microsoft': 'bg-blue-300',
    'Discord Inc': 'bg-indigo-500',
    'Epic Games': 'bg-purple-600',
    'Blizzard': 'bg-blue-700',
    'EA': 'bg-orange-500',
    'Ubisoft': 'bg-blue-600',
    'Zoom': 'bg-blue-400',
    'Slack': 'bg-purple-400',
    'Meta': 'bg-blue-600',
    'Other': 'bg-gray-500'
};

interface ConnectionData {
    provider: string;
    process: string;
    destination: string;
    port: number;
}

interface NetworkData {
    connections: ConnectionData[];
    stats: Record<string, number>;
    timestamp?: string;
}

const NetworkSpyWidget: React.FC<{ widgetId: string }> = () => {
    const [data, setData] = useState<NetworkData>({ connections: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNetworkData = async () => {
            try {
                setError(null);
                const response = await fetch('http://localhost:3001/api/network/spy');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const networkData = await response.json();
                setData(networkData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                console.error('Network spy error:', err);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchNetworkData();

        // Poll every 3 seconds
        const interval = setInterval(fetchNetworkData, 3000);

        return () => clearInterval(interval);
    }, []);

    // Sorter stats så den største synder ligger øverst
    const sortedProviders = (Object.entries(data.stats) as [string, number][]).sort((a, b) => b[1] - a[1]);

    if (loading) {
        return (
            <div className="h-full flex flex-col -m-4">
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        <h3 className="text-lg font-semibold">Network Surveillance</h3>
                    </div>
                    <div className="flex items-center justify-center h-32">
                        <div className="text-sm text-gray-500">Scanning network connections...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col -m-4">
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <h3 className="text-lg font-semibold">Network Surveillance</h3>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <div className="text-sm text-red-600 dark:text-red-400">
                            Error: {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col -m-4">
            <div className="p-4 space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-wider text-gray-400 border-b border-white/10 pb-2">
                    <span>Active Uplinks</span>
                    <span>{data.connections.length} Connection(s)</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar p-1 max-h-64">
                    {sortedProviders.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-8">
                            No active external connections detected
                        </div>
                    ) : (
                        sortedProviders.map(([provider, count]) => (
                            <div key={provider} className="relative group">
                                {/* Baggrundsbar der viser procentdel visuelt */}
                                <div
                                    className={`absolute inset-0 opacity-20 rounded-r transition-all duration-500 ${LOGO_COLORS[provider] || 'bg-gray-500'}`}
                                    style={{ width: `${(count / data.connections.length) * 100}%` }}
                                />

                                <div className="relative flex justify-between items-center p-2 z-10">
                                    <div className="flex items-center gap-2">
                                        {/* Lille farvet prik */}
                                        <div className={`w-2 h-2 rounded-full ${LOGO_COLORS[provider] || 'bg-gray-500'}`} />
                                        <span className="font-bold text-sm text-white">{provider}</span>
                                    </div>
                                    <span className="text-xs font-mono text-gray-300">{count} lines</span>
                                </div>

                                {/* Tooltip / Detail ved hover (hvad sender de?) */}
                                <div className="hidden group-hover:block absolute left-0 top-full w-full bg-black/90 p-2 rounded text-[10px] text-gray-400 z-50 border border-white/20 shadow-xl">
                                    Dominerende proces: <br />
                                    {data.connections.find((c) => c.provider === provider)?.process}.exe
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="text-[9px] text-gray-500 text-center italic">
                    Data is extracted via TCP/IP mapping in real-time.
                    {data.timestamp && (
                        <div>Last scan: {new Date(data.timestamp).toLocaleTimeString('da-DK')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkSpyWidget;

