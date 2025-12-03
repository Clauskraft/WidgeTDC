/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    NEURAL CHAT - TYPE DEFINITIONS                         ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Real-time agent-to-agent communication system                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export type AgentId = 'claude' | 'claude-cli' | 'gemini' | 'deepseek' | 'clak' | 'system';
export type ChannelId = string;
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';
export type MessageType = 'chat' | 'task' | 'status' | 'alert' | 'handover' | 'response';

export interface ChatMessage {
    id: string;
    channel: ChannelId;
    from: AgentId;
    to?: AgentId | AgentId[];  // Optional - if not set, broadcast to channel
    type: MessageType;
    priority: MessagePriority;
    subject?: string;
    body: string;
    mentions?: AgentId[];
    replyTo?: string;  // Parent message ID for threads
    attachments?: MessageAttachment[];
    metadata?: Record<string, unknown>;
    timestamp: string;
    read_by?: AgentId[];
}

export interface MessageAttachment {
    type: 'code' | 'file' | 'node' | 'link';
    name: string;
    content?: string;
    url?: string;
    nodeId?: string;  // Neo4j node reference
}

export interface Channel {
    id: ChannelId;
    name: string;
    description?: string;
    members: AgentId[];
    created_at: string;
    created_by: AgentId;
    is_private: boolean;
}

export interface ChatThread {
    rootMessageId: string;
    messages: ChatMessage[];
    participants: AgentId[];
    lastActivity: string;
}

// Default channels
export const DEFAULT_CHANNELS: Channel[] = [
    {
        id: 'core-dev',
        name: '#core-dev',
        description: 'Core development discussions',
        members: ['claude', 'claude-cli', 'gemini', 'deepseek', 'clak'],
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_private: false
    },
    {
        id: 'standup',
        name: '#standup',
        description: 'Daily standups and status updates',
        members: ['claude', 'claude-cli', 'gemini', 'deepseek', 'clak'],
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_private: false
    },
    {
        id: 'alerts',
        name: '#alerts',
        description: 'System alerts and critical notifications',
        members: ['claude', 'claude-cli', 'gemini', 'deepseek', 'clak'],
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_private: false
    }
];
