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
import CmaDecisionWidget from './widgets/CmaDecisionWidget';
import SragGovernanceWidget from './widgets/SragGovernanceWidget';
import EvolutionAgentWidget from './widgets/EvolutionAgentWidget';
import McpRouterWidget from './widgets/McpRouterWidget';
import AiPalWidget from './widgets/AiPalWidget';
import { WidgetDefinition } from './types';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
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
    id: 'CmaDecisionWidget',
    name: 'CMA Decision Assistant',
    component: CmaDecisionWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'SragGovernanceWidget',
    name: 'SRAG Data Governance',
    component: SragGovernanceWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'EvolutionAgentWidget',
    name: 'Evolution & KPI Monitor',
    component: EvolutionAgentWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'McpRouterWidget',
    name: 'MCP Inspector',
    component: McpRouterWidget,
    defaultLayout: { w: 8, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  },
  {
    id: 'AiPalWidget',
    name: 'AI PAL Assistant',
    component: AiPalWidget,
    defaultLayout: { w: 7, h: 12 },
    source: 'proprietary',
    minW: 6,
    minH: 10,
  }
];