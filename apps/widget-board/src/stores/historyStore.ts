import { create } from 'zustand';
import { Widget } from './widgetStore';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  widgets: Widget[];
  description?: string;
}

interface HistoryStoreState {
  history: HistoryEntry[];
  currentIndex: number;
  maxHistory: number;
  
  // Actions
  addEntry: (action: string, widgets: Widget[], description?: string) => void;
  undo: () => Widget[] | null;
  redo: () => Widget[] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  setMaxHistory: (max: number) => void;
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistory: 50,

  addEntry: (action, widgets, description) =>
    set((state) => {
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        action,
        widgets: JSON.parse(JSON.stringify(widgets)), // Deep copy
        description,
      };

      // Remove any entries after current index (if we're not at the end)
      const newHistory = state.history.slice(0, state.currentIndex + 1);
      newHistory.push(newEntry);

      // Trim history if it exceeds maxHistory
      if (newHistory.length > state.maxHistory) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }),

  undo: () => {
    const state = get();
    if (state.currentIndex > 0) {
      const newIndex = state.currentIndex - 1;
      set({ currentIndex: newIndex });
      return state.history[newIndex].widgets;
    }
    return null;
  },

  redo: () => {
    const state = get();
    if (state.currentIndex < state.history.length - 1) {
      const newIndex = state.currentIndex + 1;
      set({ currentIndex: newIndex });
      return state.history[newIndex].widgets;
    }
    return null;
  },

  canUndo: () => {
    const state = get();
    return state.currentIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.currentIndex < state.history.length - 1;
  },

  clearHistory: () =>
    set({
      history: [],
      currentIndex: -1,
    }),

  setMaxHistory: (max) =>
    set((state) => {
      if (max < state.maxHistory && state.history.length > max) {
        // Trim history from the beginning
        const trimCount = state.history.length - max;
        return {
          maxHistory: max,
          history: state.history.slice(trimCount),
          currentIndex: Math.max(0, state.currentIndex - trimCount),
        };
      }
      return { maxHistory: max };
    }),
}));

export default useHistoryStore;
