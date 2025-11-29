/**
 * Global App State Store using Zustand
 */

import { create } from 'zustand';

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeItem {
  id: string;
  content: string;
  metadata: any;
  score?: number;
}

interface TaskSuggestion {
  id: string;
  taskType: string;
  description: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface AppState {
  // Connection
  isConnected: boolean;
  apiUrl: string;
  
  // User context
  orgId: string;
  userId: string;
  
  // Notes
  notes: Note[];
  notesLoading: boolean;
  
  // Knowledge
  knowledgeResults: KnowledgeItem[];
  knowledgeLoading: boolean;
  
  // Tasks
  taskSuggestions: TaskSuggestion[];
  tasksLoading: boolean;
  
  // Actions
  setConnection: (connected: boolean) => void;
  setApiUrl: (url: string) => void;
  setContext: (orgId: string, userId: string) => void;
  setNotes: (notes: Note[]) => void;
  setNotesLoading: (loading: boolean) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setKnowledgeResults: (results: KnowledgeItem[]) => void;
  setKnowledgeLoading: (loading: boolean) => void;
  setTaskSuggestions: (suggestions: TaskSuggestion[]) => void;
  setTasksLoading: (loading: boolean) => void;
  updateTaskStatus: (id: string, status: TaskSuggestion['status']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isConnected: false,
  apiUrl: 'http://localhost:3001',
  orgId: 'default',
  userId: 'mobile-user',
  notes: [],
  notesLoading: false,
  knowledgeResults: [],
  knowledgeLoading: false,
  taskSuggestions: [],
  tasksLoading: false,

  // Actions
  setConnection: (connected) => set({ isConnected: connected }),
  setApiUrl: (url) => set({ apiUrl: url }),
  setContext: (orgId, userId) => set({ orgId, userId }),
  
  setNotes: (notes) => set({ notes }),
  setNotesLoading: (loading) => set({ notesLoading: loading }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n)
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),
  
  setKnowledgeResults: (results) => set({ knowledgeResults: results }),
  setKnowledgeLoading: (loading) => set({ knowledgeLoading: loading }),
  
  setTaskSuggestions: (suggestions) => set({ taskSuggestions: suggestions }),
  setTasksLoading: (loading) => set({ tasksLoading: loading }),
  updateTaskStatus: (id, status) => set((state) => ({
    taskSuggestions: state.taskSuggestions.map((t) => 
      t.id === id ? { ...t, status } : t
    )
  })),
}));

