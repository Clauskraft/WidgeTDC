import { getEnvConfig } from './env-validation';

const env = getEnvConfig();

const normalizeBase = (base: string | undefined, fallback: string) => {
  if (!base) return fallback;
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

export const API_BASE_URL = normalizeBase(env.API_BASE_URL, '/api');

const inferWsBase = (): string => {
  const wsEnv = (import.meta.env.VITE_WS_URL as string | undefined) || undefined;
  if (wsEnv) {
    return normalizeBase(wsEnv, wsEnv);
  }
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
  }
  return 'ws://localhost:3001';
};

export const WS_BASE_URL = inferWsBase();

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const buildWsUrl = (path: string) => `${WS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
