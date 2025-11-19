import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; // Antag UI-komponent
import { Slider } from '../components/ui/Slider'; // Antag
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'; // Antag
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
      setResults(response.payload.files || []);
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
  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Local Drive Scanner</h3>
        <p className="text-sm text-slate-500">Discreet scan of local/network drives for cyber threats. Auto-polling enabled.</p>
      </header>

      {/* Config Form */}
      <div className="space-y-4 mb-4">
        <Input
          placeholder="Path (e.g., /mnt/drive or \\server\\share)"
          value={config.path}
          onChange={(e) => saveConfig({ ...config, path: e.target.value })}
        />
        <div className="flex gap-2 items-center">
          <label>Depth (1-5 levels):</label>
          <Slider
            value={[config.depth]}
            onValueChange={(v) => saveConfig({ ...config, depth: v[0] })}
            min={1}
            max={5}
            step={1}
          />
        </div>
        <Input
          placeholder="Keywords (comma-separated: threat, IP, credential)"
          value={config.keywords.join(', ')}
          onChange={(e) => saveConfig({ ...config, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
        />
          <label className="flex gap-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
            />
            <span>Auto-scan every {config.intervalMin || 30} min</span>
          </label>
        <Button onClick={triggerScan} disabled={scanning || !config.path} variant="primary">
          {scanning ? 'Scanning...' : 'Start Scan'}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {autoScan && <p className="text-xs text-slate-500">Auto-scan active – Next in {config.intervalMin} min.</p>}
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>File Name</TableHeader>
                <TableHeader>Path</TableHeader>
                <TableHeader>Threat Score (0-10)</TableHeader>
                <TableHeader>Size</TableHeader>
                <TableHeader>Image Analysis</TableHeader>
                <TableHeader>Snippet</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No results yet. Start a scan!
                  </TableCell>
                </TableRow>
              ) : (
                results.map(result => (
                  <TableRow key={result.fullPath}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell className="text-xs">{result.fullPath}</TableCell>
                    <TableCell>
                      <Badge variant={result.threatScore > 5 ? 'destructive' : 'default'}>
                        {result.threatScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{(result.sizeBytes / 1024).toFixed(1)} KB</TableCell>
                    <TableCell className="text-xs">
                      {result.hasImage && result.imageAnalysis ? (
                        <div>
                          <p>OCR: {result.imageAnalysis.ocrText?.substring(0, 50)}...</p>
                          <p>Alt: {result.imageAnalysis.altText || 'N/A'}</p>
                          <p>Score: {result.imageAnalysis.score}</p>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{result.snippet.substring(0, 100)}...</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LocalScanWidget;