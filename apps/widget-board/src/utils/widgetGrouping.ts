import { 
  Shield, 
  Brain, 
  Briefcase, 
  Wrench, 
  Database, 
  Activity, 
  Lock, 
  Eye, 
  Cpu, 
  MessageSquare, 
  Terminal, 
  FileText, 
  Search 
} from 'lucide-react';

export type WidgetCategory = 'ops' | 'nexus' | 'command' | 'forge' | 'knowledge';

export interface WidgetGroup {
  id: WidgetCategory;
  title: string;
  description: string;
  icon: any; // Lucide icon
  color: string;
  widgets: string[]; // Widget IDs form registry
}

export const WIDGET_GROUPS: WidgetGroup[] = [
  {
    id: 'ops',
    title: 'Ops & Security',
    description: 'System overvågning og sikkerhed',
    icon: Shield,
    color: 'text-red-400',
    widgets: [
      'SystemMonitorWidget',
      'NetworkSpyWidget',
      'CybersecurityOverwatchWidget',
      'DarkWebMonitorWidget',
      'SragGovernanceWidget',
      'StatusWidget',
      'PerformanceMonitorWidget',
      'LocalScanWidget'
    ]
  },
  {
    id: 'nexus',
    title: 'Neural Nexus',
    description: 'AI Agenter og Kommunikation',
    icon: Brain,
    color: 'text-purple-400',
    widgets: [
      'AgentChatWidget',
      'LiveConversationWidget',
      'TheArchitectWidget',
      'VisionaryWidget',
      'EvolutionAgentWidget',
      'PersonaCoordinatorWidget',
      'IntelligenceEvolutionWidget',
      'PersonalAgentWidget',
      'AiPalWidget',
      'NeuralInterfaceWidget'
    ]
  },
  {
    id: 'command',
    title: 'Executive Command',
    description: 'Strategi, Risiko og Beslutninger',
    icon: Briefcase,
    color: 'text-amber-400',
    widgets: [
      'StrategicCockpitWidget',
      'ExecutiveRiskCanvasWidget',
      'CmaDecisionWidget',
      'ProcurementIntelligenceWidget',
      'PlatformModelGovernanceWidget',
      'HansPedderMonitorWidget'
    ]
  },
  {
    id: 'forge',
    title: 'Builder\'s Forge',
    description: 'Udvikling og Skabelse',
    icon: Wrench,
    color: 'text-blue-400',
    widgets: [
      'AgentBuilderWidget',
      'CodeAnalysisWidget',
      'NexusTerminalWidget',
      'PromptLibraryWidget',
      'VisualizerWidget',
      'WidgetImporterWidget',
      'McpRouterWidget'
    ]
  },
  {
    id: 'knowledge',
    title: 'Knowledge Base',
    description: 'Information, Noter og Søgning',
    icon: Database,
    color: 'text-green-400',
    widgets: [
      'LocalWikiWidget',
      'IntelligentNotesWidget',
      'SearchInterfaceWidget',
      'FeedIngestionWidget',
      'KanbanWidget',
      'MCPEmailRAGWidget',
      'AudioTranscriberWidget',
      'VideoAnalyzerWidget',
      'ImageAnalyzerWidget'
    ]
  }
];

export const getGroupForWidget = (widgetId: string): WidgetGroup | undefined => {
  return WIDGET_GROUPS.find(group => group.widgets.includes(widgetId));
};
