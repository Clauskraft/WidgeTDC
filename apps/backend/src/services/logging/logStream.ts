import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  meta?: Record<string, unknown>;
}

interface FilterOptions {
  limit?: number;
  level?: LogLevel;
  source?: string;
}

class LogStream extends EventEmitter {
  private buffer: LogEntry[] = [];
  private readonly maxEntries = 500;

  push(entry: Omit<LogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
    const normalized: LogEntry = {
      id: entry.id || randomUUID(),
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      source: entry.source || 'backend',
      message: entry.message,
      meta: entry.meta,
    };

    this.buffer.unshift(normalized);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.pop();
    }

    this.emit('log', normalized);
  }

  getRecent(options: FilterOptions = {}): LogEntry[] {
    const { limit = 100, level, source } = options;
    const normalizedLimit = Math.min(Math.max(limit, 1), this.maxEntries);

    return this.buffer
      .filter((entry) => {
        if (level && entry.level !== level) return false;
        if (source && entry.source !== source) return false;
        return true;
      })
      .slice(0, normalizedLimit);
  }

  getSources(): string[] {
    const sources = new Set<string>();
    this.buffer.forEach((entry) => sources.add(entry.source));
    return Array.from(sources);
  }
}

export const logStream = new LogStream();
export type LogStreamListener = (entry: LogEntry) => void;
