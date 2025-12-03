/**
 * API Configuration for WidgeTDC Frontend
 *
 * In development: Uses Vite proxy (/api -> localhost:3001)
 * In production: Uses VITE_API_URL environment variable
 */

export const API_CONFIG = {
  // Base URL for API calls
  // In production, this should be set via VITE_API_URL
  // In development, relative paths work via Vite proxy
  baseUrl: import.meta.env.VITE_API_URL || '',

  // WebSocket URL
  // In production, derives from VITE_API_URL or VITE_WS_URL
  wsUrl: import.meta.env.VITE_WS_URL ||
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
      : ''),

  // API endpoints
  endpoints: {
    mcp: '/api/mcp/route',
    health: '/health',
    hyper: '/api/hyper/events',
    hanspedder: '/api/hanspedder',
  },
} as const;

/**
 * Get full API URL
 */
export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseUrl;
  // If endpoint starts with /, don't add another
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Get WebSocket URL
 */
export function getWsUrl(path: string = '/mcp/ws'): string {
  if (API_CONFIG.wsUrl) {
    return `${API_CONFIG.wsUrl}${path}`;
  }

  // Fallback: derive from current location in browser
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).host
      : window.location.host;
    return `${protocol}//${host}${path}`;
  }

  return `ws://localhost:3001${path}`;
}
