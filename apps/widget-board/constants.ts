import AgentChatWidget from './widgets/AgentChatWidget';
import PromptLibraryWidget from './widgets/PromptLibraryWidget';
import PerformanceMonitorWidget from './widgets/PerformanceMonitorWidget';
import SystemSettingsWidget from './widgets/SystemSettingsWidget';
import AgentBuilderWidget from './widgets/AgentBuilderWidget';
import LiveConversationWidget from './widgets/LiveConversationWidget';
import MCPConnectorWidget from './widgets/MCPConnectorWidget';
import ImageAnalyzerWidget from './widgets/ImageAnalyzerWidget';
import AudioTranscriberWidget from './widgets/AudioTranscriberWidget';
import VideoAnalyzerWidget from './widgets/VideoAnalyzerWidget';
import WidgetImporterWidget from './widgets/WidgetImporterWidget';
import MCPEmailRAGWidget from './widgets/MCPEmailRAGWidget';
import IntelligentNotesWidget from './widgets/IntelligentNotesWidget';
import CybersecurityOverwatchWidget from './widgets/CybersecurityOverwatchWidget';
import ProcurementIntelligenceWidget from './widgets/ProcurementIntelligenceWidget';
import StatusWidget from './widgets/StatusWidget';
import Phase1CFastTrackKanbanWidget from './widgets/Phase1CFastTrackKanbanWidget';
import FeedIngestionWidget from './widgets/FeedIngestionWidget';
import SearchInterfaceWidget from './widgets/SearchInterfaceWidget';
import ActivityStreamWidget from './widgets/ActivityStreamWidget';
import PersonalAgentWidget from './widgets/PersonalAgentWidget';
import CodeAnalysisWidget from './widgets/CodeAnalysisWidget';
import PersonaCoordinatorWidget from './widgets/PersonaCoordinatorWidget';
import { WidgetDefinition } from './types';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'Phase1CFastTrackKanban',
    name: '🚀 Priority 3: Phase 1.C Kanban',
    category: 'project-management',
    component: Phase1CFastTrackKanbanWidget,
    defaultLayout: { w: 12, h: 12 },
    source: 'proprietary',
    minW: 8,
    minH: 8,
  },
  {
    id: 'FeedIngestionWidget',
    name: 'Threat Feed Ingestion',
    category: 'cybersecurity',
    component: FeedIngestionWidget,
    defaultLayout: { w: 8, h: 13 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'SearchInterfaceWidget',
    name: 'Security Search Interface',
    category: 'cybersecurity',
    component: SearchInterfaceWidget,
    defaultLayout: { w: 9, h: 13 },
    source: 'proprietary',
    minW: 7,
    minH: 10,
  },
  {
    id: 'ActivityStreamWidget',
    name: 'Security Activity Stream',
    category: 'cybersecurity',
    component: ActivityStreamWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 9,
  },
  {
    id: 'AgentChatWidget',
    name: 'Chat Agent',
    category: 'ai-agents',
    component: AgentChatWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'MCPEmailRAGWidget',
    name: 'Email Svarsassistent',
    category: 'productivity',
    component: MCPEmailRAGWidget,
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 9,
  },
  {
    id: 'IntelligentNotesWidget',
    name: 'Intelligent Notes',
    category: 'productivity',
    component: IntelligentNotesWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'CybersecurityOverwatchWidget',
    name: 'Cybersecurity Overwatch',
    category: 'cybersecurity',
    component: CybersecurityOverwatchWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'ProcurementIntelligenceWidget',
    name: 'Procurement Intelligence',
    category: 'business',
    component: ProcurementIntelligenceWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'LiveConversationWidget',
    name: 'Live Samtale',
    category: 'communication',
    component: LiveConversationWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'ImageAnalyzerWidget',
    name: 'Billedanalyse',
    category: 'media-analysis',
    component: ImageAnalyzerWidget,
    defaultLayout: { w: 6, h: 10 },
    source: 'proprietary',
    minW: 4,
    minH: 8,
  },
  {
    id: 'AudioTranscriberWidget',
    name: 'Lydtransskription',
    category: 'media-analysis',
    component: AudioTranscriberWidget,
    defaultLayout: { w: 6, h: 8 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'VideoAnalyzerWidget',
    name: 'Videoanalyse',
    category: 'media-analysis',
    component: VideoAnalyzerWidget,
    defaultLayout: { w: 7, h: 11 },
    source: 'proprietary',
    minW: 5,
    minH: 9,
  },
  {
    id: 'MCPConnectorWidget',
    name: 'MCP Connector',
    category: 'system',
    component: MCPConnectorWidget,
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'PromptLibraryWidget',
    name: 'Prompt Bibliotek',
    category: 'productivity',
    component: PromptLibraryWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
  },
  {
    id: 'PerformanceMonitorWidget',
    name: 'Performance Monitor',
    category: 'system',
    component: PerformanceMonitorWidget,
    defaultLayout: { w: 12, h: 6 },
    source: 'proprietary',
    minW: 6,
    maxH: 6,
  },
  {
    id: 'SystemSettingsWidget',
    name: 'Systemindstillinger',
    category: 'system',
    component: SystemSettingsWidget,
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    maxW: 5,
    maxH: 7,
  },
  {
    id: 'AgentBuilderWidget',
    name: 'Agent Builder',
    category: 'development',
    component: AgentBuilderWidget,
    defaultLayout: { w: 7, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'WidgetImporterWidget',
    name: 'Widget Importer',
    category: 'system',
    component: WidgetImporterWidget,
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'StatusWidget',
    name: 'Status',
    category: 'system',
    component: StatusWidget,
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'PersonalAgentWidget',
    name: '🤖 Personal Agent',
    category: 'ai-agents',
    component: PersonalAgentWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'CodeAnalysisWidget',
    name: '🛡️ Code Analysis',
    category: 'development',
    component: CodeAnalysisWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'PersonaCoordinatorWidget',
    name: '👥 Persona Coordinator',
    category: 'ai-agents',
    component: PersonaCoordinatorWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  }
];
