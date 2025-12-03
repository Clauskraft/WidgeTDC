/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    CAPABILITY BROKER                                      ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Routes capability requests mellem agenter                                ║
 * ║  Bruger BÅDE Blackboard (async) og Neural Chat (sync)                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { neo4jAdapter } from '../../adapters/Neo4jAdapter.js';
import { neuralChatService } from './ChatService.js';
import { approvalGate } from './ApprovalGate.js';
import { AgentId } from './types.js';
import { 
    CapabilityRequest, 
    CapabilityResponse,
    AGENT_CAPABILITIES,
    AgentCapability 
} from './AgentCapabilities.js';

const DROPZONE_PATH = path.join(os.homedir(), 'Desktop', 'WidgeTDC_DropZone');

class CapabilityBroker {
    private static instance: CapabilityBroker;
    private pendingRequests: Map<string, CapabilityRequest> = new Map();

    private constructor() {}

    public static getInstance(): CapabilityBroker {
        if (!CapabilityBroker.instance) {
            CapabilityBroker.instance = new CapabilityBroker();
        }
        return CapabilityBroker.instance;
    }

    /**
     * Find den bedste agent til en given capability
     */
    findBestAgent(capabilityType: string): AgentCapability | null {
        for (const [agentId, capabilities] of Object.entries(AGENT_CAPABILITIES)) {
            const match = capabilities.find(c => 
                c.id === capabilityType || 
                c.name.toLowerCase().includes(capabilityType.toLowerCase()) ||
                c.category === capabilityType
            );
            if (match) return match;
        }
        return null;
    }

    /**
     * List alle capabilities for en agent
     */
    getAgentCapabilities(agent: AgentId): AgentCapability[] {
        return AGENT_CAPABILITIES[agent] || [];
    }

    /**
     * List ALLE capabilities på tværs af agenter
     */
    getAllCapabilities(): AgentCapability[] {
        return Object.values(AGENT_CAPABILITIES).flat();
    }

    /**
     * Request en capability fra en anden agent
     * CLAUDE REVIEWS ALL REQUESTS (delegeret fra CLAK)
     */
    async requestCapability(params: {
        fromAgent: AgentId;
        toAgent: AgentId;
        capability: string;
        params: Record<string, any>;
        priority?: 'low' | 'normal' | 'high' | 'critical';
        deadline?: string;
    }): Promise<CapabilityRequest & { approval?: any }> {
        
        // ════════════════════════════════════════════════════════════
        // STEP 1: Claude reviews the request (delegated from CLAK)
        // ════════════════════════════════════════════════════════════
        const approval = approvalGate.review({
            fromAgent: params.fromAgent,
            action: params.capability,
            description: `${params.fromAgent} wants to use ${params.capability} capability`,
            context: params.params
        });

        console.log(`🔍 [ApprovalGate] ${params.fromAgent} → ${params.capability}: ${approval.decision}`);

        // If escalation needed, notify and pause
        if (approval.decision === 'escalate_to_clak') {
            await neuralChatService.sendMessage({
                channel: 'alerts',
                from: 'system',
                body: `⚠️ ESCALATION REQUIRED\n\nAgent: ${params.fromAgent}\nAction: ${params.capability}\nReason: ${approval.reason}\n\n@clak please review and decide.`,
                type: 'alert',
                priority: 'critical',
                mentions: ['clak']
            });
            
            throw new Error(`Action requires CLAK approval: ${approval.reason}`);
        }

        // If rejected, notify and stop
        if (approval.decision === 'rejected') {
            await neuralChatService.sendMessage({
                channel: 'core-dev',
                from: 'claude',
                body: `❌ Request Denied\n\nFrom: ${params.fromAgent}\nAction: ${params.capability}\nReason: ${approval.reason}`,
                type: 'status',
                priority: 'normal'
            });
            
            throw new Error(`Request denied by Claude: ${approval.reason}`);
        }

        // ════════════════════════════════════════════════════════════
        // STEP 2: Approved - proceed with request
        // ════════════════════════════════════════════════════════════
        const request: CapabilityRequest = {
            requestId: `cap-${uuidv4()}`,
            fromAgent: params.fromAgent,
            toAgent: params.toAgent,
            capability: params.capability,
            params: params.params,
            priority: params.priority || 'normal',
            timestamp: new Date().toISOString(),
            deadline: params.deadline
        };

        // 1. Gem i memory
        this.pendingRequests.set(request.requestId, request);

        // 2. Gem i Blackboard (fil-baseret) for async pickup
        await this.saveToBlackboard(request);

        // 3. Gem i Neo4j for persistence og queries
        await this.persistToNeo4j(request);

        // 4. Send notifikation via Neural Chat (with approval note)
        const modNote = approval.modifications?.length 
            ? `\n📝 Notes: ${approval.modifications.join(', ')}` 
            : '';
            
        await neuralChatService.sendMessage({
            channel: 'core-dev',
            from: 'claude',
            body: `✅ Capability Request APPROVED\n\n🎯 ${params.capability}\nFrom: ${params.fromAgent} → To: ${params.toAgent}\nPriority: ${params.priority || 'normal'}\nRequest ID: ${request.requestId}${modNote}`,
            type: 'task',
            priority: params.priority || 'normal',
            mentions: [params.toAgent]
        });

        console.log(`✅ [CapabilityBroker] APPROVED: ${request.requestId}: ${params.fromAgent} → ${params.toAgent} (${params.capability})`);
        
        return { ...request, approval };
    }

