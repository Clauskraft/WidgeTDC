// AutonomousTaskEngine – Phase 1 (BabyAGI loop)
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { eventBus } from '../EventBus.js';
import { getCognitiveMemory } from '../memory/CognitiveMemory.js';
import { getSourceRegistry } from '../SourceRegistry.js';

type Task = {
    type: string;
    payload: any;
    baseScore?: number;
    isSimple?: boolean;
    isMaintenanceTask?: boolean;
};

interface TaskResult {
    success: boolean;
    data?: any;
    error?: any;
    needsMoreData?: boolean;
    foundPattern?: boolean;
}

interface ExecutionLog {
    task: Task;
    result: TaskResult;
    timestamp: Date;
    newTasks: Task[];
}

class PriorityQueue<T> {
    private items: { task: T; priority: number }[] = [];

    enqueue(task: T, priority: number) {
        this.items.push({ task, priority });
        this.items.sort((a, b) => b.priority - a.priority);
    }

    dequeue(): T | undefined {
        return this.items.shift()?.task;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    addAll(tasks: T[], priorityFn?: (task: T) => number) {
        tasks.forEach(task => {
            const priority = priorityFn ? priorityFn(task) : (task as any).baseScore || 50;
            this.enqueue(task, priority);
        });
    }

    reprioritize(priorityFn: (task: T) => number) {
        const tasks = this.items.map(item => item.task);
        this.items = [];
        tasks.forEach(task => {
            const priority = priorityFn(task);
            this.enqueue(task, priority);
        });
    }
}

export class AutonomousTaskEngine {
    private agent: AutonomousAgent;
    private queue = new PriorityQueue<Task>();
    private active = true;
    private executionHistory: ExecutionLog[] = [];
    private memoryOptimizationIntervalId: NodeJS.Timeout | null = null;

    constructor(agent?: AutonomousAgent) {
        if (agent) {
            this.agent = agent;
        } else {
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

        while (this.active) {
            if (this.queue.isEmpty()) {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
            }

            const task = this.queue.dequeue()!;
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

    private async executeTask(task: Task): Promise<TaskResult> {
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
        } catch (error: any) {
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
    private async executeMemoryOptimization(task: Task): Promise<TaskResult> {
        console.log('🧠 [Learning Loop] Starting memory optimization...');

        try {
            const { getChromaVectorStore } = await import('../../platform/vector/ChromaVectorStoreAdapter.js');
            const vectorStore = getChromaVectorStore();

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
        } catch (error: any) {
            console.error('❌ [Learning Loop] Optimization failed:', error);
            return { success: false, error: error.message };
        }
    }

    private async generateTasksFromResult(result: TaskResult): Promise<Task[]> {
        const tasks: Task[] = [];

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

    private async reprioritizeTasks(): Promise<void> {
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

    private async getEmotionalState(): Promise<{ stress: 'low' | 'medium' | 'high' }> {
        // Placeholder: query PAL for emotional state
        // In real implementation, this would query PAL repository
        return { stress: 'low' };
    }

    private async logToEpisodicMemory(task: Task, result: TaskResult, newTasks: Task[]): Promise<void> {
        const log: ExecutionLog = {
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
        await unifiedMemorySystem.updateWorkingMemory(
            { orgId: 'default', userId: 'system' }, // Removed timestamp to match McpContext type
            log
        );
    }

    private async convertPatternToProcedure(result: TaskResult): Promise<void> {
        // Placeholder: convert successful patterns to procedural memory
        // In real implementation, this would extract rules and store them
        if (result.success && result.data) {
            // Pattern detected, could be converted to a production rule
        }
    }

    private taskToIntent(task: Task): any {
        return {
            type: task.type,
            operation: task.type,
            params: task.payload
        };
    }

    getExecutionHistory(): ExecutionLog[] {
        return [...this.executionHistory];
    }
}

// Export singleton instance
export const autonomousTaskEngine = new AutonomousTaskEngine();
