import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { useMCP } from '../src/hooks/useMCP'; // Eksisterende hook

interface ScanConfig {
  path: string; // Local (e.g., '/mnt/drive') or UNC ('\\server\\share')
  depth: number; // 1-5 levels
  keywords: string[]; // Comma-separated input
  intervalMin?: number; // Polling interval
}

interface ScanResult {
  name: string;
  sizeBytes: number;
  snippet: string;
  threatScore: number; // 0-10
  hasImage?: boolean; // True if image scanned
  imageAnalysis?: { altText?: string; ocrText?: string; score: number }; // OCR output
  fullPath: string;
}

const LocalScanWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { send: mcpSend, isLoading } = useMCP();
  const [config, setConfig] = useState<ScanConfig>({
    path: '/tmp/scan-target',
    depth: 3,
    keywords: ['threat', 'IP', 'credential'],
    intervalMin: 30,
  });
  const [results, setResults] = useState<ScanResult[]>([]);
  const [autoScan, setAutoScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`scan-config-${widgetId}`);
    if (saved) setConfig(JSON.parse(saved));
  }, [widgetId]);

  // Save config
  const saveConfig = (newConfig: ScanConfig) => {
    setConfig(newConfig);
    localStorage.setItem(`scan-config-${widgetId}`, JSON.stringify(newConfig));
  };

  // Trigger scan via MCP
    const triggerScan = useCallback(async () => {
    if (!config.path) {
      setError('Path required');
      return;
    }
    setScanning(true);
    setError(null);
    try {
        const response = await mcpSend('scanner-service', 'scan.local-drive', {
        path: config.path,
        depth: config.depth,
        keywords: config.keywords,
        orgId: 'current', // Multi-tenant
      });
        const files = response?.payload?.files;
        setResults(Array.isArray(files) ? files : []);
    } catch (err) {
      setError(`Scan failed: ${err.message}. Check access rights.`);
      // Discreet: No alert, just log
      console.warn('Scan error (discreet mode):', err);
    } finally {
      setScanning(false);
    }
  }, [mcpSend, config]);

  // Auto-scan interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoScan && config.intervalMin) {
      interval = setInterval(triggerScan, config.intervalMin * 60 * 1000); // e.g., 30 min
    }
    return () => clearInterval(interval);
  }, [autoScan, config.intervalMin, triggerScan]);

    // Render results table
    const autoScanToggleId = `auto-scan-toggle-${widgetId}`;

    return (
      <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <header className="mb-4">
          <h3 className="text-lg font-semibold">Local Drive Scanner</h3>
          <p className="text-sm text-slate-500">
            Discreet scan of local/network drives for cyber threats. Auto-polling enabled.
          </p>
        </header>

        <div className="space-y-4 mb-4">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Path (e.g., /mnt/drive or \\server\\share)"
            value={config.path}
            onChange={event => saveConfig({ ...config, path: event.target.value })}
          />
          <div className="flex gap-3 items-center">
            <label className="text-sm text-slate-600">Depth (1-5 levels):</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={config.depth}
              onChange={event => saveConfig({ ...config, depth: Number(event.target.value) })}
              aria-label="Scan depth"
            />
            <span className="text-sm font-medium">{config.depth}</span>
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Keywords (comma-separated: threat, IP, credential)"
            value={config.keywords.join(', ')}
            onChange={event =>
              saveConfig({
                ...config,
                keywords: event.target.value
                  .split(',')
                  .map(keyword => keyword.trim())
                  .filter(Boolean),
              })
            }
          />
          <div className="flex gap-2 items-center">
            <input
              id={autoScanToggleId}
              type="checkbox"
              checked={autoScan}
              onChange={event => setAutoScan(event.target.checked)}
            />
            <label htmlFor={autoScanToggleId}>Auto-scan every {config.intervalMin || 30} min</label>
          </div>
          <Button onClick={triggerScan} disabled={scanning || !config.path} variant="primary">
            {scanning ? 'Scanning...' : 'Start Scan'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {autoScan && (
            <p className="text-xs text-slate-500">Auto-scan active – Next in {config.intervalMin} min.</p>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-2">File Name</th>
                <th className="text-left p-2">Path</th>
                <th className="text-left p-2">Threat Score (0-10)</th>
                <th className="text-left p-2">Size</th>
                <th className="text-left p-2">Image Analysis</th>
                <th className="text-left p-2">Snippet</th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <tr key={result.fullPath} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{result.name}</td>
                  <td className="p-2 text-xs">{result.fullPath}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        result.threatScore > 7 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {result.threatScore}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{(result.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td className="p-2 text-xs">
                    {result.hasImage && result.imageAnalysis ? (
                      <div className="space-y-1">
                        <p>OCR: {result.imageAnalysis.ocrText?.substring(0, 50) || 'N/A'}</p>
                        <p>Alt: {result.imageAnalysis.altText || 'N/A'}</p>
                        <p>Score: {(result.imageAnalysis.score * 100).toFixed(0)}%</p>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="p-2 text-xs font-mono">
                    {result.snippet ? `${result.snippet.substring(0, 100)}...` : '—'}
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-6">
                    No results yet. Start a scan!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

export default LocalScanWidget;