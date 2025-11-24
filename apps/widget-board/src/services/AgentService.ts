import { PlatformServices } from '../platform/core/PlatformContext';

export class AgentService {
    private baseUrl = '/api/mcp';

    async getAgentStatus(): Promise<any[]> {
        try {
            // Use the MCP resources endpoint via the backend proxy
            const response = await fetch(`${this.baseUrl}/resources?uri=agents://status`);
            if (!response.ok) throw new Error('Failed to fetch agent status');

            const data = await response.json();
            let agentsData = data.data;

            // Handle potential stringified content
            if (!agentsData && data.content) {
                try {
                    agentsData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                } catch (e) {
                    console.error("Failed to parse agent status content", e);
                    return [];
                }
            }

            return Array.isArray(agentsData) ? agentsData : [];
        } catch (error) {
            console.error('Error fetching agent status:', error);
            return [];
        }
    }

    async triggerAgent(agentId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool: 'trigger_agent',
                    payload: { agentId }
                })
            });

            if (!response.ok) throw new Error('Failed to trigger agent');
            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Error triggering agent:', error);
            return false;
        }
    }
    subscribeToStatus(onUpdate: (agents: any[]) => void): () => void {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In development, we might need to point directly to backend port if proxy isn't set up for WS
        // For now, let's try to use the direct backend port 3001 as per common dev setup
        const wsUrl = `ws://localhost:3001/mcp/ws`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to Agent Status WebSocket');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                // Handle broadcast messages
                if (message.type === 'broadcast' &&
                    message.message?.type === 'resource_updated' &&
                    message.message?.uri === 'agents://status') {

                    const content = message.message.content;
                    if (Array.isArray(content)) {
                        onUpdate(content);
                    }
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('Agent WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }
}
