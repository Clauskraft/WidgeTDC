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
import { WidgetDefinition } from './types';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'AgentChatWidget',
    name: 'Chat Agent',
    component: AgentChatWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
  },
  {
    id: 'LiveConversationWidget',
    name: 'Live Samtale',
    component: LiveConversationWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
  },
  {
    id: 'ImageAnalyzerWidget',
    name: 'Billedanalyse',
    component: ImageAnalyzerWidget,
    defaultLayout: { w: 6, h: 10 },
    source: 'proprietary',
  },
  {
    id: 'AudioTranscriberWidget',
    name: 'Lydtransskription',
    component: AudioTranscriberWidget,
    defaultLayout: { w: 6, h: 8 },
    source: 'proprietary',
  },
  {
    id: 'VideoAnalyzerWidget',
    name: 'Videoanalyse',
    component: VideoAnalyzerWidget,
    defaultLayout: { w: 7, h: 11 },
    source: 'proprietary',
  },
  {
    id: 'MCPConnectorWidget',
    name: 'MCP Connector',
    component: MCPConnectorWidget,
    defaultLayout: { w: 8, h: 11 },
    source: 'proprietary',
  },
  {
    id: 'PromptLibraryWidget',
    name: 'Prompt Bibliotek',
    component: PromptLibraryWidget,
    defaultLayout: { w: 6, h: 9 },
    source: 'proprietary',
  },
  {
    id: 'PerformanceMonitorWidget',
    name: 'Performance Monitor',
    component: PerformanceMonitorWidget,
    defaultLayout: { w: 12, h: 6 },
    source: 'proprietary',
  },
  {
    id: 'SystemSettingsWidget',
    name: 'Systemindstillinger',
    component: SystemSettingsWidget,
    defaultLayout: { w: 5, h: 7 },
    source: 'proprietary',
  },
  {
    id: 'AgentBuilderWidget',
    name: 'Agent Builder',
    component: AgentBuilderWidget,
    defaultLayout: { w: 7, h: 10 },
    source: 'proprietary',
  },
  {
    id: 'WidgetImporterWidget',
    name: 'Widget Importer',
    component: WidgetImporterWidget,
    defaultLayout: { w: 8, h: 10 },
    source: 'proprietary',
  }
];