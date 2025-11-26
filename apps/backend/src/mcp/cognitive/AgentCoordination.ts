import { agentCommunicationProtocol, AgentMessage } from './AgentCommunication';

/**
 * Agent Capability Registry
 */
export interface AgentCapability {
    name: string;
    description: string;
    parameters: Record<string, any>;
    cost: number; // Resource cost
    reliability: number; // 0-1
}

export interface AgentProfile {
    id: string;
    name: string;
    capabilities: AgentCapability[];
    currentLoad: number; // 0-100
    maxLoad: number;
    specialization: string[];
    performance: {
        tasksCompleted: number;
        successRate: number;
        avgResponseTime: number;
    };
}

/**
 * Dynamic Agent Spawning System
 */
export class AgentSpawner {
    private agents: Map<string, AgentProfile> = new Map();
    private taskQueue: Array<{ task: any; requiredCapabilities: string[] }> = [];

    /**
     * Register an agent
     */
    registerAgent(profile: AgentProfile): void {
        this.agents.set(profile.id, profile);
    }

    /**
     * Spawn new agent based on workload
     */
    async spawnAgent(template: Partial<AgentProfile>): Promise<AgentProfile> {
        const newAgent: AgentProfile = {
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: template.name || 'Dynamic Agent',
            capabilities: template.capabilities || [],
            currentLoad: 0,
            maxLoad: template.maxLoad || 100,
            specialization: template.specialization || [],
            performance: {
                tasksCompleted: 0,
                successRate: 1.0,
                avgResponseTime: 0,
            },
        };

        this.registerAgent(newAgent);
        console.log(`✨ Spawned new agent: ${newAgent.id}`);

        return newAgent;
    }

    /**
     * Find best agent for task
     */
    findBestAgent(requiredCapabilities: string[]): AgentProfile | null {
        const candidates = Array.from(this.agents.values()).filter(agent => {
            // Check if agent has required capabilities
            const hasCapabilities = requiredCapabilities.every(required =>
                agent.capabilities.some(cap => cap.name === required)
            );

            // Check if agent has capacity
            const hasCapacity = agent.currentLoad < agent.maxLoad;

            return hasCapabilities && hasCapacity;
        });

        if (candidates.length === 0) return null;

        // Sort by performance and load
        candidates.sort((a, b) => {
            const scoreA = a.performance.successRate * (1 - a.currentLoad / a.maxLoad);
            const scoreB = b.performance.successRate * (1 - b.currentLoad / b.maxLoad);
            return scoreB - scoreA;
        });

        return candidates[0];
    }

    /**
     * Auto-scale agents based on workload
     */
    async autoScale(): Promise<void> {
        // Check if we need more agents
        const avgLoad = Array.from(this.agents.values())
            .reduce((sum, agent) => sum + agent.currentLoad, 0) / this.agents.size;

        if (avgLoad > 80) {
            // High load - spawn new agent
            const mostCommonSpecialization = this.getMostCommonSpecialization();
            await this.spawnAgent({
                specialization: [mostCommonSpecialization],
                maxLoad: 100,
            });
        } else if (avgLoad < 20 && this.agents.size > 1) {
            // Low load - consider removing agents
            this.removeIdleAgents();
        }
    }

    /**
     * Remove idle agents
     */
    private removeIdleAgents(): void {
        const idleAgents = Array.from(this.agents.values())
            .filter(agent => agent.currentLoad === 0 && agent.performance.tasksCompleted === 0);

        idleAgents.forEach(agent => {
            this.agents.delete(agent.id);
            console.log(`🗑️  Removed idle agent: ${agent.id}`);
        });
    }

    private getMostCommonSpecialization(): string {
        const specializations = Array.from(this.agents.values())
            .flatMap(agent => agent.specialization);

        const counts = specializations.reduce((acc, spec) => {
            acc[spec] = (acc[spec] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
    }

    /**
     * Get all agents
     */
    getAllAgents(): AgentProfile[] {
        return Array.from(this.agents.values());
    }

    /**
     * Update agent load
     */
    updateAgentLoad(agentId: string, load: number): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.currentLoad = Math.max(0, Math.min(100, load));
        }
    }
}

/**
 * Agent Specialization Learning
 */
export class AgentSpecializationLearner {
    private performanceHistory: Map<string, Array<{
        task: string;
        success: boolean;
        duration: number;
        timestamp: Date;
    }>> = new Map();

