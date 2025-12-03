/**
 * NudgeService - Aggressive Data Generation System
 * 
 * Runs every 15 minutes to push data into the system:
 * - System metrics → Neo4j
 * - Process snapshots → Neo4j  
 * - Graph evolution triggers
 * - Agent activity pings
 * - OmniHarvester triggers
 */

import cron from 'node-cron';
import si from 'systeminformation';
import { logger } from '../utils/logger.js';
import { eventBus } from '../mcp/EventBus.js';

interface NudgeStats {
  lastRun: Date | null;
  totalRuns: number;
  nodesCreated: number;
  eventsEmitted: number;
  errors: number;
}

class NudgeService {
  private isRunning = false;
  private task: cron.ScheduledTask | null = null;
  private neo4jAdapter: any = null;
  private stats: NudgeStats = {
    lastRun: null,
    totalRuns: 0,
    nodesCreated: 0,
    eventsEmitted: 0,
    errors: 0
  };

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Dynamic import to avoid circular deps
    try {
      const { neo4jAdapter } = await import('../adapters/Neo4jAdapter.js');
      this.neo4jAdapter = neo4jAdapter;
      await this.neo4jAdapter.connect();
    } catch (e) {
      logger.warn('⚡ NudgeService: Neo4j not available, running in limited mode');
    }

    console.log('⚡ NudgeService ACTIVATED - Running every 15 minutes');
    console.log('   └─ Pushing: System metrics, Process snapshots, Graph evolution');

    // Every 15 minutes: */15 * * * *
    this.task = cron.schedule('*/15 * * * *', async () => {
      await this.runNudgeCycle();
    });

    // Initial nudge after 30 seconds
    setTimeout(() => this.runNudgeCycle(), 30000);
    
    // Also run a mini-nudge every 5 minutes for basic stats
    cron.schedule('*/5 * * * *', async () => {
      await this.miniNudge();
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('🛑 NudgeService stopped');
  }

  private async runNudgeCycle() {
    const cycleStart = Date.now();
    console.log('\n⚡══════════════════════════════════════════════════════════⚡');
    console.log('   NUDGE CYCLE #' + (this.stats.totalRuns + 1) + ' - ' + new Date().toISOString());
    console.log('⚡══════════════════════════════════════════════════════════⚡');

    try {
      // 1. Capture System Metrics
      await this.captureSystemMetrics();

      // 2. Capture Process Snapshot
      await this.captureProcessSnapshot();

      // 3. Trigger Graph Evolution
      await this.triggerGraphEvolution();

      // 4. Ping All Agents
      await this.pingAgents();

      // 5. Emit Activity Events
      await this.emitActivityEvents();

      // 6. Run Knowledge Compilation
      await this.triggerKnowledgeCompilation();

      this.stats.totalRuns++;
      this.stats.lastRun = new Date();

      const duration = Date.now() - cycleStart;
      console.log(`\n✅ NUDGE CYCLE COMPLETE in ${duration}ms`);
      console.log(`   Stats: ${this.stats.nodesCreated} nodes | ${this.stats.eventsEmitted} events | ${this.stats.errors} errors`);
      console.log('⚡══════════════════════════════════════════════════════════⚡\n');

    } catch (error) {
      this.stats.errors++;
      logger.error('❌ Nudge cycle failed:', error);
    }
  }

  private async miniNudge() {
    // Quick stats push every 5 minutes
    try {
      const [cpu, mem] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);

      eventBus.emitEvent({
        type: 'system:heartbeat',
        timestamp: new Date().toISOString(),
        source: 'NudgeService',
        payload: {
          cpuLoad: cpu.currentLoad.toFixed(1),
          memUsed: ((mem.used / mem.total) * 100).toFixed(1),
          uptime: process.uptime()
        }
      });

      this.stats.eventsEmitted++;
    } catch (e) {
      // Silent fail for mini-nudge
    }
  }

  private async captureSystemMetrics() {
    console.log('📊 [1/6] Capturing system metrics...');
    
    try {
      const [cpu, mem, osInfo, currentLoad, disk, network] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.currentLoad(),
        si.fsSize(),
        si.networkStats()
      ]);

      if (this.neo4jAdapter) {
        const timestamp = new Date().toISOString();
        const snapshotId = `sys-${Date.now()}`;

        await this.neo4jAdapter.runQuery(`
          MERGE (s:SystemSnapshot {id: $id})
          SET s.timestamp = $timestamp,
              s.cpuBrand = $cpuBrand,
              s.cpuCores = $cpuCores,
              s.cpuLoad = $cpuLoad,
              s.memTotal = $memTotal,
              s.memUsed = $memUsed,
              s.memPercent = $memPercent,
              s.platform = $platform,
              s.osDistro = $osDistro,
              s.diskUsed = $diskUsed
          MERGE (sys:System {name: 'WidgeTDC'})
          MERGE (sys)-[:HAS_SNAPSHOT]->(s)
          RETURN s
        `, {
          id: snapshotId,
          timestamp,
          cpuBrand: cpu.brand,
          cpuCores: cpu.cores,
          cpuLoad: currentLoad.currentLoad,
          memTotal: mem.total,
          memUsed: mem.used,
          memPercent: (mem.used / mem.total) * 100,
          platform: osInfo.platform,
          osDistro: osInfo.distro,
          diskUsed: disk[0]?.used || 0
        });

        this.stats.nodesCreated++;
        console.log('   ✓ System snapshot saved to Neo4j');
      }

