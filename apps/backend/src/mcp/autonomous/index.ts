/**
 * Autonomous MCP System - Public API
 * 
 * Complete autonomous intelligence system with:
 * - Cognitive Memory (pattern learning, failure memory)
 * - Decision Engine (AI-powered source selection)
 * - Autonomous Agent (main orchestrator)
 * - Self-Healing (auto-recovery mechanisms)
 */

// Memory Layer
export { CognitiveMemory, initCognitiveMemory, getCognitiveMemory } from '../memory/CognitiveMemory.js';
export { PatternMemory } from '../memory/PatternMemory.js';
export { FailureMemory } from '../memory/FailureMemory.js';

// Autonomous Intelligence
export { DecisionEngine } from './DecisionEngine.js';
export { AutonomousAgent, startAutonomousLearning } from './AutonomousAgent.js';
export { SelfHealingAdapter } from './SelfHealingAdapter.js';

// Types
export type { QueryIntent, DataSource, SourceScore, DecisionResult } from './DecisionEngine.js';
export type { DataQuery, QueryResult, SourceRegistry } from './AutonomousAgent.js';
export type { HealthStatus, DataProvider } from './SelfHealingAdapter.js';
export type { QueryPattern, UsagePattern } from '../memory/PatternMemory.js';
export type { HealthMetrics } from '../memory/CognitiveMemory.js';
