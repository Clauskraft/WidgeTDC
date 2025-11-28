// HansPedder Agent Controller
// Autonomous testing and improvement agent that runs continuously
// until explicitly stopped

import { eventBus } from '../../mcp/EventBus.js';
import { logger } from '../../utils/logger.js';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

interface HealthMetrics {
  dataflowOk: boolean;
  apiLatency: number;
  wsConnections: number;
  lastIngestion: Date | null;
  vectorStoreResponsive: boolean;
  mcpConnected: boolean;
}

export class HansPedderAgentController {
  private isRunning = false;
  private testInterval: NodeJS.Timeout | null = null;
  private nudgeInterval: NodeJS.Timeout | null = null;
  private testResults: TestResult[] = [];
  private healthMetrics: HealthMetrics = {
    dataflowOk: false,
    apiLatency: 0,
    wsConnections: 0,
    lastIngestion: null,
    vectorStoreResponsive: false,
    mcpConnected: false
  };

  // Track what areas have been nudged
  private nudgedAreas: Set<string> = new Set();
  private readonly IMPROVEMENT_AREAS = [
    'error-handling',
    'loading-states',
    'empty-states',
    'data-freshness',
    'connection-recovery',
    'cache-optimization',
    'api-retry-logic',
    'user-feedback',
    'accessibility',
    'performance-monitoring'
  ];

