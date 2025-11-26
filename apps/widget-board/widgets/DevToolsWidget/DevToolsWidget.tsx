import React, { useEffect, useState } from 'react';
import { useMCP } from '../../src/hooks/useMCP';
import { useMcpEvent } from '../../src/hooks/useMcpEvent';

interface DevToolsStatus {
    lastScan: string | null;
    repoCount: number;
    brainPath: string;
    isScanning: boolean;
    lastError: string | null;
}

export const DevToolsWidget: React.FC = () => {
    const { send, isLoading } = useMCP();
    const [status, setStatus] = useState<DevToolsStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const fetchStatus = async () => {
        try {
            const result = await send('backend', 'devtools-status', {});
            setStatus(result);
        } catch (error) {
            console.error('Failed to fetch DevTools status:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Listen for scan events
    useMcpEvent('devtools:scan:started', () => {
        setLogs(prev => ['Scan started...', ...prev]);
        fetchStatus();
    });

    useMcpEvent('devtools:scan:completed', (payload: any) => {
        setLogs(prev => ['Scan completed!', ...prev]);
        if (payload.output) {
            // Add output lines to log
            const lines = payload.output.split('\n').slice(0, 5); // First 5 lines
            setLogs(prev => [...lines, ...prev]);
        }
        fetchStatus();
    });

    useMcpEvent('devtools:scan:failed', (payload: any) => {
        setLogs(prev => [`Scan failed: ${payload.error}`, ...prev]);
        fetchStatus();
    });

    const handleScan = async () => {
        setLoading(true);
        try {
            await send('backend', 'devtools-scan', {});
        } catch (error) {
            console.error('Scan failed to start:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        setLoading(true);
        try {
            const result = await send('backend', 'devtools-validate', {});
            setLogs(prev => [`Validation Result:\n${result.output}`, ...prev]);
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-4 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    🛡️ DevTools Guardian
                </h2>
                <div className="text-xs text-gray-400">
                    {status?.brainPath ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-400">Repositories</div>
                    <div className="text-2xl font-bold text-blue-400">{status?.repoCount || 0}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-400">Last Scan</div>
                    <div className="text-sm font-mono text-green-400">
                        {status?.lastScan ? new Date(status.lastScan).toLocaleDateString() : 'Never'}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleScan}
                    disabled={loading || status?.isScanning}
                    className={`flex-1 py-2 px-4 rounded font-bold transition-colors ${status?.isScanning
                        ? 'bg-yellow-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {status?.isScanning ? 'Scanning...' : 'Scan GitHub'}
                </button>
                <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded font-bold transition-colors"
                >
                    Validate
                </button>
            </div>

            {/* Logs */}
            <div className="flex-1 bg-black rounded p-2 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
                {logs.length === 0 ? (
                    <span className="text-gray-600">No activity logs...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-gray-800 pb-1">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DevToolsWidget;
