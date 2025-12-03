/**
 * ChatService Test Suite
 * Tests for Neural Chat messaging service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Neo4j
vi.mock('../../adapters/Neo4jAdapter.js', () => ({
    neo4jAdapter: {
        runQuery: vi.fn().mockResolvedValue([]),
        executeQuery: vi.fn().mockResolvedValue([])
    }
}));

describe('ChatService', () => {
    let chatService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await import('../../services/NeuralChat/ChatService.js');
        chatService = module.neuralChatService;
        (chatService as any).channels = new Map();
    });

    describe('sendMessage()', () => {
        it('should create message with correct structure', async () => {
            const { neo4jAdapter } = await import('../../adapters/Neo4jAdapter.js');
            
            const result = await chatService.sendMessage({
                channel: 'core-dev',
                body: 'Test message',
                from: 'claude',
                type: 'chat'
            });

            expect(neo4jAdapter.executeQuery).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result.body).toBe('Test message');
            expect(result.from).toBe('claude');
        });

        it('should extract mentions from message body', async () => {
            const result = await chatService.sendMessage({
                channel: 'core-dev',
                body: 'Hey @gemini, check this out @deepseek',
                from: 'claude',
                type: 'chat'
            });

            expect(result.mentions).toContain('gemini');
            expect(result.mentions).toContain('deepseek');
        });
    });

    describe('getMessages()', () => {
        it('should filter messages by channel', async () => {
            const { neo4jAdapter } = await import('../../adapters/Neo4jAdapter.js');
            (neo4jAdapter.executeQuery as any).mockResolvedValue([
                { m: { properties: { id: 'msg-1', channel: 'core-dev', body: 'Test 1', from_agent: 'codex', to_agent: '', type: 'chat', priority: 'normal', subject: '', mentions: [], reply_to: null, timestamp: Date.now() } } },
                { m: { properties: { id: 'msg-2', channel: 'core-dev', body: 'Test 2', from_agent: 'codex', to_agent: '', type: 'chat', priority: 'normal', subject: '', mentions: [], reply_to: null, timestamp: Date.now() } } }
            ]);

            const messages = await chatService.getMessages({ channel: 'core-dev' });

            expect(messages).toHaveLength(2);
            expect(messages[0].channel).toBe('core-dev');
        });

        it('should respect limit parameter', async () => {
            await chatService.getMessages({ channel: 'core-dev', limit: 5 });
            
            const { neo4jAdapter } = await import('../../adapters/Neo4jAdapter.js');
            const lastCall = (neo4jAdapter.executeQuery as any).mock.calls.pop();
            expect(lastCall[1].limit).toBe(5);
        });
    });

    describe('getChannels()', () => {
        it('should return list of channels', async () => {
            (chatService as any).channels = new Map([
                ['core-dev', { id: 'core-dev', name: 'core-dev', description: 'Core development', members: [], created_at: '', is_private: false }],
                ['standup', { id: 'standup', name: 'standup', description: 'Daily standup', members: [], created_at: '', is_private: false }]
            ]);

            const channels = chatService.getChannels();

            expect(channels).toHaveLength(2);
            expect(channels[0].name).toBe('core-dev');
        });
    });
});
