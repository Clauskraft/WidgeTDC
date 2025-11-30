import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollText,
  RefreshCw,
  Trash2,
  Download,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  WifiOff,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
}

// ============================================
// LOG LEVEL STYLES
// ============================================
const LOG_STYLES: Record<LogLevel, { color: string; icon: React.ReactNode; bg: string }> = {
  info: {
    color: 'text-neon-cyan',
    icon: <Info className="w-4 h-4" />,
    bg: 'bg-neon-cyan/10',
  },
  warn: {
    color: 'text-alert-yellow',
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: 'bg-alert-yellow/10',
  },
  error: {
    color: 'text-alert-red',
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-alert-red/10',
  },
  success: {
    color: 'text-neon-green',
    icon: <CheckCircle className="w-4 h-4" />,
    bg: 'bg-neon-green/10',
  },
  debug: {
    color: 'text-neon-green/50',
    icon: <ScrollText className="w-4 h-4" />,
    bg: 'bg-neon-green/5',
  },
};

// ============================================
// API SERVICE - Real Data Integration
// ============================================
const API_BASE = 'http://localhost:3001';

async function fetchSystemLogs(options?: { 
  level?: LogLevel | 'all'; 
  source?: string;
  limit?: number;
}): Promise<LogEntry[]> {
  try {
    const params = new URLSearchParams();
    if (options?.level && options.level !== 'all') params.set('level', options.level);
    if (options?.source && options.source !== 'all') params.set('source', options.source);
    if (options?.limit) params.set('limit', options.limit.toString());
    
    const url = `${API_BASE}/api/logs${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return (data || []).map((log: LogEntry) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error('[SystemLogs] API fetch failed:', error);
    return [];
  }
}

async function fetchLogSources(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/api/logs/sources`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json() || [];
  } catch (error) {
    console.error('[SystemLogs] Sources fetch failed:', error);
    return ['BACKEND', 'FRONTEND', 'MCP', 'AI_ENGINE'];
  }
}

// ============================================
// WEBSOCKET CONNECTION FOR REAL-TIME LOGS
// ============================================
function useLogWebSocket(onLog: (log: LogEntry) => void, enabled: boolean = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    
    const connect = () => {
      try {
        const ws = new WebSocket('ws://localhost:3001/api/logs/stream');
        
        ws.onopen = () => {
          console.log('[SystemLogs] WebSocket connected');
          setConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const log = JSON.parse(event.data);
            onLog({
              ...log,
              timestamp: new Date(log.timestamp),
            });
          } catch (e) {
            console.error('[SystemLogs] Parse error:', e);
          }
        };
        
        ws.onclose = () => {
          console.log('[SystemLogs] WebSocket disconnected');
          setConnected(false);
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('[SystemLogs] WebSocket error:', error);
          setConnected(false);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('[SystemLogs] WebSocket connection failed:', error);
        setConnected(false);
      }
    };
    
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled, onLog]);

  return { connected };
}

// ============================================
// SYSTEM LOGS VIEW COMPONENT
// ============================================
export default function SystemLogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [sources, setSources] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Handle new log from WebSocket
  const handleNewLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [log, ...prev].slice(0, 500));
  }, []);

  // WebSocket connection for real-time logs
  const { connected: wsConnected } = useLogWebSocket(handleNewLog, true);

  // Load initial logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [logsData, sourcesData] = await Promise.all([
        fetchSystemLogs({ limit: 200 }),
        fetchLogSources(),
      ]);
      setLogs(logsData);
      setSources(sourcesData);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Auto-scroll to newest logs (top of container)
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    return true;
  });

  // Export logs
  const handleExport = () => {
    const content = filteredLogs
      .map((log) => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const handleClear = () => {
    setLogs([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neon-green/20">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-neon-green" />
          <span className="text-neon-green font-medium">SYSTEM LOGS</span>
          <span className="text-xs text-neon-green/50">
            {filteredLogs.length} entries
          </span>
          {/* Connection Status */}
          <span className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-neon-green/50' : 'text-alert-red/50'}`}>
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-neon-green animate-pulse' : 'bg-alert-red'}`} />
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-neon-green/50" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
              className="bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-xs text-neon-green focus:outline-none focus:border-neon-green/60"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-xs text-neon-green focus:outline-none focus:border-neon-green/60"
          >
            <option value="all">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors disabled:opacity-50"
            title="Export Logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="p-2 rounded hover:bg-alert-red/10 text-neon-green/60 hover:text-alert-red transition-colors disabled:opacity-50"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mx-3 mt-3 p-2 bg-alert-red/10 border border-alert-red/30 rounded flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-alert-red" />
          <span className="text-xs text-alert-red">{apiError}</span>
          <span className="text-xs text-alert-red/50 ml-auto">Connect backend for live logs</span>
        </div>
      )}

      {/* Logs Container */}
      <div ref={logsContainerRef} className="flex-1 overflow-y-auto p-3 font-mono text-sm">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
              <span className="text-neon-green/70">Loading system logs...</span>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neon-green/50 gap-2">
            <ScrollText className="w-12 h-12" />
            <span>No logs available</span>
            <span className="text-xs">Waiting for backend connection</span>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => {
              const style = LOG_STYLES[log.level];
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 p-2 rounded ${style.bg} hover:bg-opacity-20 transition-colors`}
                >
                  <span className={style.color}>{style.icon}</span>
                  <span className="text-neon-green/40 text-xs whitespace-nowrap">
                    {log.timestamp.toLocaleTimeString('da-DK', { hour12: false })}
                  </span>
                  <span className="text-neon-cyan text-xs font-bold whitespace-nowrap">
                    [{log.source}]
                  </span>
                  <span className={`${style.color} flex-1`}>{log.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-neon-green/20 text-xs">
        <div className="flex items-center gap-4 text-neon-green/50">
          <span>
            {logs.filter((l) => l.level === 'error').length} errors
          </span>
          <span>
            {logs.filter((l) => l.level === 'warn').length} warnings
          </span>
        </div>
        <label className="flex items-center gap-2 text-neon-green/50 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="accent-neon-green"
          />
          Auto-scroll
        </label>
      </div>
    </div>
  );
}