      eventBus.emitEvent({
        type: 'nudge.system_metrics',
        timestamp: new Date().toISOString(),
        source: 'NudgeService',
        payload: {
          cpu: currentLoad.currentLoad.toFixed(1) + '%',
          memory: ((mem.used / mem.total) * 100).toFixed(1) + '%'
        }
      });
      this.stats.eventsEmitted++;

    } catch (error) {
      logger.error('System metrics capture failed:', error);
      this.stats.errors++;
    }
  }

  private async captureProcessSnapshot() {
    console.log('🔄 [2/6] Capturing process snapshot...');
    
    try {
      const data = await si.processes();
      const topProcesses = data.list
        .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
        .slice(0, 10);

      if (this.neo4jAdapter) {
        const timestamp = new Date().toISOString();

        for (const proc of topProcesses) {
          await this.neo4jAdapter.runQuery(`
            MERGE (p:Process {name: $name})
            SET p.lastSeen = $timestamp,
                p.cpu = $cpu,
                p.mem = $mem,
                p.pid = $pid
            MERGE (sys:System {name: 'WidgeTDC'})
            MERGE (sys)-[:RUNS]->(p)
          `, {
            name: proc.name || 'Unknown',
            timestamp,
            cpu: proc.cpu || 0,
            mem: proc.mem || 0,
            pid: proc.pid
          });
        }

        this.stats.nodesCreated += topProcesses.length;
        console.log(`   ✓ ${topProcesses.length} processes tracked`);
      }

    } catch (error) {
      logger.error('Process snapshot failed:', error);
      this.stats.errors++;
    }
  }

  private async triggerGraphEvolution() {
    console.log('🧬 [3/6] Triggering graph evolution...');
    
    try {
      if (this.neo4jAdapter) {
        // Get current graph stats
        const result = await this.neo4jAdapter.runQuery(`
          MATCH (n) 
          WITH count(n) as nodeCount
          MATCH ()-[r]->()
          RETURN nodeCount, count(r) as relCount
        `);

        const stats = result.records[0];
        const nodeCount = stats?.get('nodeCount')?.toNumber() || 0;
        const relCount = stats?.get('relCount')?.toNumber() || 0;

        // Create evolution event node
        await this.neo4jAdapter.runQuery(`
          CREATE (e:EvolutionEvent {
            id: $id,
            timestamp: $timestamp,
            nodeCount: $nodeCount,
            relationshipCount: $relCount,
            source: 'NudgeService'
          })
        `, {
          id: `evo-${Date.now()}`,
          timestamp: new Date().toISOString(),
          nodeCount,
          relCount
        });

        this.stats.nodesCreated++;
        console.log(`   ✓ Graph: ${nodeCount} nodes, ${relCount} relationships`);
      }

    } catch (error) {
      logger.error('Graph evolution failed:', error);
      this.stats.errors++;
    }
  }

  private async pingAgents() {
    console.log('🤖 [4/6] Pinging agents...');
    
    const agents = ['HansPedder', 'GraphRAG', 'System', 'OmniHarvester'];
    
    for (const agent of agents) {
      eventBus.emitEvent({
        type: 'agent.ping',
        timestamp: new Date().toISOString(),
        source: 'NudgeService',
        payload: { agent, action: 'heartbeat' }
      });
      this.stats.eventsEmitted++;
    }

    console.log(`   ✓ Pinged ${agents.length} agents`);
  }

  private async emitActivityEvents() {
    console.log('📡 [5/6] Emitting activity events...');
    
    const events = [
      { type: 'nudge.cycle_complete', payload: { cycle: this.stats.totalRuns + 1 } },
      { type: 'system.activity', payload: { source: 'NudgeService', active: true } },
      { type: 'data.push', payload: { nodesCreated: this.stats.nodesCreated } }
    ];

    for (const event of events) {
      eventBus.emitEvent({
        type: event.type as any, // Dynamic event types
        timestamp: new Date().toISOString(),
        source: 'NudgeService',
        payload: event.payload
      });
      this.stats.eventsEmitted++;
    }

    console.log(`   ✓ Emitted ${events.length} events`);
  }

  private async triggerKnowledgeCompilation() {
    console.log('🧠 [6/6] Triggering knowledge compilation...');
    
    try {
      // Trigger compilation via HTTP to self
      const response = await fetch('http://localhost:3001/api/knowledge/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (response?.ok) {
        console.log('   ✓ Knowledge compilation triggered');
      } else {
        console.log('   ⚠ Knowledge compilation endpoint not available');
      }
    } catch (e) {
      // Silent - endpoint might not exist
    }
  }

  getStats(): NudgeStats {
    return { ...this.stats };
  }
}

export const nudgeService = new NudgeService();
