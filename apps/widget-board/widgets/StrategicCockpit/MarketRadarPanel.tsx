// apps/widget-board/widgets/StrategicCockpit/MarketRadarPanel.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
];

interface MarketRadarPanelProps {
    onClose: () => void;
}

export const MarketRadarPanel: React.FC<MarketRadarPanelProps> = ({ onClose }) => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState<MarketOpportunity | null>(MOCK_DATA[0]);
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'SIMULATION'>('LIVE');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/market/opportunities');
        if (!res.ok) throw new Error("Connection failed");
        const data = await res.json();
        setOpportunities(data.opportunities || MOCK_DATA);
        setConnectionStatus('LIVE');
      } catch (err) {
        console.warn("Radar jammet, skifter til simulation:", err);
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
    <div className="absolute top-0 right-0 h-full w-96 bg-black/70 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col p-4 text-green-400 font-mono">
        {/* Panel Header */}
        <div className="flex justify-between items-center border-b border-green-800 pb-2 mb-4 shrink-0">
            <h2 className="text-lg font-bold uppercase tracking-widest text-green-400">
            {'>>'} MARKET RADAR
            </h2>
            <button onClick={onClose} className="text-green-600 hover:text-green-400"><X className="w-5 h-5" /></button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* List */}
            <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-900 flex-grow">
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

            {/* Details */}
            <div className="border-t border-green-900 pt-4 mt-4 shrink-0">
            {selectedOp ? (
                <>
                <div className="mb-4">
                    <div className="text-xs text-green-600 mb-1">TARGET_ID:</div>
                    <div className="text-sm font-bold leading-tight break-words">{selectedOp.title}</div>
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
                </>
            ) : (
                <div className="text-center text-green-800 text-sm py-4">[NO TARGET SELECTED]</div>
            )}
            </div>
        </div>
    </div>
  );
};
