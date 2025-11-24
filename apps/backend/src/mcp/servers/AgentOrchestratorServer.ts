import { MCPServer, Resource, Tool } from '@widget-tdc/mcp-types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

interface AgentStatus {
    id: string;
    name: string;
    agent_type: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    lastRun?: string;
    story_points: number;
    block_number: number;
    dependencies: {
        blocks: number[];
    };
}

export class AgentOrchestratorServer implements MCPServer {
    name = 'AgentOrchestrator';
    version = '1.1.0';

    private registryPath = join(process.cwd(), '../../agents/registry.yml');
    private agentStatuses: Map<string, AgentStatus> = new Map();

    constructor() {
        this.initializeStatus();
    }

    private initializeStatus() {
        try {
            if (existsSync(this.registryPath)) {
                const fileContents = readFileSync(this.registryPath, 'utf8');
                const data = yaml.load(fileContents) as any;

                if (data && data.agents) {
                    console.log(`[ORCHESTRATOR] Found ${data.agents.length} agents in registry`);
                    data.agents.forEach((agent: any) => {
                        this.agentStatuses.set(agent.id, {
                            id: agent.id,
                            name: agent.name,
                            agent_type: agent.agent_type || agent.role,
                            status: 'idle',
                            story_points: agent.story_points || 0,
                            block_number: agent.block_number || 0,
                            dependencies: agent.dependencies || { blocks: [] }
                        });
                    });
                }
            } else {
                console.warn(`Registry file not found at: ${this.registryPath}`);
            }
        } catch (error) {
            console.error('Failed to initialize agent statuses:', error);
        }
    }

    private async checkAndTriggerDependents(completedAgentId: string) {
        const completedAgent = this.agentStatuses.get(completedAgentId);
        if (!completedAgent) return;

        console.log(`[ORCHESTRATOR] Agent ${completedAgent.name} (${completedAgentId}) completed. Checking dependents...`);

        // Find agents that might depend on this one (or its block)
        for (const [id, agent] of this.agentStatuses.entries()) {
            if (agent.status !== 'idle') continue; // Only trigger idle agents

            // Check if this agent depends on the completed block
            const dependsOnBlock = agent.dependencies.blocks.includes(completedAgent.block_number);

            if (dependsOnBlock) {
                // Verify ALL dependencies are met
                const allMet = agent.dependencies.blocks.every(blockNum => {
                    // Find all agents in that block
                    const agentsInBlock = Array.from(this.agentStatuses.values())
                        .filter(a => a.block_number === blockNum);

                    // If any agent in the required block is NOT completed, dependency is not met
                    // (Assuming block completion requires all agents in block to complete)
                    return agentsInBlock.every(a => a.status === 'completed');
                });

                if (allMet) {
                    console.log(`[ORCHESTRATOR] Dependencies met for ${agent.name}. Cascading trigger...`);
                    await this.triggerAgent(id);
                }
            }
        }
    }

    private workflowMapping: Record<string, string> = {
        'dashboard-shell-ui': 'agent-block-1-dashboard.yml',
        'widget-registry-v2': 'agent-block-2-registry.yml',
        'audit-log-hash-chain': 'agent-block-3-audit.yml',
        'database-foundation': 'agent-block-4-foundation.yml',
        'testing-infrastructure': 'agent-block-5-testing.yml',
        'security-compliance': 'agent-block-6-security.yml',
    };

    private broadcastCallback?: (message: any) => void;

    public setBroadcaster(callback: (message: any) => void) {
        this.broadcastCallback = callback;
    }

    private broadcastStatusUpdate() {
        if (this.broadcastCallback) {
            const statuses = Array.from(this.agentStatuses.values());
            this.broadcastCallback({
                type: 'resource_updated',
                uri: 'agents://status',
                content: statuses
            });
        }
    }

