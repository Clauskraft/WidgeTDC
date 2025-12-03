/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    COGNITIVE NODE - VISUAL CORTEX                         ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Real-time visualization of the Neural Bridge system health               ║
 * ║  Handover #007 - Visual Cortex Activation                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useState, useCallback } from 'react';
import { buildApiUrl } from '../utils/api';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface CortexStatus {
    brain: {
        connected: boolean;
        nodes: number;
        relationships: number;
        latencyMs: number;
        provider: string;
        lastCheck: string;
    };
    immune_system: {
        status: string;
        active_services: string[];
        unhealthy_services: string[];
        uptime: number;
        lastIncident: string | null;
    };
    timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const CognitiveNode: React.FC = () => {
    const [status, setStatus] = useState<CortexStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const resp = await fetch(buildApiUrl('/cortex/status'));
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }
            const data: CortexStatus = await resp.json();
            setStatus(data);
            setError(null);
            setLastUpdate(new Date());
        } catch (e: any) {
            setError(e.message);
            // Keep last known status visible but show error
        }
    }, []);

    // Poll every 5 seconds
    useEffect(() => {
        fetchStatus(); // Initial fetch
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Determine health state
    const isConnected = status?.brain.connected ?? false;
    const healthStatus = status?.immune_system.status ?? 'UNKNOWN';
    const isHealthy = isConnected && healthStatus === 'HEALTHY';

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <div className={`
            p-4 rounded-lg h-full transition-all duration-300
            ${isConnected ? 'bg-gray-800' : 'bg-red-900 animate-pulse'}
        `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <span className={`
                        w-3 h-3 rounded-full
                        ${isHealthy ? 'bg-green-500' : isConnected ? 'bg-yellow-500' : 'bg-red-500'}
                        ${!isConnected && 'animate-ping'}
                    `} />
                    🧠 Cortex Status
                </h2>
                {lastUpdate && (
                    <span className="text-xs text-gray-500">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-2 bg-red-800/50 border border-red-600 rounded text-red-200 text-sm">
                    ⚠️ Connection Error: {error}
                </div>
            )}

            {/* Brain Status */}
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">CLOUD CORTEX</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/50 p-2 rounded">
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                        <span className="text-gray-400">Provider:</span>
                        <span className="ml-2 font-mono text-blue-400">
                            {status?.brain.provider || 'N/A'}
                        </span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                        <span className="text-gray-400">Nodes:</span>
                        <span className="ml-2 font-mono text-cyan-400 text-lg font-bold">
                            {status?.brain.nodes?.toLocaleString() || '0'}
                        </span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                        <span className="text-gray-400">Relations:</span>
                        <span className="ml-2 font-mono text-purple-400">
                            {status?.brain.relationships?.toLocaleString() || '0'}
                        </span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded col-span-2">
                        <span className="text-gray-400">Latency:</span>
                        <span className={`ml-2 font-mono ${
                            (status?.brain.latencyMs || 0) < 100 ? 'text-green-400' :
                            (status?.brain.latencyMs || 0) < 500 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                            {status?.brain.latencyMs || 0}ms
                        </span>
                    </div>
                </div>
            </div>

            {/* Immune System Status */}
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">IMMUNE SYSTEM</h3>
                <div className="bg-gray-700/50 p-2 rounded mb-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 font-mono ${
                        healthStatus === 'HEALTHY' ? 'text-green-400' :
                        healthStatus === 'DEGRADED' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                        {healthStatus}
                    </span>
                </div>
                
                {/* Active Services */}
                {status?.immune_system.active_services && status.immune_system.active_services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {status.immune_system.active_services.map((service, i) => (
                            <span key={i} className="px-2 py-1 bg-green-800/30 text-green-400 text-xs rounded">
                                ✓ {service}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Unhealthy Services */}
                {status?.immune_system.unhealthy_services && status.immune_system.unhealthy_services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {status.immune_system.unhealthy_services.map((service, i) => (
                            <span key={i} className="px-2 py-1 bg-red-800/30 text-red-400 text-xs rounded">
                                ✗ {service}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Critical Alert */}
            {!isConnected && (
                <div className="mt-4 p-3 bg-red-800 border-2 border-red-500 rounded-lg text-center">
                    <span className="text-2xl">🚨</span>
                    <p className="text-red-100 font-bold mt-1">CORTEX OFFLINE</p>
                    <p className="text-red-200 text-sm">Neural bridge severed. Check Neo4j connection.</p>
                </div>
            )}
        </div>
    );
};

export default CognitiveNode;
