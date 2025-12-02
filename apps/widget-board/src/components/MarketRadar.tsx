import React, { useState, useMemo } from 'react';
import { useApp, TenderOpportunity } from '../context/AppContext';
import { Target, TrendingUp, AlertCircle, Star, Filter, ChevronDown, ChevronUp, ExternalLink, AlertOctagon } from 'lucide-react';

export const MarketRadar: React.FC = () => {
  const { tenders, isLoading } = useApp();
  
  // UI State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [upscaleOnly, setUpscaleOnly] = useState<boolean>(false);

  // Filtering Logic
  const filteredTenders = useMemo(() => {
    return tenders.filter(tender => {
      // Country Filter (Simple ID check for DK/NO/SE)
      if (filterCountry !== 'ALL' && !tender.id.startsWith(filterCountry)) return false;
      
      // Score Filter
      if (tender.score < minScore) return false;
      
      // Upscale Filter
      if (upscaleOnly && !tender.isUpscale) return false;

      return true;
    });
  }, [tenders, filterCountry, minScore, upscaleOnly]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 animate-pulse h-64 flex items-center justify-center">
        <div className="text-slate-500">Scanning frequencies...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 backdrop-blur-md shadow-xl h-full overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
        <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <Target className="w-5 h-5" />
          MARKET RADAR
        </h2>
        <div className="text-xs text-emerald-600 font-mono">
          ACTIVE SIGNALS: {filteredTenders.length} / {tenders.length}
        </div>
      </div>

      {/* ADVANCED CONTROLS TOOLBAR */}
      <div className="flex gap-2 mb-4 p-2 bg-slate-800/50 rounded border border-slate-700/50">
        {/* Country Dropdown */}
        <div className="relative">
          <select 
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs rounded px-2 py-1 pr-6 border border-slate-700 focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:bg-slate-800"
          >
            <option value="ALL">ALL ZONES</option>
            <option value="DK">DENMARK (DK)</option>
            <option value="NO">NORWAY (NO)</option>
            <option value="SE">SWEDEN (SE)</option>
          </select>
          <Filter className="w-3 h-3 absolute right-2 top-1.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Score Slider/Select */}
        <select 
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="bg-slate-900 text-slate-300 text-xs rounded px-2 py-1 border border-slate-700 focus:border-emerald-500 outline-none cursor-pointer hover:bg-slate-800"
        >
          <option value="0">ANY SCORE</option>
          <option value="50">SCORE &gt; 50%</option>
          <option value="80">SCORE &gt; 80%</option>
          <option value="90">SCORE &gt; 90%</option>
        </select>

        {/* Upscale Toggle */}
        <button
          onClick={() => setUpscaleOnly(!upscaleOnly)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
            upscaleOnly 
              ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' 
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          UPSCALE ONLY
        </button>
      </div>

      {/* LIST VIEW */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredTenders.map((tender) => (
          <div 
            key={tender.id}
            onClick={() => toggleExpand(tender.id)}
            className={`group relative bg-slate-800/50 rounded border transition-all duration-200 cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] ${
              tender.isUpscale ? 'border-amber-500/30 bg-slate-800/70' : 'border-slate-700 hover:border-emerald-500/50'
            }`}
          >
            {/* Main Card Content */}
            <div className="p-3 pr-16">
              
              {/* Score Indicator */}
              <div className="absolute top-3 right-3 flex flex-col items-end pointer-events-none">
                <div className={`text-2xl font-black font-mono leading-none ${
                  tender.score >= 80 ? 'text-emerald-400' : 
                  tender.score >= 50 ? 'text-yellow-400' : 'text-slate-500'
                }`}>
                  {tender.score}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Fit Score</div>
              </div>

              {/* Title & Icons */}
              <h3 className="text-slate-200 font-medium text-sm mb-1 group-hover:text-white transition-colors flex items-center gap-2">
                {tender.title}
                {tender.isUpscale && (
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                )}
              </h3>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                  {tender.id.split('-')[0]}
                </span>
                <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                  {tender.buyer}
                </span>
                {tender.deadline && (
                  <span className="text-slate-500">
                    Due: {tender.deadline}
                  </span>
                )}
              </div>

              {/* Capability Tags (Preview) */}
              {!expandedId && (
                <div className="flex flex-wrap gap-1.5">
                  {tender.matches.slice(0, 3).map((match, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                      {match}
                    </span>
                  ))}
                  {tender.matches.length > 3 && (
                    <span className="text-[10px] text-slate-500">+{tender.matches.length - 3} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Upscale Badge (Collapsed) */}
            {tender.isUpscale && !expandedId && (
              <div className="px-3 pb-2 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Strategic Upscale Opportunity</span>
              </div>
            )}

            {/* EXPANDED DETAILS (Drill-Down) */}
            {expandedId === tender.id && (
              <div className="px-3 pb-3 pt-0 border-t border-slate-700/50 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {/* Matches */}
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Capabilities Matched</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tender.matches.map((match, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                          {match}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Gaps / Missing (Mock logic for visual demo - in real app this comes from backend) */}
                  {tender.isUpscale && (
                    <div>
                      <div className="text-[10px] text-red-500/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        Capability Gaps
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Simulating gaps based on the tender ID for demo consistency */}
                        {tender.id === 'DK-2025-001' && (
                          <>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/50">Log Management</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/50">Threat Intel</span>
                          </>
                        )}
                        {tender.id === 'DK-2025-002' && (
                          <>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/50">5G Core</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/50">NB-IoT</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="mt-4 flex justify-end gap-2">
                  {tender.url && (
                    <a 
                      href={tender.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Tender
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Collapse Arrow */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600">
              {expandedId === tender.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

          </div>
        ))}

        {filteredTenders.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded border border-dashed border-slate-700">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No signals found matching current filters.</p>
            <button 
              onClick={() => { setFilterCountry('ALL'); setMinScore(0); setUpscaleOnly(false); }}
              className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
