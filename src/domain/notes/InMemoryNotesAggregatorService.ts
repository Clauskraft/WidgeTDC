/**
 * In-Memory Notes Aggregator Service
 *
 * Development implementation of NotesAggregatorService
 */

import type {
  NotesAggregatorService,
  Note,
  NoteId,
  NoteSummary,
  NoteQuery,
  NoteSyncStatus,
  NotesStatistics,
  NoteSource,
} from './types';

export class InMemoryNotesAggregatorService implements NotesAggregatorService {
  private notes: Map<NoteId, Note> = new Map();
  private noteCounter = 0;
  private syncStatuses: Map<NoteSource, NoteSyncStatus> = new Map();

  private generateNoteId(): NoteId {
    return `NOTE${String(++this.noteCounter).padStart(8, '0')}`;
  }

  async getNote(id: NoteId): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async searchNotes(query: NoteQuery): Promise<NoteSummary[]> {
    let results = Array.from(this.notes.values());

    // Filter by source
    if (query.source) {
      const sources = Array.isArray(query.source) ? query.source : [query.source];
      results = results.filter(n => sources.includes(n.source));
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(n => query.tags!.some(tag => n.tags.includes(tag)));
    }

    // Filter by categories
    if (query.categories && query.categories.length > 0) {
      results = results.filter(
        n => n.categories && query.categories!.some(cat => n.categories!.includes(cat))
      );
    }

    // Filter by archived status
    if (query.archived !== undefined) {
      results = results.filter(n => n.archived === query.archived);
    }

    // Filter by pinned status
    if (query.pinned !== undefined) {
      results = results.filter(n => n.pinned === query.pinned);
    }

    // Filter by date range
    if (query.dateRange) {
      const { from, to } = query.dateRange;
      results = results.filter(n => {
        const timestamp = n.createdAt.getTime();
        return timestamp >= from.getTime() && timestamp <= to.getTime();
      });
    }

    // Text search (simple substring match)
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      results = results.filter(
        n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.content.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = query.sortBy || 'updatedAt';
    const sortDirection = query.sortDirection || 'desc';

    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'relevance':
          // For relevance, maintain current order (already filtered by query match)
          comparison = 0;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    results = results.slice(offset, offset + limit);

    // Convert to summaries
    return results.map(n => ({
      id: n.id,
      title: n.title,
      excerpt: n.content.substring(0, 150) + (n.content.length > 150 ? '...' : ''),
      source: n.source,
      tags: n.tags,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const id = this.generateNoteId();
    const now = new Date();

    const completeNote: Note = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.notes.set(id, completeNote);
    return completeNote;
  }

  async updateNote(id: NoteId, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> {
    const existing = this.notes.get(id);
    if (!existing) {
      throw new Error(`Note ${id} not found`);
    }

    const updated: Note = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: NoteId): Promise<boolean> {
    return this.notes.delete(id);
  }

  async syncSource(source: NoteSource): Promise<NoteSyncStatus> {
    // Simulate sync
    const status: NoteSyncStatus = {
      source,
      state: 'syncing',
      lastSyncedAt: new Date(),
    };

    this.syncStatuses.set(source, status);

    // Simulate completion
    setTimeout(() => {
      const completedStatus: NoteSyncStatus = {
        source,
        state: 'idle',
        lastSyncedAt: new Date(),
        notesSynced: 0, // In real implementation, this would be actual count
      };
      this.syncStatuses.set(source, completedStatus);
    }, 100);

    return status;
  }

  async getSyncStatuses(): Promise<NoteSyncStatus[]> {
    return Array.from(this.syncStatuses.values());
  }

  async getStatistics(): Promise<NotesStatistics> {
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let archivedCount = 0;
    let pinnedCount = 0;

    for (const note of this.notes.values()) {
      bySource[note.source] = (bySource[note.source] || 0) + 1;

      if (note.categories) {
        for (const category of note.categories) {
          byCategory[category] = (byCategory[category] || 0) + 1;
        }
      }

      for (const tag of note.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }

      if (note.archived) archivedCount++;
      if (note.pinned) pinnedCount++;
    }

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalNotes: this.notes.size,
      bySource: bySource as any,
      byCategory,
      popularTags,
      archivedCount,
      pinnedCount,
    };
  }

  async tagNote(noteId: NoteId, tags: string[]): Promise<Note> {
    const note = this.notes.get(noteId);
    if (!note) {
      throw new Error(`Note ${noteId} not found`);
    }

    const uniqueTags = Array.from(new Set([...note.tags, ...tags]));
    return this.updateNote(noteId, { tags: uniqueTags });
  }

  async categorizeNotes(noteIds: NoteId[]): Promise<Map<NoteId, string[]>> {
    const results = new Map<NoteId, string[]>();

    // Simple categorization based on content keywords
    for (const noteId of noteIds) {
      const note = this.notes.get(noteId);
      if (!note) continue;

      const categories: string[] = [];
      const contentLower = (note.title + ' ' + note.content).toLowerCase();

      // Simple keyword-based categorization
      if (contentLower.includes('meeting') || contentLower.includes('agenda')) {
        categories.push('meetings');
      }
      if (contentLower.includes('todo') || contentLower.includes('task')) {
        categories.push('tasks');
      }
      if (contentLower.includes('idea') || contentLower.includes('brainstorm')) {
        categories.push('ideas');
      }
      if (contentLower.includes('project') || contentLower.includes('plan')) {
        categories.push('projects');
      }
      if (contentLower.includes('personal') || contentLower.includes('private')) {
        categories.push('personal');
      }

      if (categories.length === 0) {
        categories.push('general');
      }

      results.set(noteId, categories);

      // Update note with categories
      await this.updateNote(noteId, { categories });
    }

    return results;
  }
}
