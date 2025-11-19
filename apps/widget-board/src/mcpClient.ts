import { getEnvConfig } from '@/utils/env-validation';

type MCPPayload = Record<string, unknown> | undefined;

const { API_BASE_URL } = getEnvConfig();
const API_PREFIX = API_BASE_URL?.replace(/\/$/, '') || '/api';

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`MCP request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export const mcpClient = {
  async call<T = unknown>(tool: string, payload: MCPPayload = undefined): Promise<T> {
    return postJson<T>('/mcp/call', { tool, payload });
  },

  async emit(event: string, payload: MCPPayload = undefined): Promise<void> {
    await postJson('/mcp/events', { event, payload });
  },
};

export type MCPClient = typeof mcpClient;
