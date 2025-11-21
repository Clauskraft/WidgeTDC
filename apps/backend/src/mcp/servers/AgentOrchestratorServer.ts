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
}

export class AgentOrchestratorServer implements MCPServer {
    name = 'AgentOrchestrator';
    version = '1.0.0';

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
                            agent_type: agent.role,
                            status: 'idle',
                            story_points: agent.story_points || 0,
                            block_number: agent.block_number || 0
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

            if (!this.agentStatuses.has(agentId)) {
                throw new Error(`Agent ${agentId} not found`);
            }

            const currentStatus = this.agentStatuses.get(agentId)!;
            this.agentStatuses.set(agentId, { ...currentStatus, status: 'running', lastRun: new Date().toISOString() });

            console.log(`[ORCHESTRATOR] Triggering agent: ${agentId}`);

            setTimeout(() => {
                this.agentStatuses.set(agentId, { ...currentStatus, status: 'completed', lastRun: new Date().toISOString() });
            }, 5000);

            return { success: true, message: `Agent ${agentId} triggered` };
        }

        if (name === 'update_agent_status') {
            const { agentId, status } = args;
            if (this.agentStatuses.has(agentId)) {
                const current = this.agentStatuses.get(agentId)!;
                this.agentStatuses.set(agentId, { ...current, status, lastRun: new Date().toISOString() });
                return { success: true };
            }
            throw new Error('Agent not found');
        }

        throw new Error(`Tool not found: ${name}`);
    }
}
