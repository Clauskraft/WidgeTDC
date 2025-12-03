/**
 * 🎛️ HARVEST CONTROL PANEL
 * 
 * Resource management for OmniHarvester:
 * - Emergency Stop (NØDSTOP) button
 * - Resource Throttle dial (0-100%)
 * - Real-time harvest status
 * - CPU/Memory allocation limits
 */

import { useState, useEffect, useCallback } from 'react';
import {
  StopCircle,
  Play,
  Pause,
  Gauge,
  Cpu,
  HardDrive,
  Activity,
  AlertTriangle,
  Settings2,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { buildApiUrl } from '../utils/api';

// ============================================
// TYPES
// ============================================

interface HarvestStatus {
  isRunning: boolean;
  harvestId: string | null;
  canAbort: boolean;
  progress?: {
    filesScanned: number;
    totalFiles: number;
    currentFile: string;
    bytesProcessed: number;
  };
}

interface ResourceConfig {
  throttlePercent: number;      // 0-100: Overall resource limit
  maxConcurrentFiles: number;   // 1-20: Parallel file processing
  memoryLimitMB: number;        // 128-2048: Max memory for harvester
  cpuThrottleMs: number;        // 0-100: Delay between operations (ms)
  batchSize: number;            // 10-500: Files per batch before pause
}

interface ResourceUsage {
  cpuPercent: number;
  memoryMB: number;
  filesPerSecond: number;
  estimatedTimeRemaining: string;
}

// ============================================
// THROTTLE DIAL COMPONENT
// ============================================

const ThrottleDial = ({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) => {
  const getThrottleColor = (val: number) => {
    if (val <= 25) return 'text-neon-green';
    if (val <= 50) return 'text-neon-cyan';
    if (val <= 75) return 'text-alert-yellow';
    return 'text-alert-red';
  };

  const getThrottleLabel = (val: number) => {
    if (val <= 25) return 'ECO';
    if (val <= 50) return 'NORMAL';
    if (val <= 75) return 'TURBO';
    return 'MAX';
  };

  const rotation = (value / 100) * 270 - 135; // -135 to 135 degrees

  return (
    <div className="flex flex-col items-center">
      {/* Dial Visual */}
      <div className="relative w-32 h-32">
        {/* Background arc */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="188.5 62.83"
            strokeDashoffset="-31.4"
            className="text-cyber-gray/30"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 188.5} 251.33`}
            strokeDashoffset="-31.4"
            className={`${getThrottleColor(value)} transition-all duration-300`}
          />
        </svg>

        {/* Center dial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-16 h-16 rounded-full bg-cyber-black border-2 border-neon-green/30">
            {/* Needle */}
            <div
              className="absolute top-1/2 left-1/2 w-1 h-6 bg-neon-green origin-bottom rounded-full transition-transform duration-200"
              style={{ transform: `translate(-50%, -100%) rotate(${rotation}deg)` }}
            />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-green" />
          </div>
        </div>

        {/* Value display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className={`text-2xl font-bold ${getThrottleColor(value)}`}>{value}%</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full mt-4 accent-neon-green cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Mode Label */}
      <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${getThrottleColor(value)} border border-current`}>
        {getThrottleLabel(value)} MODE
      </div>
    </div>
  );
};

// ============================================
// EMERGENCY STOP BUTTON
// ============================================

const EmergencyStopButton = ({
  isHarvesting,
  onStop,
  disabled,
}: {
  isHarvesting: boolean;
  onStop: () => void;
  disabled: boolean;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled && isHarvesting) {
      setIsPressed(true);
      onStop();
      setTimeout(() => setIsPressed(false), 500);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isHarvesting}
      className={`
        relative w-24 h-24 rounded-full
        transition-all duration-200 transform
        ${isHarvesting 
          ? 'bg-alert-red hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-alert-red/50' 
          : 'bg-cyber-gray/50 cursor-not-allowed opacity-50'
        }
        ${isPressed ? 'scale-90' : ''}
        border-4 border-alert-red/30
        flex items-center justify-center
        group
      `}
    >
      {/* Glow effect */}
      {isHarvesting && (
        <div className="absolute inset-0 rounded-full bg-alert-red/30 animate-ping" />
      )}
      
      {/* Icon */}
      <StopCircle className={`w-12 h-12 ${isHarvesting ? 'text-white' : 'text-gray-500'}`} />
      
      {/* Label */}
      <span className="absolute -bottom-8 text-xs font-bold text-alert-red whitespace-nowrap">
        NØDSTOP
      </span>
    </button>
  );
};

