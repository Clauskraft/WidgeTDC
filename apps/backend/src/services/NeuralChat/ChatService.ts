/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    NEURAL CHAT SERVICE                                    ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Core service for agent-to-agent real-time communication                  ║
 * ║  • Neo4j persistence for message history                                  ║
 * ║  • Channel management                                                     ║
 * ║  • Thread support                                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { v4 as uuidv4 } from 'uuid';
import { neo4jAdapter } from '../../adapters/Neo4jAdapter.js';
import { 
    ChatMessage, 
    Channel, 
    AgentId, 
    ChannelId, 
    MessageType,
    MessagePriority,
    DEFAULT_CHANNELS 
} from './types.js';

class NeuralChatService {
    private static instance: NeuralChatService;
    private channels: Map<ChannelId, Channel> = new Map();
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): NeuralChatService {
        if (!NeuralChatService.instance) {
            NeuralChatService.instance = new NeuralChatService();
        }
        return NeuralChatService.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        // Setup default channels
        for (const channel of DEFAULT_CHANNELS) {
            this.channels.set(channel.id, channel);
            // Persist to Neo4j
            await this.persistChannel(channel);
        }
        
        console.log('[NeuralChat] Service initialized');
        this.initialized = true;
    }

    private async persistChannel(channel: Channel): Promise<void> {
        try {
            await neo4jAdapter.executeQuery(`
                MERGE (c:Channel {id: $id})
                SET c.name = $name,
                    c.description = $description,
                    c.members = $members,
                    c.created_at = $created_at,
                    c.is_private = $is_private
            `, {
                id: channel.id,
                name: channel.name,
                description: channel.description || '',
                members: channel.members,
                created_at: channel.created_at,
                is_private: channel.is_private
            });
        } catch (error) {
            console.warn('Failed to persist channel to Neo4j:', error);
        }
    }

    async sendMessage(params: {
        channel: ChannelId;
        from: AgentId;
        body: string;
        type?: MessageType;
        priority?: MessagePriority;
        subject?: string;
        to?: AgentId | AgentId[];
        replyTo?: string;
        mentions?: AgentId[];
    }): Promise<ChatMessage> {
        const message: ChatMessage = {
            id: `msg-${uuidv4()}`,
            channel: params.channel,
            from: params.from,
            to: params.to,
            type: params.type || 'chat',
            priority: params.priority || 'normal',
            subject: params.subject,
            body: params.body,
            mentions: params.mentions || this.extractMentions(params.body),
            replyTo: params.replyTo,
            timestamp: new Date().toISOString(),
            read_by: [params.from]
        };

        // Persist to Neo4j
        await this.persistMessage(message);
        
        console.log(`[NeuralChat] [${message.channel}] ${message.from}: ${message.body.substring(0, 50)}...`);
        
        return message;
    }

    private extractMentions(body: string): AgentId[] {
        const mentionRegex = /@(claude|gemini|deepseek|clak)/gi;
        const matches = body.match(mentionRegex) || [];
        return [...new Set(matches.map(m => m.slice(1).toLowerCase() as AgentId))];
    }

    private async persistMessage(message: ChatMessage): Promise<void> {
        try {
            await neo4jAdapter.executeQuery(`
                CREATE (m:ChatMessage {
                    id: $id,
                    channel: $channel,
                    from_agent: $from,
                    to_agent: $to,
                    type: $type,
                    priority: $priority,
                    subject: $subject,
                    body: $body,
                    mentions: $mentions,
                    reply_to: $replyTo,
                    timestamp: $timestamp
                })
                WITH m
                MATCH (c:Channel {id: $channel})
                MERGE (c)-[:HAS_MESSAGE]->(m)
            `, {
                id: message.id,
                channel: message.channel,
                from: message.from,
                to: Array.isArray(message.to) ? message.to.join(',') : (message.to || ''),
                type: message.type,
                priority: message.priority,
                subject: message.subject || '',
                body: message.body,
                mentions: message.mentions || [],
                replyTo: message.replyTo || '',
                timestamp: message.timestamp
            });
        } catch (error) {
            console.warn('Failed to persist message to Neo4j:', error);
        }
    }

    async getMessages(params: {
        channel?: ChannelId;
        since?: string;
        limit?: number;
        agent?: AgentId;
    }): Promise<ChatMessage[]> {
        const limit = params.limit || 50;
        
        let query = `
            MATCH (m:ChatMessage)
            WHERE 1=1
        `;
        const queryParams: Record<string, unknown> = { limit };
        
        if (params.channel) {
            query += ` AND m.channel = $channel`;
            queryParams.channel = params.channel;
        }
        
        if (params.since) {
            query += ` AND m.timestamp > $since`;
            queryParams.since = params.since;
        }
        
        if (params.agent) {
            query += ` AND (m.from_agent = $agent OR $agent IN m.mentions OR m.to_agent CONTAINS $agent)`;
            queryParams.agent = params.agent;
        }
        
        query += ` RETURN m ORDER BY m.timestamp DESC LIMIT $limit`;
        
        try {
            const results = await neo4jAdapter.executeQuery(query, queryParams);
            return results.map((r: any) => ({
                id: r.m.properties.id,
                channel: r.m.properties.channel,
                from: r.m.properties.from_agent,
                to: r.m.properties.to_agent,
                type: r.m.properties.type,
                priority: r.m.properties.priority,
                subject: r.m.properties.subject,
                body: r.m.properties.body,
                mentions: r.m.properties.mentions,
                replyTo: r.m.properties.reply_to,
                timestamp: r.m.properties.timestamp
            }));
        } catch (error) {
            console.warn('Failed to fetch messages from Neo4j:', error);
            return [];
        }
    }

    getChannels(): Channel[] {
        return Array.from(this.channels.values());
    }

    getChannel(id: ChannelId): Channel | undefined {
        return this.channels.get(id);
    }
}

export const neuralChatService = NeuralChatService.getInstance();
