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
import { WidgetDefinition } from './types';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'AgentChatWidget',
    name: 'Chat Agent',
    component: AgentChatWidget,
    defaultLayout: { w: 6, h: 9 }
  },
  {
    id: 'LiveConversationWidget',
    name: 'Live Samtale',
    component: LiveConversationWidget,
    defaultLayout: { w: 6, h: 9 }
  },
  {
    id: 'ImageAnalyzerWidget',
    name: 'Billedanalyse',
    component: ImageAnalyzerWidget,
    defaultLayout: { w: 6, h: 10 }
  },
  {
    id: 'AudioTranscriberWidget',
    name: 'Lydtransskription',
    component: AudioTranscriberWidget,
    defaultLayout: { w: 6, h: 8 }
  },
  {
    id: 'VideoAnalyzerWidget',
    name: 'Videoanalyse',
    component: VideoAnalyzerWidget,
    defaultLayout: { w: 7, h: 11 }
  },
  {
    id: 'MCPConnectorWidget',
    name: 'MCP Connector',
    component: MCPConnectorWidget,
    defaultLayout: { w: 8, h: 11 }
  },
  {
    id: 'PromptLibraryWidget',
    name: 'Prompt Bibliotek',
    component: PromptLibraryWidget,
    defaultLayout: { w: 6, h: 9 }
  },
  {
    id: 'PerformanceMonitorWidget',
    name: 'Performance Monitor',
    component: PerformanceMonitorWidget,
    defaultLayout: { w: 12, h: 6 }
  },
  {
    id: 'SystemSettingsWidget',
    name: 'Systemindstillinger',
    component: SystemSettingsWidget,
    defaultLayout: { w: 5, h: 7 }
  },
  {
    id: 'AgentBuilderWidget',
    name: 'Agent Builder',
    component: AgentBuilderWidget,
    defaultLayout: { w: 7, h: 10 }
  }
];