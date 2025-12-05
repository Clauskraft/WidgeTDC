import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from 'react';
import { getEnvConfig } from '../utils/env-validation';
import type { SecurityFeedsPayload } from '../utils/securityApi';

// Types
export interface SystemStatus {
  status: 'online' | 'offline' | 'error';
  timestamp: number;
  nodeCount: number;
  relationshipCount: number;
}

export interface TenderOpportunity {
  id: string;
  title: string;
  buyer: string;
  score: number;
  matches: string[];
  deadline?: string;
  isUpscale?: boolean;
  url?: string;
  rationale?: string;
}

export interface ThreatIntel {
  activeGroups: { name: string; victimCount: number }[];
  lastUpdate: string;
}

interface AppContextType {
  systemStatus: SystemStatus;
  tenders: TenderOpportunity[];
  threats: ThreatIntel;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Default State
const initialState: AppContextType = {
  systemStatus: { status: 'offline', timestamp: 0, nodeCount: 0, relationshipCount: 0 },
  tenders: [],
  threats: { activeGroups: [], lastUpdate: '' },
  isLoading: true,
  error: null,
  refreshData: async () => {},
};

const AppContext = createContext<AppContextType>(initialState);

const envConfig = getEnvConfig();
const API_BASE_URL = (envConfig.API_BASE_URL || '/api').replace(/\/$/, '');
const USE_MOCK_DATA = envConfig.USE_MOCK_DATA;

const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const FALLBACK_STATUS: SystemStatus = {
  status: 'online',
  timestamp: Date.now(),
  nodeCount: 1250,
  relationshipCount: 1800
};

const FALLBACK_TENDERS: TenderOpportunity[] = [
  {
    id: 'FALLBACK-1',
    title: 'Etablering af SOC og beredskab til Region Hovedstaden',
    buyer: 'Region Hovedstaden',
    score: 100,
    matches: ['Threat Intelligence', 'SOC', 'Log Management'],
    deadline: '2025-04-01',
    isUpscale: false,
    rationale: 'Strategic fit'
  }
];

const FALLBACK_THREATS: ThreatIntel = {
  activeGroups: [
    { name: 'RagnarLocker', victimCount: 33 },
    { name: 'Lorenz', victimCount: 11 },
    { name: 'XingLocker', victimCount: 5 }
  ],
  lastUpdate: new Date().toISOString()
};

const mapTenders = (opportunities: any[]): TenderOpportunity[] =>
  opportunities.map((opp, index) => ({
    id: opp.id || opp.url || `TENDER-${index}`,
    title: opp.title || 'Untitled opportunity',
    buyer: opp.buyer || 'Unknown buyer',
    score: typeof opp.score === 'number' ? opp.score : 0,
    matches: Array.isArray(opp.capabilities) ? opp.capabilities : [],
    deadline: opp.deadline || opp.closeDate,
    isUpscale: Boolean(opp.isUpscale),
    url: opp.url,
    rationale: opp.rationale || opp.reason
  }));

const deriveThreatIntel = (payload: SecurityFeedsPayload): ThreatIntel => {
  const activeGroups = payload.feeds.slice(0, 5).map(feed => ({
    name: feed.name,
    victimCount: 0  // FeedSource doesn't have documentsPerHour
  }));

  return {
    activeGroups,
    lastUpdate: new Date().toISOString()
  };
};

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialState.systemStatus);
  const [tenders, setTenders] = useState<TenderOpportunity[]>([]);
  const [threats, setThreats] = useState<ThreatIntel>(initialState.threats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data Logic
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const loadSystemStatus = async () => {
      try {
        const graphData = await fetchJson<{ stats?: { nodes?: number; relationships?: number }; totalNodes?: number; totalRelationships?: number }>('/evolution/graph/stats');
        const stats = graphData?.stats || {};
        setSystemStatus({
          status: 'online',
          timestamp: Date.now(),
          nodeCount: stats.nodes ?? graphData.totalNodes ?? 0,
          relationshipCount: stats.relationships ?? graphData.totalRelationships ?? 0
        });
      } catch (err) {
        if (USE_MOCK_DATA) {
          setSystemStatus({ ...FALLBACK_STATUS, timestamp: Date.now() });
          return;
        }
        throw err;
      }
    };

    const loadTenders = async () => {
      try {
        const data = await fetchJson<{ opportunities?: any[] }>('/market/opportunities');
        if (Array.isArray(data?.opportunities)) {
          setTenders(mapTenders(data.opportunities));
        }
      } catch (err) {
        if (USE_MOCK_DATA) {
          setTenders(FALLBACK_TENDERS);
          return;
        }
        throw err;
      }
    };

    const loadThreats = async () => {
      try {
        const data = await fetchJson<SecurityFeedsPayload>('/security/feeds');
        setThreats(deriveThreatIntel(data));
      } catch (err) {
        if (USE_MOCK_DATA) {
          setThreats({ ...FALLBACK_THREATS, lastUpdate: new Date().toISOString() });
          return;
        }
        throw err;
      }
    };

    try {
      await Promise.all([loadSystemStatus(), loadTenders(), loadThreats()]);
    } catch (err) {
      console.error('Data fetch failed:', err);
      setSystemStatus(prev => ({ ...prev, status: 'error' }));
      setError(err instanceof Error ? err.message : 'Failed to connect to Neural Core');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Fetch & Polling
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ systemStatus, tenders, threats, isLoading, error, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useApp = () => useContext(AppContext);
