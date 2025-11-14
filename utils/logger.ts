/**
 * Enterprise Logging System
 * Structured logging with levels, context, and sensitive data redaction
 */

import { getLogLevel, isProduction } from './env-validation';
import { redactSensitiveData } from './security';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Log level names
 */
const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
};

/**
 * Convert string to log level
 */
function stringToLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Log transport interface
 */
export interface LogTransport {
  log(entry: LogEntry): void;
}

/**
 * Console transport
 */
class ConsoleTransport implements LogTransport {
  public log(entry: LogEntry): void {
    const levelName = entry.level;
    const timestamp = entry.timestamp;
    const message = entry.message;

    const prefix = `[${timestamp}] [${levelName}]`;

    switch (entry.level) {
      case 'ERROR':
        console.error(prefix, message, entry.context || '', entry.error || '');
        break;
      case 'WARN':
        console.warn(prefix, message, entry.context || '');
        break;
      case 'INFO':
        console.info(prefix, message, entry.context || '');
        break;
      case 'DEBUG':
        console.debug(prefix, message, entry.context || '');
        break;
    }
  }
}

/**
 * Storage transport (saves to localStorage for debugging)
 */
class StorageTransport implements LogTransport {
  private maxEntries: number = 100;
  private storageKey: string = 'app_logs';

  public log(entry: LogEntry): void {
    try {
      const logs = this.getLogs();
      logs.push(entry);

      // Keep only recent logs
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch {
      // Storage might be full or unavailable
    }
  }

  public getLogs(): LogEntry[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public clearLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Logger class
 */
class Logger {
  private level: LogLevel;
  private transports: LogTransport[] = [];
  private context: Record<string, any> = {};

  constructor() {
    this.level = stringToLogLevel(getLogLevel());

    // Add default transports
    this.transports.push(new ConsoleTransport());

    // In development, also save to storage
    if (!isProduction()) {
      this.transports.push(new StorageTransport());
    }
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Add transport
   */
  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Set global context
   */
  public setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create child logger with additional context
   */
  public child(context: Record<string, any>): Logger {
    const child = new Logger();
    child.level = this.level;
    child.transports = this.transports;
    child.context = { ...this.context, ...context };
    return child;
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level > this.level) {
      return;
    }

    // Merge contexts and redact sensitive data
    const mergedContext = redactSensitiveData({
      ...this.context,
      ...context,
    });

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevelNames[level],
      message,
      context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: isProduction() ? undefined : error.stack,
      };
    }

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (err) {
        console.error('Error in log transport:', err);
      }
    });
  }

  /**
   * Log error
   */
  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log warning
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log info
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log debug
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Create performance logger
   */
  public startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create logger with context
 */
export function createLogger(context: Record<string, any>): Logger {
  return logger.child(context);
}
