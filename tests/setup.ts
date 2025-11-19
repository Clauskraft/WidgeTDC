import { afterEach, afterAll, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

const feedsPayload = {
  feeds: [
    {
      id: 'feed-darkweb',
      name: 'Dark Web Credential Markets',
      tags: ['dark-web'],
      threatLevel: 'critical',
      status: 'healthy',
      documentsPerHour: 420,
      duplicatesPerHour: 11,
      backlogMinutes: 2,
      lastFetched: new Date().toISOString(),
      cadence: 'Every 2 min',
      regions: ['EU'],
    },
  ],
  pipelineStages: [],
  normalizedDocuments: [
    {
      id: 'ti-1',
      feedId: 'feed-darkweb',
      title: 'APT activity',
      severity: 'critical',
      summary: 'Simulated summary',
      tags: ['APT'],
      dedupeHits: 0,
      ingestedAt: new Date().toISOString(),
    },
  ],
  metrics: {
    documentsIndexed: 10,
    ingestionLatency: 120,
    dedupeRate: 0.9,
    backlogMinutes: 1,
  },
  archive: {
    sizeBytes: 1024,
    retentionDays: 30,
    objectCount: 10,
  },
  environment: {
    openSearchConnected: true,
    minioConnected: true,
  },
};

const activityEvents = [
  {
    id: 'evt-1',
    title: 'Endpoint alert',
    severity: 'high',
    category: 'endpoint',
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
];

const searchTemplatesPayload = {
  templates: [
    {
      id: 'tpl-high-severity',
      name: 'High fidelity alerts',
      description: 'Critical events touching finance or executive accounts within 24h.',
      query: 'credential leak finance exec',
      severity: 'critical',
      timeframe: '24h',
      sources: ['Dark Web', 'Feed Ingestion'],
    },
  ],
};

const searchHistoryPayload = {
  history: [
    {
      id: 'hist-1',
      query: 'zero-day vendor advisory',
      severity: 'high',
      timeframe: '7d',
      sources: ['Vendor Radar'],
      results: 4,
      latencyMs: 210,
      ranAt: new Date().toISOString(),
    },
  ],
};

const searchQueryPayload = {
  results: [
    {
      id: 'sr-1',
      title: 'Dark web actor selling finance leadership credentials',
      summary: 'Marketplace listing with 24 unique accounts incl. CFO and procurement lead.',
      source: 'Feed Ingestion',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      tags: ['credentials', 'darkweb', 'finance'],
      score: 0.93,
    },
  ],
  metrics: {
    latencyMs: 120,
    totalDocs: 126000,
    coverage: 0.9,
  },
  auditEntry: {
    id: 'audit-1',
    query: 'credential leak finance exec',
    severity: 'critical',
    timeframe: '24h',
    sources: ['Dark Web', 'Feed Ingestion'],
    results: 1,
    latencyMs: 120,
    ranAt: new Date().toISOString(),
  },
};

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const mockFetch = vi.fn(
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requestUrl =
      typeof input === 'string' || input instanceof URL
        ? new URL(input, 'http://localhost')
        : new URL(input.url, 'http://localhost');

    switch (requestUrl.pathname) {
      case '/api/security/feeds':
        return createJsonResponse(feedsPayload);
      case '/api/security/search/templates':
        return createJsonResponse(searchTemplatesPayload);
      case '/api/security/search/history':
        return createJsonResponse(searchHistoryPayload);
      case '/api/security/search/query':
        return createJsonResponse(searchQueryPayload);
      case '/api/security/activity':
        return createJsonResponse(activityEvents);
      default:
        return createJsonResponse({ ok: true });
    }
  }
);

beforeAll(() => {
  vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);
  Object.defineProperty(global.Element.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  mockFetch.mockClear();
  cleanup();
});

afterAll(() => {
  vi.unstubAllGlobals();
});
