// Strategic Cockpit - Neural Stream Panel
// Dynamic context panel on the right side

import React from 'react';
import {
  FileText,
  Users,
  AlertTriangle,
  Scale,
  ExternalLink,
  ChevronRight,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import {
  NeuralStreamSection,
  NeuralStreamContext,
  RelatedDocument,
  RelatedActor,
  RelatedIncident,
  AffectingPolicy,
  NEON_COLORS,
} from './types';

interface NeuralStreamPanelProps {
  context: NeuralStreamContext;
  activeSection: NeuralStreamSection;
  onSectionChange: (section: NeuralStreamSection) => void;
  onClose: () => void;
  selectedCardTitle?: string;
}

const SECTION_CONFIG: Record<NeuralStreamSection, { icon: React.FC<any>; label: string; description: string }> = {
  'related-documents': {
    icon: FileText,
    label: 'Dokumenter',
    description: 'Kilder, lovtekster og rapporter',
  },
  'related-actors': {
    icon: Users,
    label: 'Aktører',
    description: 'Nøglepersoner og organisationer',
  },
  'related-incidents': {
    icon: AlertTriangle,
    label: 'Hændelser',
    description: 'Nylige og relevante incidents',
  },
  'affecting-policies': {
    icon: Scale,
    label: 'Policies',
    description: 'Regulerende politikker',
  },
};

const DocumentCard: React.FC<{ doc: RelatedDocument }> = ({ doc }) => {
  const typeColors: Record<string, string> = {
    legislation: NEON_COLORS.blue,
    report: NEON_COLORS.cyan,
    standard: NEON_COLORS.purple,
    guidance: NEON_COLORS.green,
    article: NEON_COLORS.amber,
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
              style={{ backgroundColor: `${typeColors[doc.type]}20`, color: typeColors[doc.type] }}
            >
              {doc.type}
            </span>
            <span className="text-[10px] text-white/40">{Math.round(doc.relevanceScore * 100)}% match</span>
          </div>
          <h4 className="text-sm font-medium text-white">{doc.title}</h4>
          <p className="text-xs text-white/50 mt-1">{doc.source}</p>
          {doc.snippet && (
            <p className="text-xs text-white/40 mt-2 line-clamp-2 italic">"{doc.snippet}"</p>
          )}
        </div>
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/60" />
          </a>
        )}
      </div>
    </div>
  );
};

const ActorCard: React.FC<{ actor: RelatedActor }> = ({ actor }) => {
  const influenceColors = {
    high: NEON_COLORS.red,
    medium: NEON_COLORS.amber,
    low: NEON_COLORS.green,
  };

  const typeEmoji = {
    country: '🏛️',
    organization: '🏢',
    person: '👤',
    group: '👥',
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <span className="text-xl">{typeEmoji[actor.type]}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">{actor.name}</h4>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
              style={{ backgroundColor: `${influenceColors[actor.influence]}20`, color: influenceColors[actor.influence] }}
            >
              {actor.influence} influence
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">{actor.role}</p>
          {actor.stance && (
            <p className="text-xs text-white/40 mt-2 italic">"{actor.stance}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

const IncidentCard: React.FC<{ incident: RelatedIncident }> = ({ incident }) => {
  const severityColors = {
    critical: NEON_COLORS.red,
    high: NEON_COLORS.orange,
    medium: NEON_COLORS.amber,
    low: NEON_COLORS.green,
  };

  const typeEmoji = {
    breach: '💥',
    attack: '⚔️',
    vulnerability: '🕳️',
    'policy-event': '📋',
    debate: '💬',
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <span className="text-xl">{typeEmoji[incident.type]}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
              style={{ backgroundColor: `${severityColors[incident.severity]}20`, color: severityColors[incident.severity] }}
            >
              {incident.severity}
            </span>
            <span className="text-[10px] text-white/40">{incident.date}</span>
          </div>
          <h4 className="text-sm font-medium text-white">{incident.title}</h4>
          <p className="text-xs text-white/50 mt-1 line-clamp-2">{incident.description}</p>
        </div>
      </div>
    </div>
  );
};

const PolicyCard: React.FC<{ policy: AffectingPolicy }> = ({ policy }) => {
  const statusColors = {
    active: NEON_COLORS.green,
    pending: NEON_COLORS.amber,
    proposed: NEON_COLORS.cyan,
    delayed: NEON_COLORS.red,
  };

  const complianceColors = {
    compliant: NEON_COLORS.green,
    partial: NEON_COLORS.amber,
    'non-compliant': NEON_COLORS.red,
    unknown: '#6B7280',
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
              style={{ backgroundColor: `${statusColors[policy.status]}20`, color: statusColors[policy.status] }}
            >
              {policy.status}
            </span>
            <span className="text-[10px] text-white/40">{policy.type === 'external' ? '🌍' : '🏠'} {policy.jurisdiction}</span>
          </div>
          <h4 className="text-sm font-medium text-white">{policy.name}</h4>
          <p className="text-xs text-white/50 mt-1">{policy.relevance}</p>
        </div>
        {policy.complianceStatus && (
          <div
            className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
            style={{ backgroundColor: `${complianceColors[policy.complianceStatus]}20`, color: complianceColors[policy.complianceStatus] }}
          >
            {policy.complianceStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export const NeuralStreamPanel: React.FC<NeuralStreamPanelProps> = ({
  context,
  activeSection,
  onSectionChange,
  onClose,
  selectedCardTitle,
}) => {
  const sections: NeuralStreamSection[] = [
    'related-documents',
    'related-actors',
    'related-incidents',
    'affecting-policies',
  ];

  const getContent = () => {
    switch (activeSection) {
      case 'related-documents':
        return context.documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />);
      case 'related-actors':
        return context.actors.map((actor) => <ActorCard key={actor.id} actor={actor} />);
      case 'related-incidents':
        return context.incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />);
      case 'affecting-policies':
        return context.policies.map((policy) => <PolicyCard key={policy.id} policy={policy} />);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 z-40 flex flex-col">
      {/* Glass background */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border-l border-white/10" />
      
      {/* Neon accent */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-magenta-500/50" />

      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Neural Stream</h3>
                <p className="text-[10px] text-white/40">Kontekstuel indsigt</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          
          {selectedCardTitle && (
            <div className="mt-2 px-2 py-1.5 bg-white/5 rounded text-xs text-white/70">
              Viser kontekst for: <span className="text-cyan-400 font-medium">{selectedCardTitle}</span>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex-shrink-0 flex border-b border-white/10">
          {sections.map((section) => {
            const config = SECTION_CONFIG[section];
            const Icon = config.icon;
            const isActive = section === activeSection;

            return (
              <button
                key={section}
                onClick={() => onSectionChange(section)}
                className={`flex-1 px-2 py-2.5 text-center transition-all relative ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-0.5" />
                <span className="text-[10px]">{config.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {context.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : (
            getContent()
          )}
        </div>

        {/* Section description */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span className="font-medium text-white/60">{SECTION_CONFIG[activeSection].label}:</span>
            <span>{SECTION_CONFIG[activeSection].description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralStreamPanel;
