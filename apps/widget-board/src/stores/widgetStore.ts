import { create } from 'zustand';

export interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  config?: Record<string, any>;
  visible?: boolean;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface WidgetStoreState {
  widgets: Widget[];
  selectedWidgetId: string | null;
  isEditMode: boolean;
  
  // Actions
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updateWidgetLayout: (id: string, layout: Partial<WidgetLayout>) => void;
  setWidgets: (widgets: Widget[]) => void;
  selectWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  setEditMode: (isEditMode: boolean) => void;
  clearWidgets: () => void;
}

export const useWidgetStore = create<WidgetStoreState>((set) => ({
  widgets: [],
  selectedWidgetId: null,
  isEditMode: false,

  addWidget: (widget) =>
    set((state) => ({
      widgets: [...state.widgets, widget],
    })),

  removeWidget: (id) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    })),

  updateWidget: (id, updates) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  updateWidgetLayout: (id, layout) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id
          ? {
              ...w,
              x: layout.x ?? w.x,
              y: layout.y ?? w.y,
              w: layout.w ?? w.w,
              h: layout.h ?? w.h,
              minW: layout.minW ?? w.minW,
              minH: layout.minH ?? w.minH,
              maxW: layout.maxW ?? w.maxW,
              maxH: layout.maxH ?? w.maxH,
            }
          : w
      ),
    })),

  setWidgets: (widgets) => set({ widgets }),

  selectWidget: (id) => set({ selectedWidgetId: id }),

  toggleEditMode: () =>
    set((state) => ({
      isEditMode: !state.isEditMode,
      selectedWidgetId: !state.isEditMode ? state.selectedWidgetId : null,
    })),

  setEditMode: (isEditMode) =>
    set({
      isEditMode,
      selectedWidgetId: isEditMode ? null : undefined,
    }),

  clearWidgets: () =>
    set({
      widgets: [],
      selectedWidgetId: null,
    }),
}));

export default useWidgetStore;
