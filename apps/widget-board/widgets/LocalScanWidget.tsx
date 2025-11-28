import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { useMCP } from '../src/hooks/useMCP';
import { useWidgetSync } from '../src/hooks/useWidgetSync';
import { HardDrive, Search, AlertTriangle, FileText, Image as ImageIcon, Shield, RefreshCw, Play, Pause } from 'lucide-react';

interface ScanConfig {
  path: string;
  depth: number;
  keywords: string[];
  intervalMin: number;
}

interface ScanResult {
  name: string;
  sizeBytes: number;
  snippet: string;
  threatScore: number;
  hasImage?: boolean;
  imageAnalysis?: { altText?: string; ocrText?: string; score: number };
  fullPath: string;
}

const DEFAULT_CONFIG: ScanConfig = {
  path: '/tmp',
  depth: 2,
  keywords: ['password', 'secret', 'key', 'token'],
  intervalMin: 30
};

const LocalScanWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { send: mcpSend } = useMCP();
  const [config, setConfig] = useState<ScanConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Sync state to brain
  useWidgetSync(widgetId, {
    isScanning,
    lastScan,
    findingsCount: results.length,
    highRiskCount: results.filter(r => r.threatScore > 7).length
  });

  const triggerScan = useCallback(async () => {
    if (!config.path) return;
    
    setIsScanning(true);
    setError(null);
    
    try {
      // Call DevTools handler in backend
      const response = await mcpSend('agent-orchestrator', 'devtools-scan', {
        path: config.path,
        depth: config.depth,
        keywords: config.keywords
      });
      
      if (response && response.files) {
        setResults(response.files);
        setLastScan(new Date().toLocaleString());
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Kunne ikke scanne. Tjek permissions.');
      // Mock fallback for demo purposes if backend fails
      setResults([]);
    } finally {
      setIsScanning(false);
    }
  }, [mcpSend, config]);

  return (
    <div className="h-full flex flex-col" data-testid="local-scan-widget">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-[#00B5CB]" />
          <div>
            <h3 className="text-lg font-semibold text-white">System Scanner</h3>
            <p className="text-xs text-gray-400">Lokal filsystem sikkerhed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={triggerScan}
            disabled={isScanning}
            className={`p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors ${isScanning ? 'animate-spin text-[#00B5CB]' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-[#0B3E6F]/20 rounded-xl p-3 mb-4 border border-white/10 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={config.path}
            onChange={e => setConfig({...config, path: e.target.value})}
            placeholder="/sti/til/scan"
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00B5CB]"
          />
          <select
            value={config.depth}
            onChange={e => setConfig({...config, depth: parseInt(e.target.value)})}
            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
          >
            {[1,2,3,4,5].map(d => <option key={d} value={d}>Dybde: {d}</option>)}
          </select>
        </div>
        <div>
          <input
            type="text"
            value={config.keywords.join(', ')}
            onChange={e => setConfig({...config, keywords: e.target.value.split(',').map(k => k.trim())})}
            placeholder="Keywords (komma separeret)"
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00B5CB]"
          />
        </div>
        <Button 
          onClick={triggerScan} 
          disabled={isScanning} 
          className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#00B5CB]/20 hover:bg-[#00B5CB]/30 text-[#00B5CB] text-sm rounded-lg transition-colors"
        >
          {isScanning ? <Pause size={14} /> : <Play size={14} />}
          {isScanning ? 'Scanner...' : 'Start Scan'}
        </Button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        
        {results.length === 0 && !isScanning && !error && (
          <div className="text-center py-8 text-gray-500 text-xs">
            Ingen trusler fundet eller ingen scanning kørt.
          </div>
        )}

        {results.map((result, idx) => (
          <div key={idx} className="p-3 bg-[#0B3E6F]/20 border border-white/5 rounded-xl group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2 overflow-hidden">
                {result.hasImage ? <ImageIcon size={14} className="text-purple-400" /> : <FileText size={14} className="text-blue-400" />}
                <span className="text-sm font-medium text-gray-200 truncate" title={result.fullPath}>{result.name}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${result.threatScore > 7 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                Score: {result.threatScore}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono truncate mb-2">{result.fullPath}</p>
            {result.snippet && (
              <div className="bg-black/20 p-2 rounded text-[10px] text-gray-400 font-mono line-clamp-2 border border-white/5">
                {result.snippet}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocalScanWidget;
