/**
 * Advanced Agent Communication Protocol
 * Enables sophisticated inter-agent communication and coordination
 */

export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[]; // Single agent or broadcast
    type: 'request' | 'response' | 'broadcast' | 'negotiation' | 'delegation';
    content: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    correlationId?: string; // For request-response pairing
    metadata?: Record<string, any>;
}

export interface NegotiationProposal {
    proposalId: string;
    proposer: string;
    task: string;
    terms: Record<string, any>;
    deadline?: Date;
    requiredCapabilities: string[];
}

export interface NegotiationResponse {
    proposalId: string;
    responder: string;
    accepted: boolean;
    counterProposal?: Partial<NegotiationProposal>;
    reason?: string;
}

export class AgentCommunicationProtocol {
    private messageQueue: Map<string, AgentMessage[]> = new Map();
    private subscriptions: Map<string, Set<(msg: AgentMessage) => void>> = new Map();
    private negotiationHistory: Map<string, NegotiationProposal[]> = new Map();

    /**
     * Send message to specific agent(s)
     */
    async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<string> {
        const fullMessage: AgentMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: new Date(),
        };

        // Store in queue
        const recipients = Array.isArray(message.to) ? message.to : [message.to];
        recipients.forEach(recipient => {
            if (!this.messageQueue.has(recipient)) {
                this.messageQueue.set(recipient, []);
            }
            this.messageQueue.get(recipient)!.push(fullMessage);
        });

        // Notify subscribers
        recipients.forEach(recipient => {
            const subscribers = this.subscriptions.get(recipient);
            if (subscribers) {
                subscribers.forEach(callback => callback(fullMessage));
            }
        });

        return fullMessage.id;
    }

    /**
     * Receive messages for an agent
     */
    async receiveMessages(agentId: string, filter?: Partial<AgentMessage>): Promise<AgentMessage[]> {
        const messages = this.messageQueue.get(agentId) || [];

        if (!filter) return messages;

        return messages.filter(msg => {
            return Object.entries(filter).every(([key, value]) => {
                return msg[key as keyof AgentMessage] === value;
            });
        });
    }

    /**
     * Subscribe to messages
     */
    subscribe(agentId: string, callback: (msg: AgentMessage) => void): () => void {
        if (!this.subscriptions.has(agentId)) {
            this.subscriptions.set(agentId, new Set());
        }
        this.subscriptions.get(agentId)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.subscriptions.get(agentId)?.delete(callback);
        };
    }

    /**
     * Broadcast message to all agents
     */
    async broadcast(message: Omit<AgentMessage, 'id' | 'timestamp' | 'to'>): Promise<string> {
        return this.sendMessage({
            ...message,
            to: 'broadcast',
        });
    }

    /**
     * Request-response pattern
     */
    async request(
        from: string,
        to: string,
        content: any,
        timeout: number = 30000
    ): Promise<AgentMessage | null> {
        const correlationId = this.generateMessageId();

        await this.sendMessage({
            from,
            to,
            type: 'request',
            content,
            priority: 'medium',
            correlationId,
        });

        // Wait for response
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                unsubscribe();
                resolve(null);
            }, timeout);

            const unsubscribe = this.subscribe(from, (msg) => {
                if (msg.type === 'response' && msg.correlationId === correlationId) {
                    clearTimeout(timeoutId);
                    unsubscribe();
                    resolve(msg);
                }
            });
        });
    }

    /**
     * Respond to a request
     */
    async respond(originalMessage: AgentMessage, response: any): Promise<string> {
        return this.sendMessage({
            from: originalMessage.to as string,
            to: originalMessage.from,
            type: 'response',
            content: response,
            priority: originalMessage.priority,
            correlationId: originalMessage.correlationId,
        });
    }

    /**
     * Initiate negotiation
     */
    async proposeNegotiation(proposal: NegotiationProposal): Promise<string> {
        if (!this.negotiationHistory.has(proposal.proposer)) {
            this.negotiationHistory.set(proposal.proposer, []);
        }
        this.negotiationHistory.get(proposal.proposer)!.push(proposal);

        return this.broadcast({
            from: proposal.proposer,
            type: 'negotiation',
            content: proposal,
            priority: 'high',
        });
    }

    /**
     * Respond to negotiation
     */
    async respondToNegotiation(
        proposal: NegotiationProposal,
        response: NegotiationResponse
    ): Promise<string> {
        return this.sendMessage({
            from: response.responder,
            to: proposal.proposer,
            type: 'response',
            content: response,
            priority: 'high',
            metadata: { negotiation: true },
        });
    }

    /**
     * Delegate task to another agent
     */
    async delegateTask(
        from: string,
        to: string,
        task: any,
        priority: AgentMessage['priority'] = 'medium'
    ): Promise<string> {
        return this.sendMessage({
            from,
            to,
            type: 'delegation',
            content: task,
            priority,
        });
    }

    /**
     * Clear old messages
     */
    clearOldMessages(agentId: string, olderThan: Date): void {
        const messages = this.messageQueue.get(agentId);
        if (messages) {
            const filtered = messages.filter(msg => msg.timestamp > olderThan);
            this.messageQueue.set(agentId, filtered);
        }
    }

    /**
     * Get message statistics
     */
    getStatistics(agentId: string): {
        totalMessages: number;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
    } {
        const messages = this.messageQueue.get(agentId) || [];

        return {
            totalMessages: messages.length,
            byType: messages.reduce((acc, msg) => {
                acc[msg.type] = (acc[msg.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byPriority: messages.reduce((acc, msg) => {
                acc[msg.priority] = (acc[msg.priority] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const agentCommunicationProtocol = new AgentCommunicationProtocol();