    private async triggerAgent(agentId: string) {
        if (!this.agentStatuses.has(agentId)) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const currentStatus = this.agentStatuses.get(agentId)!;
        this.agentStatuses.set(agentId, { ...currentStatus, status: 'running', lastRun: new Date().toISOString() });
        this.broadcastStatusUpdate();

        console.log(`[ORCHESTRATOR] 🚀 Starting Agent: ${currentStatus.name} (Block ${currentStatus.block_number})`);

        const workflowFile = this.workflowMapping[agentId];
        if (workflowFile) {
            console.log(`[ORCHESTRATOR] ☁️ Triggering GitHub Workflow: ${workflowFile}`);
            try {
                // Execute gh workflow run
                const { exec } = require('child_process');
                exec(`gh workflow run ${workflowFile}`, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(`[ORCHESTRATOR] ❌ Failed to trigger workflow: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.warn(`[ORCHESTRATOR] ⚠️ Workflow trigger warning: ${stderr}`);
                    }
                    console.log(`[ORCHESTRATOR] ✅ Workflow triggered successfully for ${currentStatus.name}`);
                });
            } catch (err) {
                console.error(`[ORCHESTRATOR] ❌ Error executing gh command:`, err);
            }
        } else {
            console.warn(`[ORCHESTRATOR] ⚠️ No workflow mapping found for ${agentId}. Running in simulation mode only.`);
        }

        // Simulate agent execution (Mocking "Hanspetter" handing off the task)
        // In a real scenario, we should poll for the workflow completion or wait for a webhook.
        // For now, we keep the simulation to allow the cascade to demonstrate the flow locally,
        // but we increase the timeout to 10 seconds to allow the workflow trigger to complete.
        setTimeout(() => {
            console.log(`[ORCHESTRATOR] ✅ Agent Finished (Local Simulation): ${currentStatus.name}`);
            this.agentStatuses.set(agentId, { ...currentStatus, status: 'completed', lastRun: new Date().toISOString() });
            this.broadcastStatusUpdate();

            // Trigger cascade
            this.checkAndTriggerDependents(agentId);
        }, 10000); // 10 second simulation
    }

    async listResources(): Promise<Resource[]> {
        return [
            {
                uri: 'agents://registry',
                name: 'Agent Registry',
                mimeType: 'application/yaml',
                description: 'The full configuration of all registered agents'
            },
            {
                uri: 'agents://status',
                name: 'Agent Status Live',
                mimeType: 'application/json',
                description: 'Real-time status of all agents'
            }
        ];
    }

    async readResource(uri: string): Promise<string | Buffer> {
        if (uri === 'agents://registry') {
            if (existsSync(this.registryPath)) {
                return readFileSync(this.registryPath, 'utf8');
            }
            throw new Error('Registry file not found');
        }

        if (uri === 'agents://status') {
            const statuses = Array.from(this.agentStatuses.values());
            return JSON.stringify(statuses, null, 2);
        }

        throw new Error(`Resource not found: ${uri}`);
    }

    async listTools(): Promise<Tool[]> {
        return [
            {
                name: 'trigger_agent',
                description: 'Trigger a specific agent workflow',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: { type: 'string', description: 'ID of the agent to trigger' }
                    },
                    required: ['agentId']
                }
            },
            {
                name: 'start_hanspetter_listener',
                description: 'Start the GitHub event listener (Hanspetter) to initiate the cascade',
                inputSchema: {
                    type: 'object',
                    properties: {
                        event: { type: 'string', description: 'Event type (e.g., push, workflow_dispatch)' }
                    }
                }
            },
            {
                name: 'update_agent_status',
                description: 'Manually update agent status (used by callbacks)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: { type: 'string' },
                        status: { type: 'string', enum: ['idle', 'running', 'completed', 'failed'] }
                    },
                    required: ['agentId', 'status']
                }
            }
        ];
    }

    async callTool(name: string, args: any): Promise<any> {
        if (name === 'trigger_agent') {
            const { agentId } = args;
            await this.triggerAgent(agentId);
            return { success: true, message: `Agent ${agentId} triggered` };
        }

        if (name === 'start_hanspetter_listener') {
            console.log('[ORCHESTRATOR] 👂 Hanspetter is listening for GitHub events...');

            // Find agents with NO block dependencies (Block 1 usually)
            const startAgents = Array.from(this.agentStatuses.values())
                .filter(a => a.dependencies.blocks.length === 0);

            if (startAgents.length === 0) {
                return { success: false, message: 'No entry-point agents found.' };
            }

            console.log(`[ORCHESTRATOR] Hanspetter received signal! Dispatching to ${startAgents.length} agents.`);

            for (const agent of startAgents) {
                await this.triggerAgent(agent.id);
            }

            return { success: true, message: `Cascade started with ${startAgents.map(a => a.name).join(', ')}` };
        }

        if (name === 'update_agent_status') {
            const { agentId, status } = args;
            if (this.agentStatuses.has(agentId)) {
                const current = this.agentStatuses.get(agentId)!;
                this.agentStatuses.set(agentId, { ...current, status, lastRun: new Date().toISOString() });
                this.broadcastStatusUpdate();

                // If manually completed, check cascade
                if (status === 'completed') {
                    this.checkAndTriggerDependents(agentId);
                }

                return { success: true };
            }
            throw new Error('Agent not found');
        }

        throw new Error(`Tool not found: ${name}`);
    }
}
