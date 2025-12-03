import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/api';

// Typer for vores data (matcher Backend API)
interface MarketOpportunity {
  title: string;
  buyer: string;
  score: number;
  capabilities: string[];
  isUpscale: boolean;
  rationale: string;
  url: string;
  status: string;
}

const MOCK_DATA: MarketOpportunity[] = [
  {
    title: "Etablering af SOC og beredskab til Region Hovedstaden",
    buyer: "Region Hovedstaden",
    score: 100,
    capabilities: ["Threat Intelligence", "SOC", "Log Management"],
    isUpscale: false,
    rationale: "Strategic fit with core security competencies",
    url: "#",
    status: "STRONG FIT"
  },
  {
    title: "Landsdækkende IoT-netværk til forsyningssektoren",
    buyer: "HOFOR",
    score: 85,
    capabilities: ["IoT", "5G", "Network Analysis"],
    isUpscale: true,
    rationale: "Requires innovation in NB-IoT sensor deployment",
    url: "#",
    status: "STRONG FIT"
  },
  {
    title: "Sikker kommunikationsplatform (Unified Comms)",
    buyer: "Oslo Kommune",
    score: 60,
    capabilities: ["Cyber Security"],
    isUpscale: false,
    rationale: "Integration with legacy systems required",
    url: "#",
    status: "DEVELOPMENT NEEDED"
  }
];

const MarketRadar: React.FC = () => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState<MarketOpportunity | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'SIMULATION'>('LIVE');

  // Poll backend hvert 30. sekund
  useEffect(() => {
    const fetchData = async () => {
      try {
        // NOTE: The dev container forwards port 3001, so we can call it directly.
        const res = await fetch(buildApiUrl('/market/opportunities'));
        if (!res.ok) throw new Error("Connection failed");
        
        const data = await res.json();
        if (data.opportunities) {
          setOpportunities(data.opportunities);
          setConnectionStatus('LIVE');
        }
      } catch (err) {
        console.warn("Radar jammet, skifter til simulation:", err);
        // Fallback til mock data hvis backend ikke kan nås (f.eks. i preview)
        setOpportunities(MOCK_DATA);
        setConnectionStatus('SIMULATION');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border-2 border-green-500 font-mono text-green-400 p-4 shadow-[0_0_20px_rgba(0,255,0,0.3)] h-full overflow-hidden flex flex-col box-border w-full">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-green-800 pb-2 mb-4 shrink-0">
        <h2 className="text-xl font-bold uppercase tracking-widest animate-pulse">
          {'>>'} MARKET_RADAR_V2.1
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'LIVE' ? 'bg-green-500 animate-ping' : 'bg-yellow-500'}`}></span>
          <span className={connectionStatus === 'LIVE' ? 'text-green-500' : 'text-yellow-500'}>
            {connectionStatus === 'LIVE' ? 'LIVE FEED' : 'SIMULATION MODE'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        
        {/* Left: The List */}
        <div className="w-1/2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-900">
          {loading ? (
            <div className="text-center mt-10 animate-pulse">SCANNING SECTOR...</div>
          ) : (
            opportunities.map((op, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedOp(op)}
                className={`p-3 mb-2 border border-green-900 hover:bg-green-900/30 cursor-pointer transition-all ${selectedOp === op ? 'bg-green-900/50 border-green-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm truncate w-3/4 mr-2">{op.title}</span>
                  <span className={`text-xs px-1 whitespace-nowrap ${op.score >= 80 ? 'bg-green-500 text-black font-bold' : 'border border-green-500'}`}>
                    {op.score}%
                  </span>
                </div>
                <div className="text-xs text-green-700 mt-1 uppercase">{op.buyer}</div>
              </div>
            ))
          )}
        </div>

        {/* Right: The Details (Holographic View) */}
        <div className="w-1/2 border-l border-green-900 pl-4 flex flex-col overflow-y-auto">
          {selectedOp ? (
            <>
              <div className="mb-4">
                <div className="text-xs text-green-600 mb-1">TARGET_ID:</div>
                <div className="text-lg font-bold leading-tight break-words">{selectedOp.title}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-green-600 mb-1">CAPABILITY_MATCH:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedOp.capabilities.map((cap, i) => (
                    <span key={i} className="text-xs border border-green-600 px-2 py-0.5 text-green-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {selectedOp.isUpscale && (
                <div className="mb-4 p-2 border border-yellow-500/50 text-yellow-500 text-xs bg-yellow-900/10">
                  ⚠️ UPSCALE OPPORTUNITY DETECTED
                  <br/>
                  <span className="opacity-70 mt-1 block">Reason: {selectedOp.rationale}</span>
                </div>
              )}

              <div className="mt-auto pt-4">
                <a 
                  href={selectedOp.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full text-center bg-green-700 text-black font-bold py-3 hover:bg-green-500 transition-colors uppercase tracking-wider text-sm"
                >
                  INITIATE_CAPTURE_SEQUENCE
                </a>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-green-800 text-sm">
              <div className="text-4xl mb-2 opacity-20">⌖</div>
              [SELECT TARGET TO ANALYZE]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketRadar;
