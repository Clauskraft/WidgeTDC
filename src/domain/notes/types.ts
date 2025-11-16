/**
 * Notes Aggregator Domain Types
 * 
 * Enterprise notes aggregation supporting multiple sources (OneNote, Google Keep,
 * Apple Notes, Evernote, local files) with AI-powered categorization and search.
 */

/**
 * Note source identifier
 */
export type NoteSource = 
  | 'onenote'
  | 'google-keep'
  | 'apple-notes'
  | 'evernote'
  | 'local'
  | 'email';

/**
 * Note content format
 */
export type NoteFormat = 'text' | 'markdown' | 'html' | 'pdf';

/**
 * Note identifier
 */
export type NoteId = string;

/**
 * Tag identifier
 */
export type TagId = string;

/**
 * Note metadata
 */
export interface Note {
  /** Unique note identifier */
  id: NoteId;
  
  /** Note title */
  title: string;
  
  /** Note content */
  content: string;
  
  /** Content format */
  format: NoteFormat;
  
  /** Source of the note */
  source: NoteSource;
  
  /** Source-specific ID */
  sourceId: string;
  
  /** Tags */
  tags: string[];
  
  /** AI-generated categories */
  categories?: string[];
  
  /** Author information */
  author?: {
    id: string;
    name: string;
    email?: string;
  };
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Last sync timestamp */
  lastSyncedAt?: Date;
  
  /** Whether note is archived */
  archived: boolean;
  
  /** Whether note is pinned */
  pinned: boolean;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Note summary for lists
 */
export interface NoteSummary {
  id: NoteId;
  title: string;
  excerpt: string;
  source: NoteSource;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note search query
 */
export interface NoteQuery {
  /** Text search query */
  query?: string;
  
  /** Filter by source */
  source?: NoteSource | NoteSource[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by categories */
  categories?: string[];
  
  /** Filter by archived status */
  archived?: boolean;
  
  /** Filter by pinned status */
  pinned?: boolean;
  
  /** Date range filter */
  dateRange?: {
    from: Date;
    to: Date;
  };
  
  /** Sort by field */
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'relevance';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Maximum results */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Note sync status
 */
export interface NoteSyncStatus {
  /** Source being synced */
  source: NoteSource;
  
  /** Sync state */
  state: 'idle' | 'syncing' | 'error';
  
  /** Last sync timestamp */
  lastSyncedAt?: Date;
  
  /** Error message if state is error */
  error?: string;
  
  /** Number of notes synced */
  notesSynced?: number;
}

/**
 * Notes aggregation statistics
 */
export interface NotesStatistics {
  /** Total notes */
  totalNotes: number;
  
  /** Notes by source */
  bySource: Record<NoteSource, number>;
  
  /** Notes by category */
  byCategory: Record<string, number>;
  
  /** Popular tags */
  popularTags: Array<{ tag: string; count: number }>;
  
  /** Archived notes count */
  archivedCount: number;
  
  /** Pinned notes count */
  pinnedCount: number;
}

/**
 * Notes Aggregator Service interface
 * 
 * Manages notes from multiple sources with AI-powered categorization,
 * search, and synchronization.
 */
export interface NotesAggregatorService {
  /**
   * Get a note by ID
   * @param id Note ID
   * @returns Note or undefined if not found
   */
  getNote(id: NoteId): Promise<Note | undefined>;
  
  /**
   * Search notes
   * @param query Search query
   * @returns Array of matching note summaries
   */
  searchNotes(query: NoteQuery): Promise<NoteSummary[]>;
  
  /**
   * Create a new note
   * @param note Note to create (without ID and timestamps)
   * @returns Created note
   */
  createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>;
  
  /**
   * Update an existing note
   * @param id Note ID
   * @param updates Partial note updates
   * @returns Updated note
   */
  updateNote(id: NoteId, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note>;
  
  /**
   * Delete a note
   * @param id Note ID
   * @returns Whether deletion was successful
   */
  deleteNote(id: NoteId): Promise<boolean>;
  
  /**
   * Sync notes from a source
   * @param source Source to sync
   * @returns Sync status
   */
  syncSource(source: NoteSource): Promise<NoteSyncStatus>;
  
  /**
   * Get sync status for all sources
   * @returns Array of sync statuses
   */
  getSyncStatuses(): Promise<NoteSyncStatus[]>;
  
  /**
   * Get statistics
   * @returns Notes statistics
   */
  getStatistics(): Promise<NotesStatistics>;
  
  /**
   * Tag a note
   * @param noteId Note ID
   * @param tags Tags to add
   * @returns Updated note
   */
  tagNote(noteId: NoteId, tags: string[]): Promise<Note>;
  
  /**
   * Categorize notes using AI
   * @param noteIds Note IDs to categorize
   * @returns Map of note IDs to categories
   */
  categorizeNotes(noteIds: NoteId[]): Promise<Map<NoteId, string[]>>;
}
