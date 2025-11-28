// MindMap Builder - Data Sources Panel Component

import React from 'react';
import { 
  Database, 
  FileText, 
  Globe, 
  Mail, 
  BookOpen, 
  HardDrive,
  History,
  Check,
  X,
} from 'lucide-react';
import { DATA_SOURCES, DataSourceType } from './dataSourceConnector';

interface DataSourcesPanelProps {
  onClose: () => void;
}

// Icon mapping
const SOURCE_ICONS: Record<DataSourceType, React.FC<{ className?: string }>> = {
  vidensarkiv: Database,
  local_files: HardDrive,
  browser_history: History,
  outlook_emails: Mail,
  web_search: Globe,
  wikipedia: BookOpen,
  pubmed: FileText,
  google_drive: FileText,
};

// Source descriptions
const getSourceDescription = (type: DataSourceType): string => {
  const descriptions: Record<DataSourceType, string> = {
    vidensarkiv: 'Alle indekserede dokumenter og data',
    local_files: 'Scannede filer fra din computer',
    browser_history: 'Besøgte websites og søgninger',
    outlook_emails: 'Emails fra Outlook',
    web_search: 'Søg på internettet',
    wikipedia: 'Wikipedia artikler',
    pubmed: 'Medicinske forskningsartikler',
    google_drive: 'Google Drive dokumenter',
  };
  return descriptions[type] || '';
};

export const DataSourcesPanel: React.FC<DataSourcesPanelProps> = ({ onClose }) => {
  // Toggle source enabled state directly in DATA_SOURCES
  const handleToggle = (type: DataSourceType) => {
    const source = DATA_SOURCES.find(s => s.type === type);
    if (source) {
      source.enabled = !source.enabled;
    }
  };

  const enabledCount = DATA_SOURCES.filter(s => s.enabled).length;

  return (
    <div className="absolute top-16 right-4 z-40 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Data Kilder</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Sources list */}
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {DATA_SOURCES.map((source) => {
          const Icon = SOURCE_ICONS[source.type];

          return (
            <button
              key={source.type}
              onClick={() => handleToggle(source.type)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                source.enabled
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${source.color}20`, color: source.color }}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Label & description */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {source.label}
                  </span>
                  <span className="text-xs text-white/40">{source.icon}</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {getSourceDescription(source.type)}
                </span>
              </div>

              {/* Toggle indicator */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  source.enabled ? 'bg-green-500' : 'bg-white/10'
                }`}
              >
                {source.enabled && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/10 bg-white/5">
        <span className="text-[10px] text-white/40">
          {enabledCount} af {DATA_SOURCES.length} kilder aktive
        </span>
      </div>
    </div>
  );
};

export default DataSourcesPanel;
