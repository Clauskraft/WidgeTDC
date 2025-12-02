/**
 * Advanced Agent Communication Protocol
 * Enables sophisticated inter-agent communication and coordination
 */
export class AgentCommunicationProtocol {
    constructor() {
        this.messageQueue = new Map();
        this.subscriptions = new Map();
        this.negotiationHistory = new Map();
    }
    /**
     * Send message to specific agent(s)
     */
    async sendMessage(message) {
        const fullMessage = {
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
            this.messageQueue.get(recipient).push(fullMessage);
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
    async receiveMessages(agentId, filter) {
        const messages = this.messageQueue.get(agentId) || [];
        if (!filter)
            return messages;
        return messages.filter(msg => {
            return Object.entries(filter).every(([key, value]) => {
                return msg[key] === value;
            });
        });
    }
    /**
     * Subscribe to messages
     */
    subscribe(agentId, callback) {
        if (!this.subscriptions.has(agentId)) {
            this.subscriptions.set(agentId, new Set());
        }
        this.subscriptions.get(agentId).add(callback);
        // Return unsubscribe function
        return () => {
            this.subscriptions.get(agentId)?.delete(callback);
        };
    }
    /**
     * Broadcast message to all agents
     */
    async broadcast(message) {
        return this.sendMessage({
            ...message,
            to: 'broadcast',
        });
    }
    /**
     * Request-response pattern
     */
    async request(from, to, content, timeout = 30000) {
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
    async respond(originalMessage, response) {
        return this.sendMessage({
            from: originalMessage.to,
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
    async proposeNegotiation(proposal) {
        if (!this.negotiationHistory.has(proposal.proposer)) {
            this.negotiationHistory.set(proposal.proposer, []);
        }
        this.negotiationHistory.get(proposal.proposer).push(proposal);
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
    async respondToNegotiation(proposal, response) {
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
    async delegateTask(from, to, task, priority = 'medium') {
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
    clearOldMessages(agentId, olderThan) {
        const messages = this.messageQueue.get(agentId);
        if (messages) {
            const filtered = messages.filter(msg => msg.timestamp > olderThan);
            this.messageQueue.set(agentId, filtered);
        }
    }
    /**
     * Get message statistics
     */
    getStatistics(agentId) {
        const messages = this.messageQueue.get(agentId) || [];
        return {
            totalMessages: messages.length,
            byType: messages.reduce((acc, msg) => {
                acc[msg.type] = (acc[msg.type] || 0) + 1;
                return acc;
            }, {}),
            byPriority: messages.reduce((acc, msg) => {
                acc[msg.priority] = (acc[msg.priority] || 0) + 1;
                return acc;
            }, {}),
        };
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
export const agentCommunicationProtocol = new AgentCommunicationProtocol();
