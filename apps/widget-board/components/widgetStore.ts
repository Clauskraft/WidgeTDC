import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WidgetInstance, WidgetConfig } from '../types';

const WIDGETS_STORAGE_KEY = 'widgetboard_widgets';

const defaultWidgets: WidgetInstance[] = [
    { id: 'chat-1', widgetType: 'AgentChatWidget' },
    { id: 'prompt-library-1', widgetType: 'PromptLibraryWidget' },
];

interface WidgetState {
    widgets: WidgetInstance[];
    addWidget: (widgetType: string, initialConfig?: WidgetConfig) => void;
    removeWidget: (widgetId: string) => WidgetInstance | undefined;
    reAddWidget: (widget: WidgetInstance) => void;
    updateWidgetConfig: (widgetId: string, config: WidgetConfig) => void;
    resetToDefault: () => void;
}

export const useWidgetStore = create<WidgetState>()(
    persist(
        (set, get) => ({
            widgets: defaultWidgets,

            addWidget: (widgetType, initialConfig) => set((state) => ({
                widgets: [
                    ...state.widgets,
                    {
                        id: `${widgetType}-${Date.now()}`,
                        widgetType,
                        config: initialConfig
                    },
                ],
            })),

            removeWidget: (widgetId) => {
                const state = get();
                const widgetToRemove = state.widgets.find(w => w.id === widgetId);
                set({
                    widgets: state.widgets.filter((w) => w.id !== widgetId),
                });
                return widgetToRemove;
            },

            reAddWidget: (widget) => set((state) => ({
                widgets: [...state.widgets, widget],
            })),

            updateWidgetConfig: (widgetId, config) => set((state) => ({
                widgets: state.widgets.map((w) =>
                    w.id === widgetId ? { ...w, config } : w
                ),
            })),

            resetToDefault: () => {
                if (confirm('Er du sikker på at du vil nulstille til standard widgets?')) {
                    set({ widgets: defaultWidgets });
                    localStorage.removeItem('widgetboard_layouts'); // Ryd også layout
                }
            },
        }),
        {
            name: WIDGETS_STORAGE_KEY, // Navn på item i localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);