import { create } from 'zustand';
import type { WidgetInstance } from '../types';
import type { Layouts } from 'react-grid-layout';

export type HistoryAction =
    | {
        type: 'WIDGET_REMOVED';
        payload: {
            widget: WidgetInstance;
            // Vi gemmer hele layoutet for at kunne gendanne det præcist
            previousLayouts: Layouts;
        };
    }
    | {
        type: 'WIDGET_ADDED';
        payload: {
            widgetId: string;
        };
    };
// Fremtidige handlinger som 'LAYOUT_CHANGED' kan tilføjes her

interface HistoryState {
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];
    push: (action: HistoryAction) => void;
    undo: () => HistoryAction | undefined;
    redo: () => HistoryAction | undefined;
    clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    undoStack: [],
    redoStack: [],

    push: (action) => set((state) => ({
        undoStack: [...state.undoStack, action],
        redoStack: [], // Ryd redo-stakken, når en ny handling udføres
    })),

    undo: () => {
        const stack = get().undoStack;
        if (stack.length === 0) return undefined;
        const lastAction = stack[stack.length - 1];
        set({
            undoStack: stack.slice(0, -1),
            redoStack: [...get().redoStack, lastAction],
        });
        return lastAction;
    },

    redo: () => {
        const stack = get().redoStack;
        if (stack.length === 0) return undefined;
        const lastAction = stack[stack.length - 1];
        set({
            redoStack: stack.slice(0, -1),
            undoStack: [...get().undoStack, lastAction],
        });
        return lastAction;
    },

    clear: () => set({ undoStack: [], redoStack: [] }),
}));