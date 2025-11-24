// AutonomousTaskEngine – Phase 1 (BabyAGI loop)
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { eventBus } from '../EventBus.js';

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

    constructor(agent?: AutonomousAgent) {
        this.agent = agent || new AutonomousAgent();
        
        // Listen for system events to generate tasks
        eventBus.onEvent('system.alert', (event) => {
            this.queue.enqueue({ 
                type: 'diagnostic', 
                payload: event.payload,
                baseScore: 100,
                isMaintenanceTask: true
            }, 100);
        });
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
    }

    private async executeTask(task: Task): Promise<TaskResult> {
        try {
            const intent = this.taskToIntent(task);
            const result = await this.agent.executeAndLearn(intent, async (src) => {
                if ('query' in src && typeof src.query === 'function') {
                    return await src.query(intent.operation || task.type, intent.params || task.payload);
                }
                throw new Error(`Source ${src.name} does not support query operation`);
            });
            
            return {
                success: true,
                data: result.data,
                needsMoreData: false,
                foundPattern: false
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                needsMoreData: true
            };
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
            { orgId: 'default', userId: 'system', timestamp: new Date() },
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
