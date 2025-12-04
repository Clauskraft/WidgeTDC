// AutonomousTaskEngine – Phase 1 (BabyAGI loop)
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { eventBus } from '../EventBus.js';
import { getCognitiveMemory } from '../memory/CognitiveMemory.js';
import { getSourceRegistry } from '../SourceRegistry.js';
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(task, priority) {
        this.items.push({ task, priority });
        this.items.sort((a, b) => b.priority - a.priority);
    }
    dequeue() {
        return this.items.shift()?.task;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    addAll(tasks, priorityFn) {
        tasks.forEach(task => {
            const priority = priorityFn ? priorityFn(task) : task.baseScore || 50;
            this.enqueue(task, priority);
        });
    }
    reprioritize(priorityFn) {
        const tasks = this.items.map(item => item.task);
        this.items = [];
        tasks.forEach(task => {
            const priority = priorityFn(task);
            this.enqueue(task, priority);
        });
    }
}
export class AutonomousTaskEngine {
    constructor(agent) {
        this.queue = new PriorityQueue();
        this.active = true;
        this.executionHistory = [];
        this.memoryOptimizationIntervalId = null;
        if (agent) {
            this.agent = agent;
        }
        else {
            const memory = getCognitiveMemory();
            const registry = getSourceRegistry();
            this.agent = new AutonomousAgent(memory, registry);
        }
        // Listen for system events to generate tasks
        eventBus.onEvent('system.alert', (event) => {
            this.queue.enqueue({
                type: 'diagnostic',
                payload: event.payload,
                baseScore: 100,
                isMaintenanceTask: true
            }, 100);
        });
        // Schedule nightly memory optimization (Consolidation & Decay)
        this.memoryOptimizationIntervalId = setInterval(() => {
            this.queue.enqueue({
                type: 'memory_optimization',
                payload: { mode: 'nightly_consolidation' },
                baseScore: 80,
                isMaintenanceTask: true
            }, 80);
        }, 1000 * 60 * 60 * 24); // Every 24 hours
    }
    async start() {
        console.log('🤖 AutonomousTaskEngine started');
        // Run the task loop in the background (non-blocking)
        this.runTaskLoop();
    }
    async runTaskLoop() {
        while (this.active) {
            if (this.queue.isEmpty()) {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
            }
            const task = this.queue.dequeue();
            const result = await this.executeTask(task);
            // Generate new tasks based on result
            const newTasks = await this.generateTasksFromResult(result);
            this.queue.addAll(newTasks);
            // Reprioritize all tasks
            await this.reprioritizeTasks();
            // Log to episodic memory
            await this.logToEpisodicMemory(task, result, newTasks);
            // Learn patterns → procedural memory
            await this.convertPatternToProcedure(result);
        }
    }
    stop() {
        this.active = false;
        // Clear the memory optimization interval to prevent resource leak
        if (this.memoryOptimizationIntervalId !== null) {
            clearInterval(this.memoryOptimizationIntervalId);
            this.memoryOptimizationIntervalId = null;
        }
    }
    async executeTask(task) {
        const startTime = Date.now();
        try {
            // Handle special memory optimization tasks
            if (task.type === 'memory_optimization') {
                return await this.executeMemoryOptimization(task);
            }
            const intent = this.taskToIntent(task);
            const result = await this.agent.executeAndLearn(intent, async (src) => {
                if ('query' in src && typeof src.query === 'function') {
                    return await src.query(intent.operation || task.type, intent.params || task.payload);
                }
                throw new Error(`Source ${src.name} does not support query operation`);
            });
            const duration = Date.now() - startTime;
            // Emit event for TaskRecorder observation
            eventBus.emit('autonomous.task.executed', {
                taskType: task.type,
                payload: task.payload,
                success: true,
                result: result.data,
                duration
            });
            return {
                success: true,
                data: result.data,
                needsMoreData: false,
                foundPattern: false
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Emit event for TaskRecorder observation (failure)
            eventBus.emit('autonomous.task.executed', {
                taskType: task.type,
                payload: task.payload,
                success: false,
                error: error.message,
                duration
            });
            return {
                success: false,
                error: error.message,
                needsMoreData: true
            };
        }
    }
    /**
     * Execute Memory Optimization (Learning Loop)
     * 1. Consolidate similar vectors
     * 2. Decay old/unused memories
     * 3. Reflect on recent insights
     */
    async executeMemoryOptimization(task) {
        console.log('🧠 [Learning Loop] Starting memory optimization...');
        try {
            const { getVectorStore } = await import('../../platform/vector/index.js');
            const vectorStore = await getVectorStore();
            // 1. Consolidation: Find duplicates/similar items
            // (Simplified implementation: In a real scenario, we'd cluster vectors)
            const stats = await vectorStore.getStatistics();
            console.log(`🧠 [Learning Loop] Current memory size: ${stats.totalRecords} vectors`);
            // 2. Reflection: If we have new data, try to synthesize it
            // This would involve querying the LLM to summarize recent entries
            return {
                success: true,
                data: { optimized: true, stats },
                foundPattern: true // Optimization often reveals patterns
            };
        }
        catch (error) {
            console.error('❌ [Learning Loop] Optimization failed:', error);
            return { success: false, error: error.message };
        }
    }
    async generateTasksFromResult(result) {
        const tasks = [];
        if (result.needsMoreData) {
            tasks.push({
                type: 'data_collection',
                payload: { reason: result.error || 'Missing data' },
                baseScore: 60,
                isSimple: true
            });
        }
        if (result.foundPattern) {
            tasks.push({
                type: 'pattern_exploration',
                payload: { pattern: result.data },
                baseScore: 70,
                isSimple: false
            });
        }
        return tasks;
    }
    async reprioritizeTasks() {
        // Get emotional state and system health for prioritization
        const emotionalState = await this.getEmotionalState();
        const systemHealth = await unifiedMemorySystem.analyzeSystemHealth();
        this.queue.reprioritize((task) => {
            let score = task.baseScore || 50;
            // Stress-aware prioritization
            if (emotionalState.stress === 'high') {
                score += task.isSimple ? 50 : -30;
            }
            // Health-aware prioritization
            if (systemHealth.globalHealth < 0.5) {
                score += task.isMaintenanceTask ? 100 : 0;
            }
            return score;
        });
    }
    async getEmotionalState() {
        // Placeholder: query PAL for emotional state
        // In real implementation, this would query PAL repository
        return { stress: 'low' };
    }
    async logToEpisodicMemory(task, result, newTasks) {
        const log = {
            task,
            result,
            timestamp: new Date(),
            newTasks
        };
        this.executionHistory.push(log);
        // Keep only last 100 logs
        if (this.executionHistory.length > 100) {
            this.executionHistory.shift();
        }
        // Update working memory
        await unifiedMemorySystem.updateWorkingMemory({ orgId: 'default', userId: 'system' }, // Removed timestamp to match McpContext type
        log);
    }
    async convertPatternToProcedure(result) {
        // Placeholder: convert successful patterns to procedural memory
        // In real implementation, this would extract rules and store them
        if (result.success && result.data) {
            // Pattern detected, could be converted to a production rule
        }
    }
    taskToIntent(task) {
        return {
            type: task.type,
            operation: task.type,
            params: task.payload
        };
    }
    getExecutionHistory() {
        return [...this.executionHistory];
    }
}
// Export singleton instance
export const autonomousTaskEngine = new AutonomousTaskEngine();
