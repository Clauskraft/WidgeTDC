# Autonomous MCP System - Integration Guide

## Quick Start

### 1. Initialize Cognitive Memory

```typescript
import { initializeDatabase, getDatabase } from './database/index.js';
import { initCognitiveMemory } from './mcp/autonomous/index.js';

// Initialize database
await initializeDatabase();
const db = getDatabase();

// Initialize cognitive memory
const memory = initCognitiveMemory(db);
```

### 2. Create Source Registry

```typescript
import { SourceRegistry, DataSource } from './mcp/autonomous/index.js';

class SimpleSourceRegistry implements SourceRegistry {
  private sources: Map<string, DataSource> = new Map();
  
  registerSource(source: DataSource) {
    this.sources.set(source.name, source);
  }
  
  getCapableSources(intent: QueryIntent): DataSource[] {
    // Filter sources that can handle this query
    return Array.from(this.sources.values()).filter(source => {
      // Check if source supports this operation
      return source.capabilities.includes(intent.type) ||
             source.capabilities.includes('*');
    });
  }
  
  getAllSources(): DataSource[] {
    return Array.from(this.sources.values());
  }
}

const registry = new SimpleSourceRegistry();
```

### 3. Register Data Sources

```typescript
// Example: PostgreSQL source
registry.registerSource({
  name: 'postgres-main',
  type: 'database',
  capabilities: ['agents.list', 'agents.get', 'agents.update'],
  isHealthy: async () => {
    try {
      await db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
  estimatedLatency: 50,
  costPerQuery: 0
});

// Example: API source
registry.registerSource({
  name: 'external-api',
  type: 'api',
  capabilities: ['security.search', 'security.list'],
  isHealthy: async () => {
    const response = await fetch('https://api.example.com/health');
    return response.ok;
  },
  estimatedLatency: 200,
  costPerQuery: 0.01
});
```

### 4. Create Autonomous Agent

```typescript
import { AutonomousAgent, startAutonomousLearning } from './mcp/autonomous/index.js';

const agent = new AutonomousAgent(memory, registry);

// Start autonomous learning (runs every 5 minutes)
startAutonomousLearning(agent, 300000);
```

### 5. Use in Routes

```typescript
import { mcpRouter } from './mcp/mcpRouter.js';

mcpRouter.post('/autonomous/query', async (req, res) => {
  try {
    const query = req.body;
    
    // Agent autonomously selects best source and executes
    const result = await agent.executeAndLearn(query, async (source) => {
      // Your execute logic here
      return await yourDataFetcher(source, query);
    });
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        source: result.source,
        latency: result.latencyMs,
        cached: result.cached
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Advanced Usage

### Wrap Existing Providers with Self-Healing

```typescript
import { SelfHealingAdapter } from './mcp/autonomous/index.js';

const primaryProvider: DataProvider = {
  name: 'postgres-main',
  type: 'database',
  query: async (op, params) => { /* ... */ },
  health: async () => ({ healthy: true, score: 1.0 })
};

const fallbackProvider: DataProvider = {
  name: 'postgres-replica',
  type: 'database',
  query: async (op, params) => { /* ... */ },
  health: async () => ({ healthy: true, score: 1.0 })
};

// Wrap with self-healing
const selfHealing = new SelfHealingAdapter(
  primaryProvider,
  memory,
  fallbackProvider
);

// Now use selfHealing instead of primaryProvider
```

### Predictive Pre-fetching

```typescript
// Pre-fetch data for a widget before it requests
await agent.predictAndPrefetch('AgentMonitorWidget');

