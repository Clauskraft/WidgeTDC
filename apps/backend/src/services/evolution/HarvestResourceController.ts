/**
 * 🎛️ HARVEST RESOURCE CONTROLLER
 * 
 * Manages resource allocation for OmniHarvester:
 * - CPU throttling via delays
 * - Memory limits
 * - Concurrent file processing limits
 * - Batch processing with pauses
 * - Real-time resource monitoring
 */

import os from 'os';

// ============================================
// TYPES
// ============================================

export interface ResourceConfig {
  throttlePercent: number;      // 0-100: Overall resource limit
  maxConcurrentFiles: number;   // 1-20: Parallel file processing
  memoryLimitMB: number;        // 128-2048: Max memory for harvester
  cpuThrottleMs: number;        // 0-100: Delay between operations (ms)
  batchSize: number;            // 10-500: Files per batch before pause
  batchPauseMs: number;         // Pause between batches
}

export interface ResourceUsage {
  cpuPercent: number;
  memoryMB: number;
  filesPerSecond: number;
  estimatedTimeRemaining: string;
  totalFilesProcessed: number;
  totalFilesToProcess: number;
  currentFile: string;
}

export interface HarvestProgress {
  filesScanned: number;
  totalFiles: number;
  currentFile: string;
  bytesProcessed: number;
  startTime: number;
  strategy: string;
}

// ============================================
// GLOBAL STATE
// ============================================

let globalResourceConfig: ResourceConfig = {
  throttlePercent: 50,
  maxConcurrentFiles: 5,
  memoryLimitMB: 512,
  cpuThrottleMs: 10,
  batchSize: 100,
  batchPauseMs: 100,
};

let harvestProgress: HarvestProgress | null = null;
let filesProcessedSinceStart = 0;
let harvestStartTime = 0;

// ============================================
// CONFIGURATION MANAGEMENT
// ============================================

export function getResourceConfig(): ResourceConfig {
  return { ...globalResourceConfig };
}

export function setResourceConfig(config: Partial<ResourceConfig>): ResourceConfig {
  // Validate and constrain values
  if (config.throttlePercent !== undefined) {
    globalResourceConfig.throttlePercent = Math.max(0, Math.min(100, config.throttlePercent));
  }
  if (config.maxConcurrentFiles !== undefined) {
    globalResourceConfig.maxConcurrentFiles = Math.max(1, Math.min(20, config.maxConcurrentFiles));
  }
  if (config.memoryLimitMB !== undefined) {
    globalResourceConfig.memoryLimitMB = Math.max(128, Math.min(2048, config.memoryLimitMB));
  }
  if (config.cpuThrottleMs !== undefined) {
    globalResourceConfig.cpuThrottleMs = Math.max(0, Math.min(100, config.cpuThrottleMs));
  }
  if (config.batchSize !== undefined) {
    globalResourceConfig.batchSize = Math.max(10, Math.min(500, config.batchSize));
  }
  if (config.batchPauseMs !== undefined) {
    globalResourceConfig.batchPauseMs = Math.max(0, Math.min(1000, config.batchPauseMs));
  }

  console.log(`🎛️ Resource config updated:`, globalResourceConfig);
  return getResourceConfig();
}

// Auto-configure based on throttle percent
export function autoConfigureFromThrottle(throttlePercent: number): ResourceConfig {
  const config: ResourceConfig = {
    throttlePercent,
    maxConcurrentFiles: Math.max(1, Math.floor(throttlePercent / 5)),
    memoryLimitMB: 256 + Math.floor(throttlePercent * 10),
    cpuThrottleMs: Math.floor(100 - throttlePercent),
    batchSize: Math.max(10, Math.floor(throttlePercent * 5)),
    batchPauseMs: Math.max(0, Math.floor((100 - throttlePercent) * 2)),
  };
  
  return setResourceConfig(config);
}

// ============================================
// PROGRESS TRACKING
// ============================================

