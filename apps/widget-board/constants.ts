import AgentChatWidget from './widgets/AgentChatWidget';
import PromptLibraryWidget from './widgets/PromptLibraryWidget';
import PerformanceMonitorWidget from './widgets/PerformanceMonitorWidget';
import SystemMonitorWidget from './widgets/SystemMonitorWidget';
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
// import DarkWebMonitorWidget from './widgets/DarkWebMonitorWidget'; // TODO: Create widget
import Phase1CFastTrackKanbanWidget from './widgets/Phase1CFastTrackKanbanWidget';
import { WidgetDefinition } from './types';
import KanbanWidget from './widgets/KanbanWidget';
import FeedIngestionWidget from './widgets/FeedIngestionWidget';
import SearchInterfaceWidget from './widgets/SearchInterfaceWidget';
import ActivityStreamWidget from './widgets/ActivityStreamWidget';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'Phase1CFastTrackKanban',
    name: 'Priority 3: Phase 1.C Kanban',
    component: Phase1CFastTrackKanbanWidget,
    category: 'project-management',
    defaultLayout: { w: 12, h: 12 },
    source: 'proprietary',
    minW: 8,
    minH: 8,
  },
  {
    id: 'AgentChatWidget',
    name: 'Chat Agent',
    component: AgentChatWidget,
    category: 'ai-agents',
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'MCPEmailRAGWidget',
    name: 'Email Svarsassistent',
    component: MCPEmailRAGWidget,
    category: 'communication',
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 9,
  },
  {
    id: 'IntelligentNotesWidget',
    name: 'Intelligent Notes',
    component: IntelligentNotesWidget,
    category: 'productivity',
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'CybersecurityOverwatchWidget',
    name: 'Cybersecurity Overwatch',
    component: CybersecurityOverwatchWidget,
    category: 'cybersecurity',
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'ProcurementIntelligenceWidget',
    name: 'Procurement Intelligence',
    component: ProcurementIntelligenceWidget,
    category: 'business',
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'LiveConversationWidget',
    name: 'Live Samtale',
    component: LiveConversationWidget,
    category: 'communication',
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'ImageAnalyzerWidget',
    name: 'Billedanalyse',
    component: ImageAnalyzerWidget,
    category: 'media-analysis',
    defaultLayout: { w: 6, h: 10 },
    source: 'proprietary',
    minW: 4,
    minH: 8,
  },
  {
    id: 'AudioTranscriberWidget',
    name: 'Lydtransskription',
    component: AudioTranscriberWidget,
    category: 'media-analysis',
    defaultLayout: { w: 6, h: 8 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'VideoAnalyzerWidget',
    name: 'Videoanalyse',
    component: VideoAnalyzerWidget,
    category: 'media-analysis',
    defaultLayout: { w: 7, h: 11 },
    source: 'proprietary',
    minW: 5,
    minH: 9,
  },
  {
    id: 'MCPConnectorWidget',
    name: 'MCP Connector',
    component: MCPConnectorWidget,
    category: 'system',
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'PromptLibraryWidget',
    name: 'Prompt Bibliotek',
    component: PromptLibraryWidget,
    category: 'ai-agents',
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
  },
  {
    id: 'PerformanceMonitorWidget',
    name: 'Performance Monitor',
    component: PerformanceMonitorWidget,
    category: 'system',
    defaultLayout: { w: 12, h: 6 },
    source: 'proprietary',
    minW: 6,
    maxH: 6,
  },
  {
    id: 'SystemMonitorWidget',
    name: 'System Monitor',
    component: SystemMonitorWidget,
    category: 'system',
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'SystemSettingsWidget',
    name: 'Systemindstillinger',
    component: SystemSettingsWidget,
    category: 'system',
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    maxW: 5,
    maxH: 7,
  },
  {
    id: 'AgentBuilderWidget',
    name: 'Agent Builder',
    component: AgentBuilderWidget,
    category: 'ai-agents',
    defaultLayout: { w: 7, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'WidgetImporterWidget',
    name: 'Widget Importer',
    component: WidgetImporterWidget,
    category: 'system',
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'FeedIngestionWidget',
    name: '🔄 Feed Ingestion',
    component: FeedIngestionWidget,
    category: 'cybersecurity',
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'SearchInterfaceWidget',
    name: '🔍 Security Search',
    component: SearchInterfaceWidget,
    category: 'cybersecurity',
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'ActivityStreamWidget',
    name: '📡 Activity Stream',
    component: ActivityStreamWidget,
    category: 'cybersecurity',
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'StatusWidget',
    name: 'Status',
    component: StatusWidget,
    category: 'system',
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
    maxW: 6,
    maxH: 8,
  },
  // TODO: Re-enable when DarkWebMonitorWidget is created
  // {
  //   id: 'DarkWebMonitor',
  //   name: 'Dark Web Monitor',
  //   component: DarkWebMonitorWidget,
  //   category: 'cybersecurity',
  //   defaultLayout: { w: 12, h: 10 },
  //   source: 'proprietary',
  //   minW: 8,
  //   minH: 8,
  // }
];