// This analyzes historical patterns and pre-warms likely data
```

### Query with Intelligence

```typescript
const result = await agent.executeAndLearn({
  type: 'agents.list',
  widgetId: 'AgentMonitorWidget',
  priority: 'high',  // Favor speed over cost
  freshness: 'realtime'  // Need fresh data
}, async (source) => {
  // Your fetch logic
  return await fetchFromSource(source);
});
```

## Monitoring

### Get Agent Statistics

```typescript
const stats = await agent.getStats();
console.log(`Total decisions: ${stats.totalDecisions}`);
console.log(`Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
console.log(`Top sources:`, stats.topSources);
```

### Get Source Intelligence

```typescript
const intel = await memory.getSourceIntelligence('postgres-main');
console.log(`Average latency: ${intel.averageLatency}ms`);
console.log(`Success rate: ${(intel.overallSuccessRate * 100).toFixed(1)}%`);
console.log(`Recent failures: ${intel.recentFailures}`);

if (intel.lastFailure) {
  console.log(`Last failure: ${intel.lastFailure.errorType}`);
  console.log(`Known recovery paths:`, intel.knownRecoveryPaths);
}
```

### Health Dashboard Data

```typescript
const healthHistory = await memory.getHealthHistory('postgres-main', 100);

// Analyze trends
const latencies = healthHistory.map(h => h.latency.p95);
const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
const trend = latencies[0] > latencies[latencies.length - 1] ? 'improving' : 'degrading';

console.log(`Average P95 latency: ${avgLatency.toFixed(0)}ms (${trend})`);
```

## Best Practices

### 1. Always Initialize Database First

```typescript
// ✅ Correct order
await initializeDatabase();
const memory = initCognitiveMemory(getDatabase());

// ❌ Wrong - will fail
const memory = initCognitiveMemory(getDatabase());
await initializeDatabase();
```

### 2. Register Sources at Startup

```typescript
// Register all sources before starting agent
registry.registerSource(source1);
registry.registerSource(source2);
registry.registerSource(source3);

// Then create agent
const agent = new AutonomousAgent(memory, registry);
```

### 3. Let Agent Learn Before Production

```typescript
// Run in learning mode for 1 week
const agent = new AutonomousAgent(memory, registry);

// Agent observes and learns patterns
// After 1 week of data, confidence will be high
```

### 4. Implement Graceful Fallbacks

```typescript
// Always provide fallback sources
const adapter = new SelfHealingAdapter(
  primarySource,
  memory,
  fallbackSource  // ✅ Always provide this
);
```

### 5. Monitor Decision Quality

```typescript
// Periodically check if agent is making good decisions
setInterval(async () => {
  const stats = await agent.getStats();
  
  if (stats.averageConfidence < 0.6) {
    console.warn('Low decision confidence - agent needs more data');
  }
}, 3600000); // Every hour
```

## Troubleshooting

### Agent Always Selects Same Source

**Problem**: Not enough variety in registered sources or historical data.

**Solution**:
```typescript
// Check registered sources
const sources = registry.getAllSources();
console.log(`Registered sources: ${sources.length}`);

// Check historical patterns
const patterns = await memory.getWidgetPatterns('YourWidget');
console.log(`Common sources:`, patterns.commonSources);
```

### Self-Healing Not Working

**Problem**: Circuit breaker may be stuck open.

**Solution**:
```typescript
// Check circuit breaker state in logs
// Look for: "Circuit breaker OPEN"

// Manually reset by restarting or adjusting thresholds
adapter.failureThreshold = 10; // More lenient
```

### Memory Growing Too Large

**Problem**: Not cleaning old data.

**Solution**:
```typescript
// Run cleanup periodically
setInterval(async () => {
  await memory.cleanup(30); // Keep last 30 days
}, 86400000); // Daily
```

## Next Steps

1. **Tune Decision Weights**: Adjust weights in `DecisionEngine` based on your priorities
2. **Add Custom Recovery Actions**: Extend `SelfHealingAdapter` with domain-specific recovery
3. **Implement ML Models**: Replace heuristics with trained models for predictions
4. **Build Admin Dashboard**: Visualize agent decisions and source health

## API Reference

See individual files for detailed API documentation:
- `DecisionEngine.ts` - Scoring algorithms
- `AutonomousAgent.ts` - Main orchestrator
- `SelfHealingAdapter.ts` - Recovery mechanisms
- `CognitiveMemory.ts` - Memory interface
