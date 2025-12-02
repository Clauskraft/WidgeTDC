import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialState.systemStatus);
  const [tenders, setTenders] = useState<TenderOpportunity[]>([]);
  const [threats, setThreats] = useState<ThreatIntel>(initialState.threats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data Logic
  const refreshData = async () => {
    try {
      setError(null);
      
      // 1. Fetch System Health (Mocked for now until API is reachable via proxy)
      const mockStatus: SystemStatus = {
        status: 'online',
        timestamp: Date.now(),
        nodeCount: 1250,
        relationshipCount: 1800
      };
      setSystemStatus(mockStatus);

      // 2. Fetch Tenders from Real API
      try {
        const res = await fetch('http://localhost:3001/api/market/opportunities');
        if (!res.ok) throw new Error('Market API unavailable');
        
        const data = await res.json();
        
        if (data && Array.isArray(data.opportunities)) {
          const realTenders: TenderOpportunity[] = data.opportunities.map((opp: any, index: number) => ({
            id: opp.url ? `TENDER-${index}` : `MOCK-${index}`, // Simple ID generation
            title: opp.title,
            buyer: opp.buyer,
            score: opp.score,
            matches: opp.capabilities || [],
            deadline: '2025-04-01', // Placeholder as it's not in the graph yet
            isUpscale: opp.isUpscale,
            url: opp.url,
            rationale: opp.rationale
          }));
          setTenders(realTenders);
        }
      } catch (apiError) {
        console.warn('Market API failed, falling back to cache/mock', apiError);
        // Fallback / Keep existing if any or use partial mock
      }

      // 3. Fetch Threats (Mocked from Dark Sentry output)
      const mockThreats: ThreatIntel = {
        activeGroups: [
          { name: 'RagnarLocker', victimCount: 33 },
          { name: 'Lorenz', victimCount: 11 },
          { name: 'XingLocker', victimCount: 5 }
        ],
        lastUpdate: new Date().toISOString()
      };
      setThreats(mockThreats);

    } catch (err) {
      console.error('Data fetch failed:', err);
      setSystemStatus(prev => ({ ...prev, status: 'error' }));
      setError('Failed to connect to Neural Core');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch & Polling
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ systemStatus, tenders, threats, isLoading, error, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useApp = () => useContext(AppContext);
