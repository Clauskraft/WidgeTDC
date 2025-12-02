import React, { useMemo, useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Euro, FileCheck, Clock, AlertTriangle } from 'lucide-react';

type Region = 'EU' | 'Nordic' | 'DACH' | 'Benelux';
type TenderStatus = 'Open' | 'Preparing' | 'Submitted';

type Opportunity = {
  id: string;
  title: string;
  portal: string;
  region: Region;
  budget: number;
  deadline: string;
  category: string;
  status: TenderStatus;
  compliance: 'OK' | 'Needs review';
  owner: string;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'ted-2025-114',
    title: 'EU Digital Health Platform roll-out',
    portal: 'TED',
    region: 'EU',
    budget: 18.4,
    deadline: '2025-03-18',
    category: 'Digital Services',
    status: 'Preparing',
    compliance: 'Needs review',
    owner: 'Luc Schmidt',
  },
  {
    id: 'no-2025-44',
    title: 'Norway Police AI tender',
    portal: 'Doffin',
    region: 'Nordic',
    budget: 9.1,
    deadline: '2025-02-28',
    category: 'AI & Analytics',
    status: 'Open',
    compliance: 'OK',
    owner: 'Sara Berg',
  },
  {
    id: 'de-2025-09',
    title: 'Bundesbank cyber response retainer',
    portal: 'Bund',
    region: 'DACH',
    budget: 12.6,
    deadline: '2025-03-05',
    category: 'Security',
    status: 'Submitted',
    compliance: 'OK',
    owner: 'Daniel Kühn',
  },
];

const ProcurementIntelligenceWidget: React.FC<{ widgetId: string }> = () => {
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [riskOnly, setRiskOnly] = useState(false);

  const filteredOpportunities = useMemo(() => {
    return OPPORTUNITIES.filter(opp => {
      const matchesRegion = regionFilter === 'all' || opp.region === regionFilter;
      const matchesRisk = !riskOnly || opp.compliance === 'Needs review';
      return matchesRegion && matchesRisk;
    });
  }, [regionFilter, riskOnly]);

  return (
    <MatrixWidgetWrapper title="Procurement Intelligence">
      <div className="flex flex-col h-full gap-4">
        
        {/* Controls */}
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
            <select 
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value as any)}
                className="bg-black/20 text-[10px] text-gray-300 p-1 rounded border border-white/10 focus:outline-none"
            >
                <option value="all">All Regions</option>
                <option value="EU">EU</option>
                <option value="Nordic">Nordic</option>
                <option value="DACH">DACH</option>
            </select>
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer select-none">
                <input type="checkbox" checked={riskOnly} onChange={() => setRiskOnly(!riskOnly)} />
                Compliance Risk Only
            </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0B3E6F]/30 p-2 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase">Pipeline</div>
                <div className="text-lg font-bold text-white">€40.1M</div>
            </div>
            <div className="bg-[#0B3E6F]/30 p-2 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase">Active</div>
                <div className="text-lg font-bold text-[#00B5CB]">3</div>
            </div>
            <div className="bg-[#0B3E6F]/30 p-2 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase">Risks</div>
                <div className="text-lg font-bold text-amber-400">1</div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {filteredOpportunities.map(opp => (
                <div key={opp.id} className="p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                            <h4 className="text-xs font-bold text-gray-200 truncate" title={opp.title}>{opp.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1"><Euro size={10}/> {opp.budget}M</span>
                                <span className="flex items-center gap-1"><Clock size={10}/> {new Date(opp.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            opp.compliance === 'OK' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                            {opp.compliance === 'OK' ? 'COMPLIANT' : 'REVIEW'}
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-gray-400">{opp.region} • {opp.portal}</span>
                        <button className="text-[10px] text-[#00B5CB] hover:text-white transition-colors">View Details</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default ProcurementIntelligenceWidget;
