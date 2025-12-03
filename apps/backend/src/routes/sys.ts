import express from 'express';
import si from 'systeminformation';
import { eventBus } from '../mcp/EventBus.js';

const router = express.Router();

// Get top processes by CPU usage
router.get('/processes', async (req, res) => {
  try {
    const data = await si.processes();

    // Sort by CPU usage and take top 5
    const topProcesses = data.list
      .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name || 'Unknown',
        cpu: Number((p.cpu || 0).toFixed(1)),
        mem: Number((p.mem || 0).toFixed(1)),
        pid: p.pid
      }));

    res.json(topProcesses);
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Failed to fetch process information' });
  }
});

// Get system information (CPU, memory, etc.)
router.get('/system', async (req, res) => {
  try {
    const [cpu, mem, osInfo, currentLoad, cpuTemp] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.currentLoad(),
      si.cpuTemperature()
    ]);

    const systemInfo = {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
        temperature: cpuTemp.main || null
      },
      memory: {
        total: mem.total,
        used: mem.used,
        available: mem.available,
        usedPercent: Number(((mem.used / mem.total) * 100).toFixed(1))
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch
      },
      load: {
        avgLoad: Number(currentLoad.avgLoad.toFixed(2)),
        currentLoad: Number(currentLoad.currentLoad.toFixed(1)),
        currentLoadUser: Number(currentLoad.currentLoadUser.toFixed(1)),
        currentLoadSystem: Number(currentLoad.currentLoadSystem.toFixed(1))
      }
    };

    // Check for high load and emit event
    if (systemInfo.load.currentLoad > 90) {
      eventBus.emitEvent({
        type: 'system.alert',
        timestamp: new Date().toISOString(),
        source: 'sys.ts',
        payload: { message: 'High CPU Load detected', load: systemInfo.load.currentLoad }
      });
    }

    res.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: 'Failed to fetch system information' });
  }
});

// Get network information
router.get('/network', async (req, res) => {
  try {
    const [networkStats, networkConnections] = await Promise.all([
      si.networkStats(),
      si.networkConnections()
    ]);

    // Get the primary network interface stats
    const primaryInterface = networkStats.find(stat => stat.rx_sec || stat.tx_sec);

    const networkInfo = {
      stats: primaryInterface ? {
        interface: primaryInterface.iface,
        rx_sec: primaryInterface.rx_sec || 0,
        tx_sec: primaryInterface.tx_sec || 0,
        rx_bytes: primaryInterface.rx_bytes || 0,
        tx_bytes: primaryInterface.tx_bytes || 0
      } : null,
      connections: networkConnections.length,
      activeConnections: networkConnections.filter(conn => conn.state === 'ESTABLISHED').length
    };

    res.json(networkInfo);
  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({ error: 'Failed to fetch network information' });
  }
});

// Get GPU information
router.get('/gpu', async (req, res) => {
  try {
    const graphics = await si.graphics();

    const gpuInfo = graphics.controllers.map(gpu => ({
      vendor: gpu.vendor,
      model: gpu.model,
      vram: gpu.vram,
      temperature: (gpu as any).temperatureGpu || null,
      utilizationGpu: gpu.utilizationGpu || null
    }));

    res.json(gpuInfo);
  } catch (error) {
    console.error('Error fetching GPU info:', error);
    res.status(500).json({ error: 'Failed to fetch GPU information' });
  }
});

// Get Real Security Anomalies (No Mock)
router.get('/security/anomalies', async (req, res) => {
  try {
    const [processes, connections] = await Promise.all([
      si.processes(),
      si.networkConnections()
    ]);

    const anomalies = [];

    // 1. High Resource Processes (Potential Crypto Miners / Runaway scripts)
    const heavyProcs = processes.list.filter(p => p.cpu > 50 || p.mem > 10); // >50% CPU or >10% Mem
    heavyProcs.forEach(p => {
      anomalies.push({
        id: `PROC-${p.pid}`,
        type: 'RESOURCE_ANOMALY',
        severity: p.cpu > 80 ? 'CRITICAL' : 'HIGH',
        source: p.name,
        details: `PID: ${p.pid} | CPU: ${p.cpu.toFixed(1)}% | MEM: ${p.mem.toFixed(1)}%`,
        path: p.path,
        timestamp: new Date().toISOString()
      });
    });

    // 2. Exposed Ports (Listening on 0.0.0.0)
    const listeningPorts = connections.filter(c => c.state === 'LISTEN' && (c.localAddress === '0.0.0.0' || c.localAddress === '::'));
    listeningPorts.forEach(c => {
        // Filter out standard safe ports if needed, but show all for visibility
        anomalies.push({
            id: `NET-${c.localPort}`,
            type: 'OPEN_PORT',
            severity: 'MEDIUM',
            source: c.process || `Port ${c.localPort}`,
            details: `Listening on ${c.localAddress}:${c.localPort} (${c.protocol})`,
            path: 'NETWORK',
            timestamp: new Date().toISOString()
        });
    });

    res.json({
        count: anomalies.length,
        critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
        high: anomalies.filter(a => a.severity === 'HIGH').length,
        anomalies
    });

  } catch (error) {
    console.error('Error scanning anomalies:', error);
    res.status(500).json({ error: 'Failed to scan system anomalies' });
  }
});

export default router;