// ============================================
// RESOURCE STATS DISPLAY
// ============================================

const ResourceStats = ({ usage, config }: { usage: ResourceUsage | null; config: ResourceConfig }) => {
  if (!usage) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm text-neon-green/50">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>CPU: --</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          <span>MEM: --</span>
        </div>
      </div>
    );
  }

  const cpuColor = usage.cpuPercent > 80 ? 'text-alert-red' : usage.cpuPercent > 50 ? 'text-alert-yellow' : 'text-neon-green';
  const memColor = usage.memoryMB > config.memoryLimitMB * 0.8 ? 'text-alert-red' : 'text-neon-green';

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${cpuColor}`} />
          <span className="text-neon-green/70">CPU</span>
        </div>
        <span className={cpuColor}>{usage.cpuPercent.toFixed(1)}%</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className={`w-4 h-4 ${memColor}`} />
          <span className="text-neon-green/70">Memory</span>
        </div>
        <span className={memColor}>{usage.memoryMB.toFixed(0)} / {config.memoryLimitMB} MB</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neon-cyan" />
          <span className="text-neon-green/70">Speed</span>
        </div>
        <span className="text-neon-cyan">{usage.filesPerSecond.toFixed(1)} files/s</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-neon-green" />
          <span className="text-neon-green/70">ETA</span>
        </div>
        <span className="text-neon-green">{usage.estimatedTimeRemaining}</span>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT: HARVEST CONTROL PANEL
// ============================================

export const HarvestControlPanel = () => {
  const [harvestStatus, setHarvestStatus] = useState<HarvestStatus>({
    isRunning: false,
    harvestId: null,
    canAbort: false,
  });
  
  const [resourceConfig, setResourceConfig] = useState<ResourceConfig>({
    throttlePercent: 50,
    maxConcurrentFiles: 5,
    memoryLimitMB: 512,
    cpuThrottleMs: 10,
    batchSize: 100,
  });
  
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch harvest status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(buildApiUrl('/harvest/status'));
      if (res.ok) {
        const data = await res.json();
        setHarvestStatus(data);
        if (data.resourceUsage) {
          setResourceUsage(data.resourceUsage);
        }
      }
    } catch {
      // Backend might not be running
    }
  }, []);

  // Poll status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Apply throttle to backend
  const applyThrottle = async (newConfig: ResourceConfig) => {
    try {
      const res = await fetch(buildApiUrl('/harvest/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      
      if (!res.ok) throw new Error('Failed to apply config');
      
      setResourceConfig(newConfig);
      setError(null);
    } catch (err) {
      setError('Failed to apply resource configuration');
      console.error('Throttle error:', err);
    }
  };

  // Handle throttle change
  const handleThrottleChange = (value: number) => {
    const newConfig: ResourceConfig = {
      ...resourceConfig,
      throttlePercent: value,
      // Auto-calculate other values based on throttle
      maxConcurrentFiles: Math.max(1, Math.floor(value / 5)),
      cpuThrottleMs: Math.floor((100 - value)),
      batchSize: Math.max(10, Math.floor(value * 5)),
    };
    applyThrottle(newConfig);
  };

  // Emergency stop
  const handleEmergencyStop = async () => {
    try {
      const res = await fetch(buildApiUrl('/harvest/abort'), {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to abort harvest');
      
      const data = await res.json();
      console.log('🛑 NØDSTOP:', data.message);
      setError(null);
      fetchStatus();
    } catch (err) {
      setError('Failed to stop harvest');
      console.error('Emergency stop error:', err);
    }
  };

  // Start harvest
  const handleStartHarvest = async () => {
    try {
      const res = await fetch(buildApiUrl('/harvest/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: resourceConfig }),
      });
      
      if (!res.ok) throw new Error('Failed to start harvest');
      
      setError(null);
      fetchStatus();
    } catch (err) {
      setError('Failed to start harvest');
      console.error('Start harvest error:', err);
    }
  };

  return (
    <div className="hud-border rounded-lg p-4 bg-cyber-black/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-neon-green" />
          <h3 className="text-neon-green font-bold">HARVEST CONTROL</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-neon-green/50 hover:text-neon-green transition-colors"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-2 bg-alert-red/20 border border-alert-red/50 rounded flex items-center gap-2 text-alert-red text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: Throttle Dial */}
        <div className="flex-1">
          <ThrottleDial
            value={resourceConfig.throttlePercent}
            onChange={handleThrottleChange}
            disabled={false}
          />
        </div>

        {/* Right: Emergency Stop + Start */}
        <div className="flex flex-col items-center gap-4">
          <EmergencyStopButton
            isHarvesting={harvestStatus.isRunning}
            onStop={handleEmergencyStop}
            disabled={!harvestStatus.canAbort}
          />
          
          {!harvestStatus.isRunning && (
            <button
              onClick={handleStartHarvest}
              className="flex items-center gap-2 px-4 py-2 bg-neon-green/20 border border-neon-green/50 
                         rounded-lg text-neon-green hover:bg-neon-green/30 transition-colors"
            >
              <Play className="w-4 h-4" />
              START
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-neon-green/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neon-green/70 text-sm">Status:</span>
          <span className={`text-sm font-bold ${harvestStatus.isRunning ? 'text-neon-green animate-pulse' : 'text-neon-green/50'}`}>
            {harvestStatus.isRunning ? `HARVESTING (${harvestStatus.harvestId})` : 'IDLE'}
          </span>
        </div>
        
        {harvestStatus.progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-neon-green/50 mb-1">
              <span>Progress</span>
              <span>{harvestStatus.progress.filesScanned} / {harvestStatus.progress.totalFiles}</span>
            </div>
            <div className="h-2 bg-cyber-gray/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-green transition-all duration-300"
                style={{ width: `${(harvestStatus.progress.filesScanned / harvestStatus.progress.totalFiles) * 100}%` }}
              />
            </div>
            <p className="text-xs text-neon-green/50 mt-1 truncate">
              {harvestStatus.progress.currentFile}
            </p>
          </div>
        )}
      </div>

      {/* Resource Usage */}
      <div className="mt-4 pt-4 border-t border-neon-green/20">
        <ResourceStats usage={resourceUsage} config={resourceConfig} />
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-neon-green/20 space-y-3">
          <h4 className="text-neon-cyan text-sm font-bold mb-2">ADVANCED SETTINGS</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-neon-green/70">Max Concurrent Files</label>
              <input
                type="number"
                min="1"
                max="20"
                value={resourceConfig.maxConcurrentFiles}
                onChange={(e) => applyThrottle({ ...resourceConfig, maxConcurrentFiles: parseInt(e.target.value) })}
                className="w-full mt-1 bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-neon-green"
              />
            </div>
            
            <div>
              <label className="text-neon-green/70">Memory Limit (MB)</label>
              <input
                type="number"
                min="128"
                max="2048"
                step="128"
                value={resourceConfig.memoryLimitMB}
                onChange={(e) => applyThrottle({ ...resourceConfig, memoryLimitMB: parseInt(e.target.value) })}
                className="w-full mt-1 bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-neon-green"
              />
            </div>
            
            <div>
              <label className="text-neon-green/70">CPU Delay (ms)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={resourceConfig.cpuThrottleMs}
                onChange={(e) => applyThrottle({ ...resourceConfig, cpuThrottleMs: parseInt(e.target.value) })}
                className="w-full mt-1 bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-neon-green"
              />
            </div>
            
            <div>
              <label className="text-neon-green/70">Batch Size</label>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={resourceConfig.batchSize}
                onChange={(e) => applyThrottle({ ...resourceConfig, batchSize: parseInt(e.target.value) })}
                className="w-full mt-1 bg-cyber-black border border-neon-green/30 rounded px-2 py-1 text-neon-green"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestControlPanel;