    /**
     * Record task performance
     */
    recordPerformance(
        agentId: string,
        task: string,
        success: boolean,
        duration: number
    ): void {
        if (!this.performanceHistory.has(agentId)) {
            this.performanceHistory.set(agentId, []);
        }

        this.performanceHistory.get(agentId)!.push({
            task,
            success,
            duration,
            timestamp: new Date(),
        });

        // Keep only last 100 records
        const history = this.performanceHistory.get(agentId)!;
        if (history.length > 100) {
            history.shift();
        }
    }

    /**
     * Identify agent specializations
     */
    identifySpecializations(agentId: string): string[] {
        const history = this.performanceHistory.get(agentId) || [];
        if (history.length < 10) return [];

        // Group by task type
        const taskPerformance = history.reduce((acc, record) => {
            if (!acc[record.task]) {
                acc[record.task] = { successes: 0, total: 0, avgDuration: 0 };
            }
            acc[record.task].total++;
            if (record.success) acc[record.task].successes++;
            acc[record.task].avgDuration += record.duration;
            return acc;
        }, {} as Record<string, { successes: number; total: number; avgDuration: number }>);

        // Calculate success rates
        Object.keys(taskPerformance).forEach(task => {
            const perf = taskPerformance[task];
            perf.avgDuration /= perf.total;
        });

        // Find tasks with high success rate and low duration
        const specializations = Object.entries(taskPerformance)
            .filter(([_, perf]) => {
                const successRate = perf.successes / perf.total;
                return successRate > 0.8 && perf.total >= 5;
            })
            .map(([task]) => task);

        return specializations;
    }

    /**
     * Recommend task assignment
     */
    recommendAgent(
        agents: AgentProfile[],
        task: string
    ): AgentProfile | null {
        const scores = agents.map(agent => {
            const history = this.performanceHistory.get(agent.id) || [];
            const taskHistory = history.filter(h => h.task === task);

            if (taskHistory.length === 0) {
                return { agent, score: 0.5 }; // Neutral score for unknown
            }

            const successRate = taskHistory.filter(h => h.success).length / taskHistory.length;
            const avgDuration = taskHistory.reduce((sum, h) => sum + h.duration, 0) / taskHistory.length;
            const recency = (Date.now() - taskHistory[taskHistory.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24);

            // Score based on success rate, speed, and recency
            const score = successRate * 0.6 + (1 / (avgDuration + 1)) * 0.3 + (1 / (recency + 1)) * 0.1;

            return { agent, score };
        });

        scores.sort((a, b) => b.score - a.score);
        return scores[0]?.agent || null;
    }
}

/**
 * Cross-Agent Knowledge Sharing
 */
export class KnowledgeSharing {
    private sharedKnowledge: Map<string, Array<{
        source: string;
        knowledge: any;
        timestamp: Date;
        usefulness: number;
    }>> = new Map();

    /**
     * Share knowledge
     */
    async shareKnowledge(
        fromAgent: string,
        topic: string,
        knowledge: any
    ): Promise<void> {
        if (!this.sharedKnowledge.has(topic)) {
            this.sharedKnowledge.set(topic, []);
        }

        this.sharedKnowledge.get(topic)!.push({
            source: fromAgent,
            knowledge,
            timestamp: new Date(),
            usefulness: 0,
        });

        // Broadcast to other agents
        await agentCommunicationProtocol.broadcast({
            from: fromAgent,
            type: 'broadcast',
            content: {
                topic,
                knowledge,
            },
            priority: 'low',
            metadata: { knowledgeSharing: true },
        });
    }

    /**
     * Query shared knowledge
     */
    queryKnowledge(topic: string, limit: number = 10): any[] {
        const knowledge = this.sharedKnowledge.get(topic) || [];

        // Sort by usefulness and recency
        return knowledge
            .sort((a, b) => {
                const scoreA = a.usefulness + (1 / ((Date.now() - a.timestamp.getTime()) / 1000 / 60 / 60 + 1));
                const scoreB = b.usefulness + (1 / ((Date.now() - b.timestamp.getTime()) / 1000 / 60 / 60 + 1));
                return scoreB - scoreA;
            })
            .slice(0, limit)
            .map(k => k.knowledge);
    }

    /**
     * Rate knowledge usefulness
     */
    rateKnowledge(topic: string, knowledgeIndex: number, rating: number): void {
        const knowledge = this.sharedKnowledge.get(topic);
        if (knowledge && knowledge[knowledgeIndex]) {
            knowledge[knowledgeIndex].usefulness = rating;
        }
    }
}

export const agentSpawner = new AgentSpawner();
export const specializationLearner = new AgentSpecializationLearner();
export const knowledgeSharing = new KnowledgeSharing();
