import { InfoItem, WidgetTDCStatus, GraphData, AgentCapability, AgentTask } from '../types';

const BASE_URL = 'http://localhost:3002';

class WidgetTDCClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.initWebSocket();
  }

  // WebSocket connection
  private initWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:3002/ws');
      
      this.ws.onopen = () => {
        console.log('WidgetTDC WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data.type, data.payload);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WidgetTDC WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to init WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.initWebSocket(), delay);
    }
  }

  private handleEvent(type: string, payload: unknown) {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }

  on(event: string, handler: (data: unknown) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: unknown) => void) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  // Health check
  async getStatus(): Promise<WidgetTDCStatus> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      
      const data = await response.json();
      
      // Get Neo4j stats
      let nodeCount = 0;
      let relationshipCount = 0;
      try {
        const statsResponse = await fetch(`${BASE_URL}/api/neo4j/stats`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          nodeCount = stats.nodeCount || 0;
          relationshipCount = stats.relationshipCount || 0;
        }
      } catch {
        // Neo4j might not be available
      }

      // Get available agents
      let agentsAvailable: string[] = [];
      try {
        const agentsResponse = await fetch(`${BASE_URL}/api/agents`);
        if (agentsResponse.ok) {
          const agents = await agentsResponse.json();
          agentsAvailable = agents.map((a: { id: string }) => a.id);
        }
      } catch {
        // Agents endpoint might not be available
        agentsAvailable = ['claude', 'gemini', 'deepseek', 'clak'];
      }

      return {
        connected: true,
        neo4jConnected: data.neo4j?.connected || false,
        agentsAvailable,
        nodeCount,
        relationshipCount,
      };
    } catch {
      return {
        connected: false,
        neo4jConnected: false,
        agentsAvailable: [],
        nodeCount: 0,
        relationshipCount: 0,
      };
    }
  }

  // Graph data from Neo4j
  async getGraphData(): Promise<GraphData> {
    try {
      const response = await fetch(`${BASE_URL}/api/neo4j/graph`);
      if (!response.ok) throw new Error('Failed to fetch graph');
      
      const data = await response.json();
      return {
        nodes: data.nodes || [],
        links: data.relationships || data.links || [],
      };
    } catch (error) {
      console.error('Failed to get graph data:', error);
      return { nodes: [], links: [] };
    }
  }

  // InfoItem CRUD operations
  async createInfoItem(item: InfoItem): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/neo4j/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labels: ['InfoItem', item.type.charAt(0).toUpperCase() + item.type.slice(1)],
        properties: {
          id: item.id,
          title: item.title,
          content: item.content,
          type: item.type,
          tags: item.tags,
          priority: item.priority,
          status: item.status,
          securityLevel: item.securityLevel,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to create info item');
    const data = await response.json();
    return data.id || data.neo4jId;
  }

  async updateInfoItem(neo4jId: string, updates: Partial<InfoItem>): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/neo4j/nodes/${neo4jId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to update info item');
  }

  async deleteInfoItem(neo4jId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/neo4j/nodes/${neo4jId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete info item');
  }

  async getInfoItems(filter?: { type?: string; groupId?: string }): Promise<InfoItem[]> {
    let url = `${BASE_URL}/api/neo4j/nodes?label=InfoItem`;
    if (filter?.type) url += `&type=${filter.type}`;
    if (filter?.groupId) url += `&groupId=${filter.groupId}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch info items');
    
    const data = await response.json();
    return data.nodes || [];
  }

  // Relationship management
  async createRelationship(
    sourceId: string, 
    targetId: string, 
    type: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/neo4j/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId,
        targetId,
        type,
        properties,
      }),
    });

    if (!response.ok) throw new Error('Failed to create relationship');
  }

  async getRelatedItems(nodeId: string): Promise<InfoItem[]> {
    const response = await fetch(`${BASE_URL}/api/neo4j/nodes/${nodeId}/related`);
    if (!response.ok) throw new Error('Failed to fetch related items');
    
    const data = await response.json();
    return data.nodes || [];
  }

  // Agent operations
  async getAgentCapabilities(): Promise<AgentCapability[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/agents/capabilities`);
      if (!response.ok) return this.getDefaultCapabilities();
      
      const data = await response.json();
      return data.capabilities || [];
    } catch {
      return this.getDefaultCapabilities();
    }
  }

  private getDefaultCapabilities(): AgentCapability[] {
    return [
      { id: 'analyze', name: 'Analyze', description: 'Analyze content', agent: 'claude' },
      { id: 'search', name: 'Search', description: 'Web search', agent: 'gemini' },
      { id: 'code', name: 'Code', description: 'Code assistance', agent: 'deepseek' },
      { id: 'automate', name: 'Automate', description: 'Task automation', agent: 'clak' },
    ];
  }

  async routeTask(
    description: string, 
    agent: string,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      channel?: string;
      context?: Record<string, unknown>;
    }
  ): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/agents/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        agent,
        priority: options?.priority || 'normal',
        channel: options?.channel || 'default',
        context: options?.context,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      // Fallback: try direct agent call
      return this.directAgentCall(description, agent);
    }

    const data = await response.json();
    return data.taskId;
  }

  private async directAgentCall(description: string, agent: string): Promise<string> {
    // Direct call to agent if task routing not available
    const response = await fetch(`${BASE_URL}/api/agents/${agent}/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: description }),
    });

    if (!response.ok) throw new Error(`Failed to call agent ${agent}`);
    
    const data = await response.json();
    return data.response || data.result || 'Task submitted';
  }

  async getRecentTasks(): Promise<AgentTask[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/agents/tasks/recent`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.tasks || [];
    } catch {
      return [];
    }
  }

  async sendToChannel(channel: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/channels/${channel}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error('Failed to send to channel');
  }

  // Associative memory search
  async searchAssociative(query: string, limit = 10): Promise<InfoItem[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/neo4j/search/associative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  // Cypher query
  async runCypher(query: string, params?: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${BASE_URL}/api/neo4j/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });

    if (!response.ok) throw new Error('Cypher query failed');
    return response.json();
  }
}

export const widgetTDCClient = new WidgetTDCClient();
