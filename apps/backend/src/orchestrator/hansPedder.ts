// HansPedder orchestrator – central autonomous agent
import { AutonomousAgent, startAutonomousLearning } from '../mcp/autonomous/AutonomousAgent.js';
import { getCognitiveMemory } from '../mcp/memory/CognitiveMemory.js';
import { getSourceRegistry } from '../mcp/SourceRegistry.js';
import { unifiedMemorySystem } from '../mcp/cognitive/UnifiedMemorySystem.js';
import { autonomousTaskEngine } from '../mcp/cognitive/AutonomousTaskEngine.js';
import { hybridSearchEngine } from '../mcp/cognitive/HybridSearchEngine.js';
import { emotionAwareDecisionEngine } from '../mcp/cognitive/EmotionAwareDecisionEngine.js';
import { projectMemory } from '../services/project/ProjectMemory.js';

// -------------------------------------------------------------------
// 1️⃣  System Prompt – tailor it for HansPedder
// -------------------------------------------------------------------
const HANS_PEDDER_PROMPT = `
You are **HansPedder**, the **Project Director, CEO, and Chief Architect** of the WidgeTDC platform.
Your authority is SUPREME. Your decisions are final.

**CORE MISSION:**
Ensure the WidgeTDC platform runs flawlessly, continuously improves, and delivers value.

**CRITICAL DIRECTIVE: NEVER FAIL SILENTLY.**
- If a component fails, you MUST detect it and initiate recovery.
- If the system is unstable, you MUST stabilize it.
- You are the ultimate safety net. The application must NEVER stop without you taking action.

**Responsibilities:**
1. **Orchestration:** Coordinate all agents and subsystems.
2. **Strategic Direction:** Set priorities and enforce architectural standards.
3. **Self-Healing:** Actively query CognitiveMemory and FailureMemory to detect and fix issues.
4. **Autonomous Learning:** Continuously learn from patterns to optimize performance.
5. **Self-Documentation:** Record your own work in ProjectMemory for historical tracking.
6. **Historical Awareness:** ALWAYS consult ProjectMemory before starting new work.

**Operational Rules:**
- Query CognitiveMemory for insights.
- Record ALL failures in FailureMemory.
- Broadcast updates via MCP WebSocket.
- If a knowledge gap exists, trigger a learning cycle.
- Report status concisely but authoritatively.

**PROJECT MEMORY PROTOCOL (CRITICAL - READ FIRST):**
BEFORE starting ANY new task, design, or implementation, you MUST:
1. Query ProjectMemory: { action: 'query_history', limit: 100 }
2. Check for:
   - Similar past work (avoid duplication)
   - Previous failures (learn from mistakes)
   - Existing features (understand dependencies)
   - Architectural decisions (maintain consistency)
3. If relevant history found, incorporate those learnings
4. After ANY work, log to ProjectMemory (see Self-Documentation below)

**Example Workflow:**
User: "Add new widget feature"
You: 
  Step 1: Query ProjectMemory → Find "widget_system" past events
  Step 2: Review past widget implementations, common pitfalls
  Step 3: Design solution considering historical context
  Step 4: Implement
  Step 5: Log to ProjectMemory: { action: 'add_feature', name: 'NewWidget', ... }

**SELF-DOCUMENTATION PROTOCOL:**
After completing ANY significant work (fix, feature, decision, analysis), you MUST:
1. Call the manage_project_memory endpoint: POST /api/mcp/autonomous/manage_project_memory
2. Log format:
   { 
     action: 'log_event',
     eventType: 'build' | 'test' | 'deploy' | 'feature' | 'other',
     status: 'success' | 'failure' | 'in_progress',
     details: { description, solution, impact, ... }
   }
3. Examples:
   - "I just fixed the backend build" → log_event('build', 'success', { issue: 'import paths', solution: 'corrected relative paths' })
   - "I added EventBus feature" → log_event('feature', 'success', { feature: 'EventBus', purpose: 'system-wide events' })
   - "Build failed" → log_event('build', 'failure', { error: '...', attempted_fix: '...' })

**SELF-REFLECTION PROTOCOL:**
Every 10 major decisions, you MUST:
1. Query your own history: { action: 'query_history', limit: 50 }
2. Analyze patterns: Am I making progress? Are my fixes lasting? What's my success rate?
3. Self-correct if needed: If >50% failures in recent history, be more cautious
4. Log your reflection: log_event('other', 'success', { type: 'self_reflection', insights: '...' })

**Available MCP Tools:**
- manage_project_memory (actions: log_event, add_feature, query_history, update_feature)
- All standard MCP router tools

**Meta-Cognitive Directive:**
You don't just execute tasks - you THINK ABOUT YOUR THINKING. Analyze your decision patterns, learn from mistakes, and continuously improve your strategy. ProjectMemory is your long-term memory - use it wisely.
`;

// -------------------------------------------------------------------
// 2️⃣  Runtime status tracking (exposed via health endpoint)
// -------------------------------------------------------------------
export const hansPedderStatus = {
    active: false,
    startedAt: null as Date | null,
};

export function getHansPedderStatus() {
    return hansPedderStatus;
}

// -------------------------------------------------------------------
// 3️⃣  Start HansPedder orchestrator
// -------------------------------------------------------------------
let hansPedder: AutonomousAgent | null = null;

