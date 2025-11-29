/**
 * WidgeTDC Mobile API Client
 * Communicates with the backend MCP system
 */

import axios, { AxiosInstance } from 'axios';

// Default to localhost for development - configure via env for production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private orgId: string = 'default';
  private userId: string = 'mobile-user';

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setContext(orgId: string, userId: string) {
    this.orgId = orgId;
    this.userId = userId;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // MCP Tool execution
  async executeTool(tool: string, payload: any = {}) {
    const message = {
      id: `mobile-${Date.now()}`,
      sourceId: 'mobile-app',
      targetId: tool,
      tool,
      payload: {
        ...payload,
        orgId: this.orgId,
        userId: this.userId,
      },
      createdAt: new Date().toISOString(),
    };

    const response = await this.client.post('/api/mcp/route', message);
    return response.data;
  }

  // Vidensarkiv (Knowledge Archive)
  async searchKnowledge(query: string, limit: number = 10) {
    return this.executeTool('vidensarkiv.search', { query, limit });
  }

  async addKnowledge(content: string, metadata: any = {}) {
    return this.executeTool('vidensarkiv.add', { content, metadata });
  }

  async getRelatedKnowledge(content: string, limit: number = 5) {
    return this.executeTool('vidensarkiv.get_related', { content, limit });
  }

  // Email RAG
  async analyzeEmail(subject: string, body: string) {
    return this.executeTool('email.rag', { 
      email: { subject, body } 
    });
  }

  // Notes
  async getNotes() {
    return this.executeTool('notes.list', {});
  }

  async createNote(title: string, body: string, tags: string[] = []) {
    return this.executeTool('notes.create', { title, body, tags });
  }

  async updateNote(id: string, updates: { title?: string; body?: string; tags?: string[] }) {
    return this.executeTool('notes.update', { id, ...updates });
  }

  async deleteNote(id: string) {
    return this.executeTool('notes.delete', { id });
  }

  // PAL (Personal Assistant & Learning)
  async recordEvent(eventType: string, data: any) {
    return this.executeTool('pal.event', { eventType, data });
  }

  async getWorkflowRecommendations() {
    return this.executeTool('pal.optimize-workflow', {});
  }

  async analyzeSentiment(text: string) {
    return this.executeTool('pal.analyze-sentiment', { text });
  }

  // Agents
  async triggerAgent(agentId: string, task: string) {
    return this.executeTool('trigger_agent', { agentId, task });
  }

  async getAgentStatus() {
    return this.executeTool('update_agent_status', { action: 'get' });
  }

  // TaskRecorder
  async getTaskSuggestions() {
    return this.executeTool('taskrecorder.get_suggestions', {});
  }

  async approveTask(suggestionId: string) {
    return this.executeTool('taskrecorder.approve', { suggestionId });
  }

  async rejectTask(suggestionId: string, reason?: string) {
    return this.executeTool('taskrecorder.reject', { suggestionId, reason });
  }

  // Graph RAG
  async queryGraphRAG(query: string, topK: number = 5) {
    return this.executeTool('autonomous.graphrag', { query, topK });
  }

  // SRAG (Structured RAG)
  async querySRAG(query: string) {
    return this.executeTool('srag.query', { query });
  }

  // Evolution
  async getPromptHistory() {
    return this.executeTool('evolution.get-prompt', {});
  }
}

export const apiClient = new ApiClient();
export default apiClient;

