import winston from 'winston';
import path from 'path';
import { Writable } from 'stream';
import { logStream } from '../services/logging/logStream.js';

const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'widgetdc-backend' },
    transports: [
        // File transport for errors
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

const streamTransport = new Writable({
    objectMode: true,
    write(info, _encoding, callback) {
        try {
            const source = (info.source || info.service || info.module || 'backend') as string;
            logStream.push({
                level: (info.level || 'info') as 'info' | 'warn' | 'error' | 'debug',
                source,
                message: info.message,
                meta: info,
                timestamp: info.timestamp,
            });
        } catch (err) {
            console.error('Log stream transport error:', err);
        }
        callback();
    }
});

logger.add(new winston.transports.Stream({ stream: streamTransport }));

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
} else {
    // In production, still log to console but with less verbosity
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
            level: 'warn', // Only warnings and errors
        })
    );
}

// Create convenience methods
export const log = {
    info: (message: string, meta?: any) => logger.info(message, meta),
    warn: (message: string, meta?: any) => logger.warn(message, meta),
    error: (message: string, meta?: any) => logger.error(message, meta),
    debug: (message: string, meta?: any) => logger.debug(message, meta),
};

export default logger;
