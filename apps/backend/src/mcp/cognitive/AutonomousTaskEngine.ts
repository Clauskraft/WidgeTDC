// AutonomousTaskEngine – Phase 1 (BabyAGI loop)
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { EventBus } from '../EventBus.js';

type Task = {
    type: string;
    payload: any;
};

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
}

export class AutonomousTaskEngine {
    private agent = new AutonomousAgent();
    private queue = new PriorityQueue<Task>();
    private active = true;

    constructor() {
        // listen for system events to generate tasks
        EventBus.on('system:error', (err) => this.queue.enqueue({ type: 'diagnostic', payload: err }, 100));
        EventBus.on('widget:error', ({ widgetId, error }) =>
            this.queue.enqueue({ type: 'widget_fix', payload: { widgetId, error } }, 90)
        );
    }

    async start() {
        while (this.active) {
            if (this.queue.isEmpty()) {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
            }
            const task = this.queue.dequeue()!;
            const intent = this.taskToIntent(task);
            const result = await this.agent.executeAndLearn(intent, async (src) => src.execute(task.payload));
            // log result to memory
            await unifiedMemorySystem.updateWorkingMemory({ orgId: 'default', userId: 'system', timestamp: new Date() }, result);
        }
    }

    private taskToIntent(task: Task) {
        // simple mapping – can be expanded
        return { tool: task.type, payload: task.payload } as any;
    }
}
