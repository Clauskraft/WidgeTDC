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
import DarkWebMonitorWidget from './widgets/DarkWebMonitorWidget';
import Phase1CFastTrackKanbanWidget from './widgets/Phase1CFastTrackKanbanWidget';
import { WidgetDefinition } from './types';
import KanbanWidget from './widgets/KanbanWidget';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'Phase1CFastTrackKanban',
    name: 'Priority 3: Phase 1.C Kanban',
    component: Phase1CFastTrackKanbanWidget,
    defaultLayout: { w: 12, h: 12 },
    source: 'proprietary',
    minW: 8,
    minH: 8,
  },
  {
    id: 'AgentChatWidget',
    name: 'Chat Agent',
    component: AgentChatWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'MCPEmailRAGWidget',
    name: 'Email Svarsassistent',
    component: MCPEmailRAGWidget,
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 9,
  },
  {
    id: 'IntelligentNotesWidget',
    name: 'Intelligent Notes',
    component: IntelligentNotesWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'CybersecurityOverwatchWidget',
    name: 'Cybersecurity Overwatch',
    component: CybersecurityOverwatchWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'ProcurementIntelligenceWidget',
    name: 'Procurement Intelligence',
    component: ProcurementIntelligenceWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'LiveConversationWidget',
    name: 'Live Samtale',
    component: LiveConversationWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'ImageAnalyzerWidget',
    name: 'Billedanalyse',
    component: ImageAnalyzerWidget,
    defaultLayout: { w: 6, h: 10 },
    source: 'proprietary',
    minW: 4,
    minH: 8,
  },
  {
    id: 'AudioTranscriberWidget',
    name: 'Lydtransskription',
    component: AudioTranscriberWidget,
    defaultLayout: { w: 6, h: 8 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
  },
  {
    id: 'VideoAnalyzerWidget',
    name: 'Videoanalyse',
    component: VideoAnalyzerWidget,
    defaultLayout: { w: 7, h: 11 },
    source: 'proprietary',
    minW: 5,
    minH: 9,
  },
  {
    id: 'MCPConnectorWidget',
    name: 'MCP Connector',
    component: MCPConnectorWidget,
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'PromptLibraryWidget',
    name: 'Prompt Bibliotek',
    component: PromptLibraryWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
    minW: 4,
  },
  {
    id: 'PerformanceMonitorWidget',
    name: 'Performance Monitor',
    component: PerformanceMonitorWidget,
    defaultLayout: { w: 12, h: 6 },
    source: 'proprietary',
    minW: 6,
    maxH: 6,
  },
  {
    id: 'SystemMonitorWidget',
    name: 'System Monitor',
    component: SystemMonitorWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'SystemSettingsWidget',
    name: 'Systemindstillinger',
    component: SystemSettingsWidget,
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    maxW: 5,
    maxH: 7,
  },
  {
    id: 'AgentBuilderWidget',
    name: 'Agent Builder',
    component: AgentBuilderWidget,
    defaultLayout: { w: 7, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'WidgetImporterWidget',
    name: 'Widget Importer',
    component: WidgetImporterWidget,
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
    minW: 6,
    minH: 8,
  },
  {
    id: 'StatusWidget',
    name: 'Status',
    component: StatusWidget,
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
    minW: 4,
    minH: 6,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'DarkWebMonitor',
    name: 'Dark Web Monitor',
    component: DarkWebMonitorWidget,
    defaultLayout: { w: 12, h: 10 },
    source: 'proprietary',
    minW: 8,
    minH: 8,
  }
];