export function initHarvestProgress(totalFiles: number): void {
  harvestStartTime = Date.now();
  filesProcessedSinceStart = 0;
  harvestProgress = {
    filesScanned: 0,
    totalFiles,
    currentFile: '',
    bytesProcessed: 0,
    startTime: harvestStartTime,
    strategy: 'INITIALIZING',
  };
}

export function updateHarvestProgress(update: Partial<HarvestProgress>): void {
  if (harvestProgress) {
    harvestProgress = { ...harvestProgress, ...update };
    if (update.filesScanned !== undefined) {
      filesProcessedSinceStart = update.filesScanned;
    }
  }
}

export function getHarvestProgress(): HarvestProgress | null {
  return harvestProgress ? { ...harvestProgress } : null;
}

export function clearHarvestProgress(): void {
  harvestProgress = null;
  filesProcessedSinceStart = 0;
  harvestStartTime = 0;
}

// ============================================
// RESOURCE MONITORING
// ============================================

export function getResourceUsage(): ResourceUsage {
  const memUsage = process.memoryUsage();
  const memoryMB = memUsage.heapUsed / 1024 / 1024;
  
  // Calculate CPU (rough estimate based on Node.js event loop)
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  
  const cpuPercent = 100 - (totalIdle / totalTick * 100);
  
  // Calculate files per second
  const elapsedSeconds = (Date.now() - harvestStartTime) / 1000 || 1;
  const filesPerSecond = filesProcessedSinceStart / elapsedSeconds;
  
  // Estimate remaining time
  let estimatedTimeRemaining = '--';
  if (harvestProgress && filesPerSecond > 0) {
    const remaining = harvestProgress.totalFiles - harvestProgress.filesScanned;
    const secondsRemaining = remaining / filesPerSecond;
    
    if (secondsRemaining < 60) {
      estimatedTimeRemaining = `${Math.ceil(secondsRemaining)}s`;
    } else if (secondsRemaining < 3600) {
      estimatedTimeRemaining = `${Math.ceil(secondsRemaining / 60)}m`;
    } else {
      estimatedTimeRemaining = `${(secondsRemaining / 3600).toFixed(1)}h`;
    }
  }
  
  return {
    cpuPercent: Math.round(cpuPercent * 10) / 10,
    memoryMB: Math.round(memoryMB),
    filesPerSecond: Math.round(filesPerSecond * 10) / 10,
    estimatedTimeRemaining,
    totalFilesProcessed: filesProcessedSinceStart,
    totalFilesToProcess: harvestProgress?.totalFiles || 0,
    currentFile: harvestProgress?.currentFile || '',
  };
}

// ============================================
// THROTTLING UTILITIES
// ============================================

export async function throttleDelay(): Promise<void> {
  if (globalResourceConfig.cpuThrottleMs > 0) {
    await new Promise(resolve => setTimeout(resolve, globalResourceConfig.cpuThrottleMs));
  }
}

export async function batchPause(): Promise<void> {
  if (globalResourceConfig.batchPauseMs > 0) {
    await new Promise(resolve => setTimeout(resolve, globalResourceConfig.batchPauseMs));
  }
}

export function shouldPauseForBatch(filesProcessed: number): boolean {
  return filesProcessed > 0 && filesProcessed % globalResourceConfig.batchSize === 0;
}

export function checkMemoryLimit(): boolean {
  const memUsage = process.memoryUsage();
  const memoryMB = memUsage.heapUsed / 1024 / 1024;
  return memoryMB < globalResourceConfig.memoryLimitMB;
}

// ============================================
// STATUS AGGREGATION
// ============================================

export interface HarvestFullStatus {
  isRunning: boolean;
  harvestId: string | null;
  canAbort: boolean;
  progress: HarvestProgress | null;
  resourceUsage: ResourceUsage;
  resourceConfig: ResourceConfig;
}

// This will be combined with OmniHarvester status
export function getResourceStatus(): {
  resourceUsage: ResourceUsage;
  resourceConfig: ResourceConfig;
  progress: HarvestProgress | null;
} {
  return {
    resourceUsage: getResourceUsage(),
    resourceConfig: getResourceConfig(),
    progress: getHarvestProgress(),
  };
}
