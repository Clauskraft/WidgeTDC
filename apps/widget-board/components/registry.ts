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
        component: lazy(() => import('./AgentChatWidget')),
        defaultLayout: { w: 4, h: 10 },
        source: 'proprietary',
        minW: 3,
        minH: 5,
    },
    {
        id: 'PromptLibraryWidget',
        name: 'Prompt Library',
        category: 'ai-agents',
        component: lazy(() => import('./PromptLibraryWidget')),
        defaultLayout: { w: 3, h: 8 },
        source: 'proprietary',
        minW: 2,
        minH: 4,
    },
    {
        id: 'WidgetImporterWidget',
        name: 'Widget Importer',
        category: 'system',
        component: lazy(() => import('./WidgetImporterWidget')),
        defaultLayout: { w: 5, h: 12 },
        source: 'builtin',
        minW: 4,
        minH: 8,
    },
    // ... Tilføj andre widgets her på samme måde
    // {
    //   id: 'SystemSettingsWidget',
    //   name: 'System Settings',
    //   category: 'system',
    //   component: lazy(() => import('./SystemSettingsWidget')),
    //   ...
    // }
];