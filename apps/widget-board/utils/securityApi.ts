const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
const API_BASE_URL = (import.meta.env.VITE_WIDGET_API_URL as string | undefined) ?? defaultOrigin;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Security API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface SecurityFeedsPayload {
  feeds: any[];
  pipelineStages: any[];
  normalizedDocuments: any[];
  metrics: any;
  archive: any;
  environment: {
    openSearchConnected: boolean;
    minioConnected: boolean;
  };
}

export interface SecurityTemplatesPayload {
  templates: any[];
}

export interface SecurityHistoryPayload {
  history: any[];
}

export async function fetchSecurityFeeds(): Promise<SecurityFeedsPayload> {
  return request<SecurityFeedsPayload>('/api/security/feeds');
}

export async function fetchSecurityTemplates(): Promise<SecurityTemplatesPayload> {
  return request<SecurityTemplatesPayload>('/api/security/search/templates');
}

export async function fetchSecuritySearchHistory(limit = 6): Promise<SecurityHistoryPayload> {
  return request<SecurityHistoryPayload>(`/api/security/search/history?limit=${limit}`);
}

export async function runSecuritySearch(body: {
  query: string;
  severity: string;
  timeframe: string;
  sources: string[];
}): Promise<any> {
  return request('/api/security/search/query', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchSecurityActivity(params: { severity?: string; category?: string; limit?: number } = {}): Promise<any> {
  const url = new URL('/api/security/activity', API_BASE_URL);
  if (params.severity) url.searchParams.set('severity', params.severity);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch activity events');
  return response.json();
}

export async function acknowledgeActivityEvent(id: string, acknowledged: boolean): Promise<any> {
  return request(`/api/security/activity/${id}/ack`, {
    method: 'POST',
    body: JSON.stringify({ acknowledged }),
  });
}

export function getActivityStreamUrl(severity?: string, category?: string): string {
  const url = new URL('/api/security/activity/stream', API_BASE_URL);
  if (severity) url.searchParams.set('severity', severity);
  if (category) url.searchParams.set('category', category);
  return url.toString();
}

export { API_BASE_URL };