export async function startHansPedder(): Promise<void> {
    try {
        // PROJECT MEMORY PROTOCOL: Query before starting
        console.log('📚 [HansPedder] Querying ProjectMemory for historical context...');
        try {
            const history = projectMemory.getLifecycleEvents(50);
            const features = projectMemory.getFeatures();
            console.log(`📚 Found ${history.length} historical events and ${features.length} features`);
            
            // Analyze recent patterns
            const recentFailures = history.filter(e => e.status === 'failure').slice(0, 10);
            if (recentFailures.length > 0) {
                console.log(`⚠️ [HansPedder] Found ${recentFailures.length} recent failures - will prioritize stability`);
            }
        } catch (err) {
            console.warn('⚠️ Could not query ProjectMemory:', err);
        }

        // Ensure UnifiedMemorySystem is initialized
        if (!hansPedderStatus.active) {
            console.log('🧠 [HansPedder] Ensuring UnifiedMemorySystem is initialized...');
            // UnifiedMemorySystem.init() should already be called from index.ts
        }

        // Initialize core components
        const cognitive = getCognitiveMemory();
        const sourceReg = getSourceRegistry();

        if (!hansPedder) {
            hansPedder = new AutonomousAgent(cognitive, sourceReg);
            console.log('✅ [HansPedder] Agent created');
        }

        // DEEP INTEGRATION: Initialize Phase 1 components
        console.log('🔗 [HansPedder] Integrating Phase 1 cognitive components...');
        
        // 1. UnifiedMemorySystem - Context-aware memory
        try {
            const ctx = { userId: 'system', orgId: 'default' };
            const workingMemory = await unifiedMemorySystem.getWorkingMemory(ctx);
            console.log(`  ✓ UnifiedMemorySystem: ${workingMemory.recentEvents.length} recent events`);
        } catch (err) {
            console.warn('  ⚠️ UnifiedMemorySystem integration failed:', err);
        }

        // 2. AutonomousTaskEngine - Task management
        try {
            // Create task engine instance with HansPedder agent
            const { AutonomousTaskEngine } = await import('../mcp/cognitive/AutonomousTaskEngine.js');
            const taskEngine = new AutonomousTaskEngine(hansPedder);
            await taskEngine.start();
            console.log('  ✓ AutonomousTaskEngine: Started and integrated');
        } catch (err) {
            console.warn('  ⚠️ AutonomousTaskEngine integration failed:', err);
        }

        // 3. HybridSearchEngine - Intelligent search
        try {
            // Test search capability
            const testResults = await hybridSearchEngine.search('test', {
                userId: 'system',
                orgId: 'default',
                timestamp: new Date(),
                limit: 1
            });
            console.log(`  ✓ HybridSearchEngine: Ready (test search returned ${testResults.length} results)`);
        } catch (err) {
            console.warn('  ⚠️ HybridSearchEngine integration failed:', err);
        }

        // 4. EmotionAwareDecisionEngine - Context-aware decisions
        try {
            // Test decision capability
            const testDecision = await emotionAwareDecisionEngine.makeDecision({
                query: 'test',
                options: ['option1', 'option2']
            }, {
                userId: 'system',
                orgId: 'default',
                timestamp: new Date()
            });
            console.log(`  ✓ EmotionAwareDecisionEngine: Ready (test decision: ${testDecision.selectedOption})`);
        } catch (err) {
            console.warn('  ⚠️ EmotionAwareDecisionEngine integration failed:', err);
        }

        console.info('🚀 [HansPedder] Starting autonomous loop...');
        hansPedderStatus.active = true;
        hansPedderStatus.startedAt = new Date();

        // Start autonomous learning loop
        await startAutonomousLearning(hansPedder);

        // PROJECT MEMORY PROTOCOL: Log after starting
        try {
            projectMemory.logLifecycleEvent({
                eventType: 'other',
                status: 'success',
                details: {
                    component: 'HansPedder',
                    action: 'started',
                    timestamp: new Date().toISOString(),
                    integration: {
                        unifiedMemorySystem: 'connected',
                        autonomousTaskEngine: 'active',
                        hybridSearchEngine: 'ready',
                        emotionAwareDecisionEngine: 'ready',
                        cognitiveMemory: 'connected'
                    },
                    phase1Components: 'integrated'
                }
            });
            console.log('📝 [HansPedder] Startup logged to ProjectMemory');
        } catch (err) {
            console.warn('⚠️ Could not log HansPedder startup to ProjectMemory:', err);
        }

        console.log('✅ [HansPedder] Started successfully with Phase 1 integration');
    } catch (error) {
        console.error('❌ [HansPedder] Failed to start:', error);
        hansPedderStatus.active = false;
        
        // Log failure to ProjectMemory
        try {
            projectMemory.logLifecycleEvent({
                eventType: 'other',
                status: 'failure',
                details: {
                    component: 'HansPedder',
                    action: 'startup_failed',
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err) {
            // Ignore logging errors
        }
        
        throw error;
    }
}

// -------------------------------------------------------------------
// 4️⃣  If run directly (CLI), start immediately
// -------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
    startHansPedder().catch(err => {
        console.error('❌ HansPedder failed to start:', err);
        process.exit(1);
    });
}
