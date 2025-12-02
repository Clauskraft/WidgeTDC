import React, { useState, useCallback } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { useWidgetSync } from '../src/hooks/useWidgetSync';
import { useMCP } from '../src/hooks/useMCP';
import { HardDrive, FileText, Image as ImageIcon, Play, Pause, AlertTriangle, Settings2, Scan } from 'lucide-react';

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
  path: 'C:\\Users\\Public',
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
  const [showSettings, setShowSettings] = useState(false);

  useWidgetSync(widgetId, {
    isScanning,
    findingsCount: results.length
  });

  const triggerScan = useCallback(async () => {
    if (!config.path) return;
    
    setIsScanning(true);
    setError(null);
    setResults([]); // Clear previous
    
    try {
      // Mock delay
      await new Promise(r => setTimeout(r, 2000));
      
      // Mock results for demo
      const mockResults: ScanResult[] = [
          { name: 'config.json', sizeBytes: 1024, snippet: '"apiKey": "sk-...", "secret": "..."', threatScore: 9, fullPath: 'C:\\Users\\Public\\config.json' },
          { name: 'notes.txt', sizeBytes: 512, snippet: 'Remember to rotate password for db', threatScore: 4, fullPath: 'C:\\Users\\Public\\notes.txt' },
          { name: 'diagram.png', sizeBytes: 204800, snippet: '', threatScore: 1, hasImage: true, fullPath: 'C:\\Users\\Public\\diagram.png' }
      ];
      setResults(mockResults);
    } catch (err) {
      setError('Scan failed. Agent unreachable.');
    } finally {
      setIsScanning(false);
    }
  }, [config]);

  return (
    <MatrixWidgetWrapper 
        title="Local System Scanner"
        controls={
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1 hover:text-[#00B5CB] transition-colors ${showSettings ? 'text-[#00B5CB]' : 'text-gray-400'}`}
            >
                <Settings2 size={14} />
            </button>
        }
    >
      <div className="flex flex-col h-full">
        
        {/* Configuration Panel */}
        {showSettings && (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 animate-slide-down">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <HardDrive size={14} className="absolute left-3 top-2.5 text-gray-500" />
                        <input
                            type="text"
                            value={config.path}
                            onChange={e => setConfig({...config, path: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-[#00B5CB] focus:outline-none"
                            placeholder="Path to scan..."
                        />
                    </div>
                    <select
                        value={config.depth}
                        onChange={e => setConfig({...config, depth: parseInt(e.target.value)})}
                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                    >
                        {[1,2,3].map(d => <option key={d} value={d}>Depth: {d}</option>)}
                    </select>
                </div>
                <div>
                    <input
                        type="text"
                        value={config.keywords.join(', ')}
                        onChange={e => setConfig({...config, keywords: e.target.value.split(',').map(k => k.trim())})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00B5CB] focus:outline-none"
                        placeholder="Keywords: password, secret..."
                    />
                </div>
            </div>
        )}

        {/* Start Action Area */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Scan size={16} className={isScanning ? 'text-[#00B5CB] animate-pulse' : ''} />
                <span>{isScanning ? 'Scanning file system...' : 'Ready to scan target'}</span>
            </div>
             <button
                onClick={triggerScan}
                disabled={isScanning}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${isScanning 
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#00B5CB]/20 text-[#00B5CB] hover:bg-[#00B5CB]/30 hover:scale-105 border border-[#00B5CB]/50'}
                `}
            >
                {isScanning ? <Pause size={12} /> : <Play size={12} />}
                {isScanning ? 'SCANNING' : 'START SCAN'}
            </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}
            
            {results.length === 0 && !isScanning && !error && (
                <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <HardDrive size={20} className="text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500">No files scanned yet.</p>
                </div>
            )}

            {results.map((result, idx) => (
                <div key={idx} className="group p-3 bg-white/5 border border-white/5 hover:border-white/20 rounded-xl transition-all">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {result.hasImage ? <ImageIcon size={14} className="text-purple-400 shrink-0" /> : <FileText size={14} className="text-blue-400 shrink-0" />}
                            <span className="text-sm font-medium text-gray-200 truncate" title={result.fullPath}>{result.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            result.threatScore > 7 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            RISK: {result.threatScore}
                        </span>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 font-mono truncate mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {result.fullPath}
                    </p>
                    
                    {result.snippet && (
                        <div className="bg-black/30 p-2 rounded border border-white/5 text-[10px] text-gray-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                            {result.snippet}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default LocalScanWidget;