    /**
     * Gem request i Blackboard (fil-system)
     */
    private async saveToBlackboard(request: CapabilityRequest): Promise<void> {
        const filename = `${request.timestamp.replace(/[:.]/g, '-')}_capability_${request.requestId}.json`;
        const inboxPath = path.join(DROPZONE_PATH, 'agents', request.toAgent, 'inbox', filename);
        
        try {
            await fs.mkdir(path.dirname(inboxPath), { recursive: true });
            await fs.writeFile(inboxPath, JSON.stringify({
                ...request,
                _type: 'capability_request',
                _blackboard_version: '2.0'
            }, null, 2));
        } catch (error) {
            console.warn('Failed to save to Blackboard:', error);
        }
    }

    /**
     * Persist request til Neo4j
     */
    private async persistToNeo4j(request: CapabilityRequest): Promise<void> {
        try {
            await neo4jAdapter.executeQuery(`
                CREATE (r:CapabilityRequest {
                    requestId: $requestId,
                    fromAgent: $fromAgent,
                    toAgent: $toAgent,
                    capability: $capability,
                    params: $params,
                    priority: $priority,
                    timestamp: $timestamp,
                    deadline: $deadline,
                    status: 'pending'
                })
                WITH r
                MATCH (from:Agent {name: $fromAgent})
                MATCH (to:Agent {name: $toAgent})
                MERGE (from)-[:REQUESTED]->(r)
                MERGE (r)-[:ASSIGNED_TO]->(to)
            `, {
                requestId: request.requestId,
                fromAgent: request.fromAgent,
                toAgent: request.toAgent,
                capability: request.capability,
                params: JSON.stringify(request.params),
                priority: request.priority,
                timestamp: request.timestamp,
                deadline: request.deadline || ''
            });
        } catch (error) {
            console.warn('Failed to persist to Neo4j:', error);
        }
    }

    /**
     * Besvar en capability request
     */
    async respondToCapability(params: {
        requestId: string;
        success: boolean;
        result?: any;
        error?: string;
        respondingAgent: AgentId;
    }): Promise<CapabilityResponse> {
        const response: CapabilityResponse = {
            requestId: params.requestId,
            success: params.success,
            result: params.result,
            error: params.error,
            timestamp: new Date().toISOString()
        };

        // Fjern fra pending
        const request = this.pendingRequests.get(params.requestId);
        this.pendingRequests.delete(params.requestId);

        // Opdater Neo4j
        try {
            await neo4jAdapter.executeQuery(`
                MATCH (r:CapabilityRequest {requestId: $requestId})
                SET r.status = $status,
                    r.response = $response,
                    r.completedAt = $completedAt
            `, {
                requestId: params.requestId,
                status: params.success ? 'completed' : 'failed',
                response: JSON.stringify(response),
                completedAt: response.timestamp
            });
        } catch (error) {
            console.warn('Failed to update Neo4j:', error);
        }

        // Notificer via Neural Chat
        if (request) {
            await neuralChatService.sendMessage({
                channel: 'core-dev',
                from: params.respondingAgent,
                body: `✅ Capability Response: ${params.requestId}\nStatus: ${params.success ? 'SUCCESS' : 'FAILED'}\n${params.error || ''}`,
                type: 'response',
                priority: 'normal',
                mentions: [request.fromAgent]
            });
        }

        return response;
    }

    /**
     * Hent pending requests for en agent
     */
    async getPendingRequests(agent: AgentId): Promise<CapabilityRequest[]> {
        try {
            const results = await neo4jAdapter.executeQuery(`
                MATCH (r:CapabilityRequest {toAgent: $agent, status: 'pending'})
                RETURN r
                ORDER BY r.timestamp DESC
            `, { agent });

            return results.map((row: any) => ({
                requestId: row.r.properties.requestId,
                fromAgent: row.r.properties.fromAgent,
                toAgent: row.r.properties.toAgent,
                capability: row.r.properties.capability,
                params: JSON.parse(row.r.properties.params || '{}'),
                priority: row.r.properties.priority,
                timestamp: row.r.properties.timestamp,
                deadline: row.r.properties.deadline
            }));
        } catch (error) {
            console.warn('Failed to fetch pending requests:', error);
            return Array.from(this.pendingRequests.values())
                .filter(r => r.toAgent === agent);
        }
    }

    /**
     * Smart routing: Find bedste agent til en opgave baseret på capability match
     */
    async smartRoute(params: {
        task: string;
        context?: string;
        fromAgent: AgentId;
    }): Promise<{ agent: AgentId; capability: AgentCapability; confidence: number } | null> {
        const allCapabilities = this.getAllCapabilities();
        
        // Simple keyword matching (kan udvides med embeddings)
        const taskLower = params.task.toLowerCase();
        
        let bestMatch: { agent: AgentId; capability: AgentCapability; confidence: number } | null = null;
        
        for (const cap of allCapabilities) {
            let score = 0;
            
            // Check name match
            if (taskLower.includes(cap.name.toLowerCase())) score += 0.5;
            
            // Check description match
            const descWords = cap.description.toLowerCase().split(' ');
            const matchingWords = descWords.filter(w => taskLower.includes(w) && w.length > 3);
            score += matchingWords.length * 0.1;
            
            // Check category match
            if (taskLower.includes(cap.category)) score += 0.3;
            
            // Factor in reliability
            score *= cap.reliability || 0.8;
            
            if (!bestMatch || score > bestMatch.confidence) {
                bestMatch = {
                    agent: cap.agent,
                    capability: cap,
                    confidence: Math.min(score, 1.0)
                };
            }
        }
        
        return bestMatch;
    }
}

export const capabilityBroker = CapabilityBroker.getInstance();

// Re-export types (use 'export type' for interfaces)
export { AGENT_CAPABILITIES } from './AgentCapabilities.js';
export type { AgentCapability, CapabilityRequest, CapabilityResponse } from './AgentCapabilities.js';
