import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dna,
  RefreshCw,
  Loader2,
  Zap,
  Brain,
  Shield,
  Search,
  FileText,
  X,
  Filter,
  Sparkles,
  Hexagon,
  Activity,
  ChevronRight,
  Atom,
} from 'lucide-react';
import type {
  Persona,
  Directive,
  DirectiveType,
  SpliceStats,
  SpliceResult,
  VendorType,
} from '../types/dna';

// ============================================
// VENDOR COLORS (inline for fast reference)
// ============================================
const VENDOR_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Anthropic: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', glow: 'rgba(249, 115, 22, 0.5)' },
  OpenAI: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: 'rgba(16, 185, 129, 0.5)' },
  Google: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', glow: 'rgba(59, 130, 246, 0.5)' },
  xAI: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', glow: 'rgba(168, 85, 247, 0.5)' },
  Perplexity: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40', glow: 'rgba(6, 182, 212, 0.5)' },
  Misc: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40', glow: 'rgba(107, 114, 128, 0.5)' },
  Unknown: { bg: 'bg-neon-green/20', text: 'text-neon-green', border: 'border-neon-green/40', glow: 'rgba(0, 255, 65, 0.5)' },
};

const DIRECTIVE_STYLES: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  restriction: { bg: 'bg-red-500/10', text: 'text-red-400', icon: '⛔', border: 'border-red-500/30' },
  rule: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '📜', border: 'border-yellow-500/30' },
  behavior: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: '🔄', border: 'border-cyan-500/30' },
  capability: { bg: 'bg-green-500/10', text: 'text-green-400', icon: '⚡', border: 'border-green-500/30' },
  tone: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '🎭', border: 'border-purple-500/30' },
  format: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '📐', border: 'border-blue-500/30' },
};

// ============================================
// HELIX ANIMATION COMPONENT
// ============================================
const HelixAnimation = ({ active }: { active: boolean }) => (
  <div className="relative w-12 h-24 flex-shrink-0">
    {/* DNA Helix strands */}
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className={`absolute w-2 h-2 rounded-full transition-all duration-500 ${
          active ? 'bg-neon-green animate-pulse' : 'bg-neon-green/30'
        }`}
        style={{
          left: `${50 + Math.sin((i / 6) * Math.PI * 2) * 40}%`,
          top: `${(i / 6) * 100}%`,
          transform: 'translate(-50%, -50%)',
          animationDelay: `${i * 100}ms`,
        }}
      />
    ))}
    {[...Array(6)].map((_, i) => (
      <div
        key={`b-${i}`}
        className={`absolute w-2 h-2 rounded-full transition-all duration-500 ${
          active ? 'bg-neon-cyan animate-pulse' : 'bg-neon-cyan/30'
        }`}
        style={{
          left: `${50 + Math.sin((i / 6) * Math.PI * 2 + Math.PI) * 40}%`,
          top: `${(i / 6) * 100}%`,
          transform: 'translate(-50%, -50%)',
          animationDelay: `${i * 100 + 50}ms`,
        }}
      />
    ))}
    {/* Connecting lines */}
    {active && (
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 48 96">
          {[...Array(6)].map((_, i) => (
            <line
              key={i}
              x1={24 + Math.sin((i / 6) * Math.PI * 2) * 19}
              y1={(i / 6) * 96}
              x2={24 + Math.sin((i / 6) * Math.PI * 2 + Math.PI) * 19}
              y2={(i / 6) * 96}
              stroke="#00ff41"
              strokeWidth="1"
              className="animate-pulse"
            />
          ))}
        </svg>
      </div>
    )}
  </div>
);