  start() {
    if (this.isRunning) {
      logger.warn('HansPedder already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('🤖 HansPedder Agent Controller started');
    logger.info('   Mode: Continuous testing + 30min improvement nudges');
    logger.info('   Priority: Robustness → Usability → Value Creation');
    
    // Run tests every 2 minutes
    this.testInterval = setInterval(() => this.runTestSuite(), 2 * 60 * 1000);
    
    // Nudge new areas every 30 minutes
    this.nudgeInterval = setInterval(() => this.nudgeImprovement(), 30 * 60 * 1000);
    
    // Initial run
    this.runTestSuite();
    
    // Listen for events
    this.setupEventListeners();
  }

  stop() {
    if (this.testInterval) clearInterval(this.testInterval);
    if (this.nudgeInterval) clearInterval(this.nudgeInterval);
    this.isRunning = false;
    logger.info('🛑 HansPedder Agent Controller stopped');
    this.reportFinalStatus();
  }

  private setupEventListeners() {
    // Track ingestion events
    eventBus.on('ingestion:emails', () => {
      this.healthMetrics.lastIngestion = new Date();
      this.healthMetrics.dataflowOk = true;
    });
    
    eventBus.on('ingestion:news', () => {
      this.healthMetrics.lastIngestion = new Date();
      this.healthMetrics.dataflowOk = true;
    });
    
    eventBus.on('threat:detected', () => {
      this.healthMetrics.lastIngestion = new Date();
    });
    
    eventBus.on('system:heartbeat', (data: any) => {
      this.healthMetrics.mcpConnected = true;
    });
    
    // Track WebSocket connections
    eventBus.on('ws:connected', () => {
      this.healthMetrics.wsConnections++;
    });
    
    eventBus.on('ws:disconnected', () => {
      this.healthMetrics.wsConnections = Math.max(0, this.healthMetrics.wsConnections - 1);
    });
  }

  private async runTestSuite() {
    logger.info('🧪 Running HansPedder test suite...');
    const startTime = Date.now();
    
    const tests = [
      this.testDataflow,
      this.testVectorStore,
      this.testMCPConnection,
      this.testAPIEndpoints,
      this.testEventBus,
      this.testSchedulerRunning
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test.call(this);
        this.testResults.push(result);
        if (result.passed) passed++;
        else failed++;
      } catch (error) {
        failed++;
        this.testResults.push({
          name: test.name,
          passed: false,
          duration: 0,
          error: (error as Error).message,
          timestamp: new Date()
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Tests complete: ${passed}/${passed + failed} passed (${duration}ms)`);
    
    // Emit results for UI consumption
    eventBus.emit('hanspedder:test-results', {
      passed,
      failed,
      total: passed + failed,
      duration,
      timestamp: new Date().toISOString(),
      health: this.healthMetrics
    });
    
    // Auto-fix if issues detected
    if (failed > 0) {
      await this.attemptAutoFix();
    }
  }

  private async testDataflow(): Promise<TestResult> {
    const start = Date.now();
    const name = 'dataflow';
    
    try {
      // Check if we've had any ingestion in the last 20 minutes
      const lastIngestion = this.healthMetrics.lastIngestion;
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      
      const passed = lastIngestion !== null && lastIngestion > twentyMinutesAgo;
      
      return {
        name,
        passed,
        duration: Date.now() - start,
        error: passed ? undefined : 'No recent data ingestion detected',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name,
        passed: false,
        duration: Date.now() - start,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  private async testVectorStore(): Promise<TestResult> {
    const start = Date.now();
    const name = 'vectorStore';
    
    try {
      // Import dynamically to avoid circular deps
      const { getNeo4jVectorStore } = await import('../../platform/vector/Neo4jVectorStoreAdapter.js');
      const store = getNeo4jVectorStore();
      
      // Try a simple search
      const results = await store.search({
        text: 'test',
        namespace: 'system',
        limit: 1
      });
      
      this.healthMetrics.vectorStoreResponsive = true;
      
      return {
        name,
        passed: true,
        duration: Date.now() - start,
        timestamp: new Date()
      };
    } catch (error) {
      this.healthMetrics.vectorStoreResponsive = false;
      return {
        name,
        passed: false,
        duration: Date.now() - start,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  private async testMCPConnection(): Promise<TestResult> {
    const start = Date.now();
    const name = 'mcpConnection';
    
    // MCP is connected if we've received heartbeats
    const passed = this.healthMetrics.mcpConnected;
    
    return {
      name,
      passed,
      duration: Date.now() - start,
      error: passed ? undefined : 'No MCP heartbeat received',
      timestamp: new Date()
    };
  }

  private async testAPIEndpoints(): Promise<TestResult> {
    const start = Date.now();
    const name = 'apiEndpoints';
    
    try {
      // Test key API endpoints
      const endpoints = [
        'http://localhost:3000/api/health',
        'http://localhost:3000/api/widgets'
      ];
      
      for (const url of endpoints) {
        const response = await fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(`${url} returned ${response.status}`);
        }
      }
      
      return {
        name,
        passed: true,
        duration: Date.now() - start,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name,
        passed: false,
        duration: Date.now() - start,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  private async testEventBus(): Promise<TestResult> {
    const start = Date.now();
    const name = 'eventBus';
    
    return new Promise((resolve) => {
      let received = false;
      
      const handler = () => {
        received = true;
      };
      
      // Use a known event type for testing
      eventBus.on('system:heartbeat', handler);
      eventBus.emit('system:heartbeat', { test: true });
      
      // Give it 100ms
      setTimeout(() => {
        eventBus.off('system:heartbeat', handler);
        resolve({
          name,
          passed: received,
          duration: Date.now() - start,
          error: received ? undefined : 'Event not received',
          timestamp: new Date()
        });
      }, 100);
    });
  }

  private async testSchedulerRunning(): Promise<TestResult> {
    const start = Date.now();
    const name = 'schedulerRunning';
    
    try {
      const { dataScheduler } = await import('../ingestion/DataScheduler.js');
      // Check if scheduler has tasks
      const passed = (dataScheduler as any).isRunning === true;
      
      return {
        name,
        passed,
        duration: Date.now() - start,
        error: passed ? undefined : 'DataScheduler not running',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name,
        passed: false,
        duration: Date.now() - start,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  private async attemptAutoFix() {
    logger.info('🔧 Attempting auto-fix for failed tests...');
    
    const recentFailures = this.testResults
      .filter(r => !r.passed)
      .slice(-10);
    
    for (const failure of recentFailures) {
      switch (failure.name) {
        case 'schedulerRunning':
          logger.info('   → Restarting DataScheduler...');
          try {
            const { dataScheduler } = await import('../ingestion/DataScheduler.js');
            dataScheduler.start();
          } catch (e) {
            logger.error('   → Failed to restart scheduler:', e);
          }
          break;
          
        case 'dataflow':
          logger.info('   → Triggering manual data refresh...');
          eventBus.emit('system:force-refresh', {});
          break;
          
        default:
          logger.debug(`   → No auto-fix available for: ${failure.name}`);
      }
    }
  }

  private nudgeImprovement() {
    // Find an area we haven't nudged yet
    const unNudged = this.IMPROVEMENT_AREAS.filter(a => !this.nudgedAreas.has(a));
    
    if (unNudged.length === 0) {
      // Reset and start over
      this.nudgedAreas.clear();
      logger.info('🔄 All improvement areas covered - resetting cycle');
      return;
    }
    
    const area = unNudged[0];
    this.nudgedAreas.add(area);
    
    logger.info(`💡 Improvement Nudge: ${area}`);
    logger.info(`   Suggested action: Review and enhance ${area} across all widgets`);
    
    // Emit for UI/dashboard
    eventBus.emit('hanspedder:nudge', {
      area,
      timestamp: new Date().toISOString(),
      remaining: unNudged.length - 1,
      suggestions: this.getSuggestionsForArea(area)
    });
  }

  private getSuggestionsForArea(area: string): string[] {
    const suggestions: Record<string, string[]> = {
      'error-handling': [
        'Add try-catch blocks to all async operations',
        'Show user-friendly error messages',
        'Implement error boundaries in React components'
      ],
      'loading-states': [
        'Add skeleton loaders to widgets',
        'Show progress indicators for long operations',
        'Disable buttons during submissions'
      ],
      'empty-states': [
        'Add helpful messages when no data available',
        'Suggest actions users can take',
        'Show example data or tutorials'
      ],
      'data-freshness': [
        'Display "last updated" timestamps',
        'Add manual refresh buttons',
        'Implement auto-refresh with intervals'
      ],
      'connection-recovery': [
        'Auto-reconnect WebSocket on disconnect',
        'Queue actions during offline mode',
        'Show connection status indicator'
      ],
      'cache-optimization': [
        'Implement request deduplication',
        'Add local storage caching',
        'Use stale-while-revalidate pattern'
      ],
      'api-retry-logic': [
        'Add exponential backoff for retries',
        'Implement circuit breaker pattern',
        'Handle rate limiting gracefully'
      ],
      'user-feedback': [
        'Add toast notifications for actions',
        'Show success/failure confirmations',
        'Implement undo functionality'
      ],
      'accessibility': [
        'Add ARIA labels to interactive elements',
        'Ensure keyboard navigation works',
        'Check color contrast ratios'
      ],
      'performance-monitoring': [
        'Track widget render times',
        'Monitor API response times',
        'Log slow operations for analysis'
      ]
    };
    
    return suggestions[area] || ['Review and improve this area'];
  }

  private reportFinalStatus() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    
    logger.info('📊 HansPedder Final Report:');
    logger.info(`   Total tests run: ${totalTests}`);
    logger.info(`   Pass rate: ${passRate}%`);
    logger.info(`   Areas nudged: ${this.nudgedAreas.size}/${this.IMPROVEMENT_AREAS.length}`);
    logger.info(`   Health: ${JSON.stringify(this.healthMetrics, null, 2)}`);
  }

  // Public method to get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      health: this.healthMetrics,
      recentTests: this.testResults.slice(-20),
      nudgedAreas: Array.from(this.nudgedAreas),
      nextNudgeIn: this.nudgeInterval ? '~30 minutes' : 'stopped'
    };
  }
}

// Singleton instance
export const hansPedderAgent = new HansPedderAgentController();
