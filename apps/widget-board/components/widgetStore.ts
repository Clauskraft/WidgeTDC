import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WidgetInstance, WidgetConfig } from '../types';
import { staticWidgetRegistry } from '../src/staticWidgetRegistry';

const WIDGETS_STORAGE_KEY = 'widgetboard_widgets';

// Valid widget types from the static registry
const validWidgetTypes = new Set(Object.keys(staticWidgetRegistry));

// Filter function to remove widgets that no longer exist in the registry
const filterValidWidgets = (widgets: WidgetInstance[]): WidgetInstance[] => {
    return widgets.filter(w => {
        const isValid = validWidgetTypes.has(w.widgetType);
        if (!isValid) {
            console.warn(`[WidgetStore] Removing invalid widget type from storage: ${w.widgetType}`);
        }
        return isValid;
    });
};

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
            name: WIDGETS_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            // Filter out invalid widgets when loading from storage
            merge: (persistedState: unknown, currentState: WidgetState) => {
                const persisted = persistedState as Partial<WidgetState> | undefined;
                if (persisted?.widgets) {
                    return {
                        ...currentState,
                        ...persisted,
                        widgets: filterValidWidgets(persisted.widgets),
                    };
                }
                return currentState;
            },
        }
    )
);