// ============================================
// HEXAGON STAT COMPONENT
// ============================================
const HexagonStat = ({ value, label, color }: { value: number | string; label: string; color: string }) => (
  <div className="relative flex flex-col items-center group">
    <div className={`relative w-16 h-16 flex items-center justify-center`}>
      {/* Hexagon SVG background */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <polygon
          points="50,3 95,25 95,75 50,97 5,75 5,25"
          className={`fill-cyber-black stroke-2 transition-all duration-300 group-hover:fill-opacity-50`}
          style={{ stroke: color, fillOpacity: 0.1 }}
        />
        <polygon
          points="50,10 88,28 88,72 50,90 12,72 12,28"
          className="fill-transparent stroke-1"
          style={{ stroke: color, opacity: 0.3 }}
        />
      </svg>
      {/* Value */}
      <span className="relative z-10 text-lg font-bold" style={{ color }}>
        {typeof value === 'number' && value > 9999 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
    </div>
    <span className="text-[10px] text-neon-green/60 uppercase tracking-wider mt-1">{label}</span>
  </div>
);

// ============================================
// GENOME SEQUENCE DIRECTIVE
// ============================================
const GenomeDirective = ({ directive, index }: { directive: Directive; index: number }) => {
  const style = DIRECTIVE_STYLES[directive.type] || DIRECTIVE_STYLES.behavior;

  // Generate a "DNA sequence" pattern from content
  const sequence = useMemo(() => {
    const chars = ['A', 'T', 'G', 'C'];
    return directive.content
      .slice(0, 12)
      .split('')
      .map((c, i) => chars[c.charCodeAt(0) % 4])
      .join('');
  }, [directive.content]);

  return (
    <div
      className={`relative group border-l-2 pl-4 py-3 pr-3 ${style.bg} ${style.border} rounded-r-lg
                  hover:bg-opacity-30 transition-all duration-200`}
    >
      {/* Sequence marker */}
      <div className="absolute -left-3 top-3 w-6 h-6 rounded-full bg-cyber-black border-2 flex items-center justify-center"
           style={{ borderColor: style.text.replace('text-', '').replace('-400', '') }}>
        <span className="text-[10px] font-mono" style={{ color: style.text.includes('red') ? '#f87171' :
                                                                style.text.includes('yellow') ? '#facc15' :
                                                                style.text.includes('cyan') ? '#22d3ee' :
                                                                style.text.includes('green') ? '#4ade80' :
                                                                style.text.includes('purple') ? '#c084fc' :
                                                                style.text.includes('blue') ? '#60a5fa' : '#00ff41' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{style.icon}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
            {directive.type}
          </span>
          {directive.priority >= 8 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              CRITICAL
            </span>
          )}
        </div>

        {/* DNA Sequence visualization */}
        <div className="flex items-center gap-0.5 font-mono text-[9px] opacity-60">
          {sequence.split('').map((char, i) => (
            <span
              key={i}
              className={`w-3 h-3 flex items-center justify-center rounded-sm ${
                char === 'A' ? 'bg-green-500/30 text-green-400' :
                char === 'T' ? 'bg-red-500/30 text-red-400' :
                char === 'G' ? 'bg-yellow-500/30 text-yellow-400' :
                'bg-blue-500/30 text-blue-400'
              }`}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <p className="text-neon-green/90 text-sm leading-relaxed font-light">
        {directive.content}
      </p>

      {/* Priority bar */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[9px] text-neon-green/40 uppercase">Priority</span>
        <div className="flex-1 h-1 bg-neon-green/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              directive.priority >= 8 ? 'bg-red-500' :
              directive.priority >= 5 ? 'bg-yellow-500' :
              'bg-neon-green'
            }`}
            style={{ width: `${directive.priority * 10}%` }}
          />
        </div>
        <span className="text-[9px] text-neon-green/60 font-mono">{directive.priority}/10</span>
      </div>
    </div>
  );
};

// ============================================
// PERSONA CARD COMPONENT (Left Panel)
// ============================================
const PersonaCard = ({
  persona,
  isSelected,
  onClick,
}: {
  persona: Persona;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const vendor = persona.vendor || 'Unknown';
  const colors = VENDOR_COLORS[vendor] || VENDOR_COLORS.Unknown;

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left transition-all duration-200 border-l-2 ${
        isSelected
          ? `${colors.bg} ${colors.border} border-l-4`
          : 'border-l-transparent hover:border-l-neon-green/30 hover:bg-neon-green/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Hexagon className={`w-3 h-3 flex-shrink-0 ${colors.text}`} />
            <span className="text-neon-green text-sm font-medium truncate">
              {persona.name}
            </span>
            {persona.isPremium && (
              <Sparkles className="w-3 h-3 text-orange-400 flex-shrink-0 animate-pulse" />
            )}
          </div>
          {persona.description && (
            <p className="text-neon-green/40 text-xs mt-1 line-clamp-1 ml-5">
              {persona.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 ml-5">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${colors.bg} ${colors.text}`}>
              {vendor}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
          isSelected ? 'text-neon-green rotate-90' : 'text-neon-green/20'
        }`} />
      </div>
    </button>
  );
};

// ============================================
// DNA SPLICER VIEW COMPONENT
// ============================================
export default function DNASplicerView() {
  const [stats, setStats] = useState<SpliceStats | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [loading, setLoading] = useState(true);
  const [splicing, setSplicing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [lastSpliceResult, setLastSpliceResult] = useState<SpliceResult | null>(null);
  const [directiveTypeFilter, setDirectiveTypeFilter] = useState<string>('all');

  // Load stats and personas
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, personasRes] = await Promise.all([
        fetch('/api/evolution/splice/stats'),
        fetch('/api/evolution/splice/personas'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (personasRes.ok) {
        const personasData = await personasRes.json();
        setPersonas(personasData.personas || []);
      }
    } catch (err) {
      setError('Failed to connect to DNA extraction server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load directives for selected persona
  const loadDirectives = useCallback(async (personaName: string) => {
    try {
      const res = await fetch(`/api/evolution/splice/persona/${encodeURIComponent(personaName)}/directives`);
      if (res.ok) {
        const data = await res.json();
        setDirectives(data.directives || []);
      }
    } catch (err) {
      console.error('Failed to load directives:', err);
    }
  }, []);

  // Run splice (RESPLICE DNA)
  const runSplice = useCallback(async () => {
    setSplicing(true);
    setError(null);

    try {
      const res = await fetch('/api/evolution/splice/premium', { method: 'POST' });

      if (res.ok) {
        const result = await res.json();
        setLastSpliceResult(result);
        await loadData();
      } else {
        throw new Error('DNA splice failed');
      }
    } catch (err) {
      setError('Splice operation failed - check Neo4j connection');
    } finally {
      setSplicing(false);
    }
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load directives when persona selected
  useEffect(() => {
    if (selectedPersona) {
      loadDirectives(selectedPersona.name);
    } else {
      setDirectives([]);
    }
  }, [selectedPersona, loadDirectives]);

  // Filter personas
  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesVendor = vendorFilter === 'all' || p.vendor === vendorFilter;
      return matchesSearch && matchesVendor;
    });
  }, [personas, searchQuery, vendorFilter]);

  // Filter directives
  const filteredDirectives = useMemo(() => {
    if (directiveTypeFilter === 'all') return directives;
    return directives.filter(d => d.type === directiveTypeFilter);
  }, [directives, directiveTypeFilter]);

  // Get unique vendors
  const vendors = useMemo(() =>
    Array.from(new Set(personas.map(p => p.vendor || 'Unknown'))),
    [personas]
  );

  // Get unique directive types from current directives
  const directiveTypes = useMemo(() =>
    Array.from(new Set(directives.map(d => d.type))),
    [directives]
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-cyber-black via-cyber-black to-cyber-gray/20">
      {/* ═══════════ HEADER WITH LIVE STATS ═══════════ */}
      <div className="flex items-center justify-between p-4 border-b border-neon-green/20 bg-cyber-black/50">
        <div className="flex items-center gap-4">
          {/* Animated Helix */}
          <HelixAnimation active={splicing || loading} />

          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-neon-green glow-text-subtle flex items-center gap-2">
              <Dna className="w-6 h-6" />
              DNA SPLICER
            </h1>
            <p className="text-xs text-neon-green/50">Intelligence Pattern Extraction System</p>
          </div>
        </div>

        {/* Hexagon Stats */}
        <div className="flex items-center gap-6">
          <HexagonStat
            value={stats?.totalPersonas || 0}
            label="Personas"
            color="#00ff41"
          />
          <HexagonStat
            value={stats?.totalDirectives || 0}
            label="Directives"
            color="#00d4ff"
          />
          <HexagonStat
            value={stats?.totalCapabilities || 0}
            label="Capabilities"
            color="#f97316"
          />
        </div>

        {/* RESPLICE DNA Button */}
        <button
          onClick={runSplice}
          disabled={splicing}
          className={`relative px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider
                     transition-all duration-300 overflow-hidden group
                     ${splicing
                       ? 'bg-neon-green/20 text-neon-green/50 cursor-wait'
                       : 'bg-neon-green/10 border border-neon-green/50 text-neon-green hover:bg-neon-green/20 hover:border-neon-green'
                     }`}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-green/0 via-neon-green/10 to-neon-green/0
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          <span className="relative flex items-center gap-2">
            {splicing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SPLICING...
              </>
            ) : (
              <>
                <Atom className="w-4 h-4" />
                RESPLICE DNA
              </>
            )}
          </span>
        </button>
      </div>

      {/* ═══════════ SPLICE RESULT NOTIFICATION ═══════════ */}
      {lastSpliceResult && (
        <div className="mx-4 mt-3 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg
                        flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-neon-green">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Splice Complete</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-neon-green/70">
              <span>{lastSpliceResult.personas} personas</span>
              <span>•</span>
              <span>{lastSpliceResult.directives} directives</span>
              <span>•</span>
              <span>{(lastSpliceResult.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>
          <button onClick={() => setLastSpliceResult(null)} className="text-neon-green/50 hover:text-neon-green">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════ ERROR DISPLAY ═══════════ */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ═══════════ MAIN SPLIT-SCREEN LAYOUT ═══════════ */}
      <div className="flex-1 flex min-h-0 mt-3">
        {/* ═══════════ LEFT PANEL: MODEL LIST ═══════════ */}
        <div className="w-80 border-r border-neon-green/20 flex flex-col bg-cyber-black/30">
          {/* Search & Filter */}
          <div className="p-3 border-b border-neon-green/20 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-green/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search personas..."
                className="w-full bg-cyber-black/80 border border-neon-green/30 rounded-lg pl-10 pr-3 py-2 text-sm text-neon-green
                           placeholder-neon-green/40 focus:outline-none focus:border-neon-green/60 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-neon-green/40" />
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="flex-1 bg-cyber-black/80 border border-neon-green/30 rounded px-2 py-1.5 text-xs text-neon-green
                           focus:outline-none focus:border-neon-green/60"
              >
                <option value="all">All Vendors</option>
                {vendors.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Personas List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
              </div>
            ) : filteredPersonas.length === 0 ? (
              <div className="p-6 text-center">
                <Dna className="w-12 h-12 text-neon-green/20 mx-auto mb-3" />
                <p className="text-neon-green/50 text-sm">No personas found</p>
                <p className="text-neon-green/30 text-xs mt-1">Run RESPLICE to extract intelligence</p>
              </div>
            ) : (
              <div className="divide-y divide-neon-green/10">
                {filteredPersonas.slice(0, 100).map((persona) => (
                  <PersonaCard
                    key={persona.name}
                    persona={persona}
                    isSelected={selectedPersona?.name === persona.name}
                    onClick={() => setSelectedPersona(persona)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer count */}
          <div className="p-2 border-t border-neon-green/20 text-xs text-neon-green/40 text-center bg-cyber-black/50">
            {filteredPersonas.length} / {personas.length} personas
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL: DNA DECODER ═══════════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-cyber-black/50 to-cyber-black">
          {selectedPersona ? (
            <>
              {/* Persona Header */}
              <div className="p-4 border-b border-neon-green/20 bg-cyber-black/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Vendor Hexagon Badge */}
                    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        <polygon
                          points="50,3 95,25 95,75 50,97 5,75 5,25"
                          className="fill-cyber-black/50 stroke-2"
                          style={{ stroke: VENDOR_COLORS[selectedPersona.vendor || 'Unknown']?.glow || '#00ff41' }}
                        />
                      </svg>
                      <Brain className="w-6 h-6 relative z-10"
                             style={{ color: VENDOR_COLORS[selectedPersona.vendor || 'Unknown']?.glow || '#00ff41' }} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-neon-green flex items-center gap-2">
                        {selectedPersona.name}
                        {selectedPersona.isPremium && (
                          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                        )}
                      </h2>
                      {selectedPersona.description && (
                        <p className="text-neon-green/60 text-sm mt-1 max-w-lg">{selectedPersona.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          VENDOR_COLORS[selectedPersona.vendor || 'Unknown']?.bg
                        } ${VENDOR_COLORS[selectedPersona.vendor || 'Unknown']?.text}`}>
                          {selectedPersona.vendor || 'Unknown'}
                        </span>
                        <span className="text-xs text-neon-cyan flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {directives.length} directives decoded
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPersona(null)}
                    className="p-2 rounded hover:bg-neon-green/10 text-neon-green/50 hover:text-neon-green transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Directive Type Filter */}
                {directiveTypes.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neon-green/10">
                    <span className="text-xs text-neon-green/50">Filter:</span>
                    <button
                      onClick={() => setDirectiveTypeFilter('all')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        directiveTypeFilter === 'all'
                          ? 'bg-neon-green/20 text-neon-green'
                          : 'text-neon-green/50 hover:text-neon-green'
                      }`}
                    >
                      All
                    </button>
                    {directiveTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setDirectiveTypeFilter(type)}
                        className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                          directiveTypeFilter === type
                            ? `${DIRECTIVE_STYLES[type]?.bg} ${DIRECTIVE_STYLES[type]?.text}`
                            : 'text-neon-green/50 hover:text-neon-green'
                        }`}
                      >
                        <span>{DIRECTIVE_STYLES[type]?.icon}</span>
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Directives List (Genome Sequence Style) */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredDirectives.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-neon-green/40">
                    No directives match the current filter
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDirectives.map((directive, index) => (
                      <GenomeDirective key={directive.id} directive={directive} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  {/* Animated DNA structure */}
                  <Dna className="w-32 h-32 text-neon-green/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Hexagon className="w-16 h-16 text-neon-green/20 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-neon-green/70 text-lg font-medium mb-2">DNA DECODER READY</h3>
                <p className="text-neon-green/40 text-sm max-w-xs mx-auto">
                  Select a persona from the list to decode their intelligence patterns and behavioral directives
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
