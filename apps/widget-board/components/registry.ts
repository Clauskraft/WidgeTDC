import { lazy } from 'react';
import type { WidgetDefinition } from '../types';

/**
 * This file serves as the central registry for all widgets in the application.
 * By using React.lazy(), we ensure that the code for each widget is only loaded
 * when it's actually needed, significantly improving initial load performance.
 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
    {
        id: 'AgentChatWidget',
        name: 'AI Agent Chat',
        category: 'ai-agents',
        component: lazy(() => import('../widgets/AgentChatWidget')),
        defaultLayout: { w: 3, h: 6 },
        source: 'proprietary',
        minW: 2,
        minH: 4,
    },
    {
        id: 'PromptLibraryWidget',
        name: 'Prompt Library',
        category: 'ai-agents',
        component: lazy(() => import('../widgets/PromptLibraryWidget')),
        defaultLayout: { w: 3, h: 6 },
        source: 'proprietary',
        minW: 2,
        minH: 4,
    },
    {
        id: 'WidgetImporterWidget',
        name: 'Widget Importer',
        category: 'system',
        component: lazy(() => import('../widgets/WidgetImporterWidget')),
        defaultLayout: { w: 4, h: 8 },
        source: 'builtin',
        minW: 3,
        minH: 5,
    },
    {
        id: 'AgentTeamBuilderWidget',
        name: 'Agent Team Builder',
        category: 'testing',
        component: lazy(() => import('../widgets/AgentTeamBuilderWidget')),
        defaultLayout: { w: 4, h: 6 },
        source: 'builtin',
        minW: 3,
        minH: 4,
    },
    // Add other widgets here as needed
];