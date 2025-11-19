/**
 * Platform Logging Service
 * 
 * Simple logging abstraction that can be configured for different environments.
 * In production, this can be wired to external logging services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface Logger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
}

/**
 * Logger implementation that can be configured for different backends
 */
class PlatformLogger implements Logger {
  constructor(
    private context?: string,
    private minLevel: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: this.context,
      metadata,
    };

    // In development, use console
    // In production, this would send to a logging service
    const consoleMethod = level === 'debug' ? 'log' : level;
    const prefix = this.context ? `[${this.context}]` : '';
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    
    console[consoleMethod](`${prefix} ${message}${metadataStr}`);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }
}

/**
 * Create a logger for a specific context
 */
export function createLogger(context: string, minLevel: LogLevel = 'info'): Logger {
  return new PlatformLogger(context, minLevel);
}

/**
 * Default platform logger
 */
export const defaultLogger = createLogger('Platform');
