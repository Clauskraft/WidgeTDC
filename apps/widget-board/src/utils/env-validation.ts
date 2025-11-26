/**
 * Environment Variable Validation Module
 * Validates and provides type-safe access to environment variables
 */

interface EnvConfig {
  // API Configuration
  GEMINI_API_KEY: string;

  // MCP Configuration
  MCP_SERVER_URL: string;
  MCP_AUTH_ENABLED: boolean;
  MCP_CLIENT_ID?: string;
  MCP_CLIENT_SECRET?: string;

  // Microsoft Configuration
  MS_CLIENT_ID?: string;
  MS_TENANT_ID?: string;
  MS_REDIRECT_URI?: string;
  MS_SCOPES?: string;

  // Security Configuration
  ENABLE_CSP: boolean;
  ENABLE_HSTS: boolean;
  JWT_SECRET?: string;
  JWT_EXPIRY: number;

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;

  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_DEBUG_MODE: boolean;

  // Performance & Monitoring
  ENABLE_PERFORMANCE_MONITORING: boolean;
  PERFORMANCE_SAMPLE_RATE: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Data & Compliance
  DATA_RETENTION_DAYS: number;
  GDPR_ENABLED: boolean;
  ENABLE_DATA_ENCRYPTION: boolean;

  // Development
  NODE_ENV: 'development' | 'staging' | 'production';
  API_BASE_URL: string;
  USE_MOCK_DATA: boolean;
}

/**
 * Get environment variable with VITE_ prefix
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  // In Vite, environment variables are accessed via import.meta.env
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  return (import.meta.env[viteKey] as string) ?? defaultValue;
}

/**
 * Parse boolean environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse number environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse float environment variable
 */
function parseFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validation errors collector
 */
class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Environment validation failed:\n${errors.join('\n')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Validate required environment variables
 */
function validateRequired(errors: string[]): void {
  const requiredVars = ['GEMINI_API_KEY'];

  for (const varName of requiredVars) {
    const value = getEnv(varName);
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
}

/**
 * Validate security configuration
 */
function validateSecurity(config: Partial<EnvConfig>, errors: string[]): void {
  if (config.NODE_ENV === 'production') {
    // JWT secret required in production
    if (config.MCP_AUTH_ENABLED && !config.JWT_SECRET) {
      errors.push('JWT_SECRET is required when MCP_AUTH_ENABLED is true in production');
    }

    if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }

    // CSP should be enabled in production
    if (!config.ENABLE_CSP) {
      console.warn('Content Security Policy is disabled in production');
    }

    // Debug mode should be disabled in production
    if (config.ENABLE_DEBUG_MODE) {
      errors.push('ENABLE_DEBUG_MODE must be false in production');
    }
  }
}

/**
 * Validate MCP configuration
 */
function validateMCP(config: Partial<EnvConfig>, errors: string[]): void {
  if (config.MCP_AUTH_ENABLED) {
    if (!config.MCP_CLIENT_ID) {
      errors.push('MCP_CLIENT_ID is required when MCP_AUTH_ENABLED is true');
    }
    if (!config.MCP_CLIENT_SECRET && config.NODE_ENV !== 'development') {
      errors.push('MCP_CLIENT_SECRET is required when MCP_AUTH_ENABLED is true');
    }
  }

  // Validate MCP URL format
  if (config.MCP_SERVER_URL) {
    try {
      const url = new URL(config.MCP_SERVER_URL);
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        errors.push('MCP_SERVER_URL must use ws:// or wss:// protocol');
      }
      if (config.NODE_ENV === 'production' && url.protocol === 'ws:') {
        errors.push('MCP_SERVER_URL must use wss:// (secure WebSocket) in production');
      }
    } catch {
      errors.push('MCP_SERVER_URL is not a valid URL');
    }
  }
}

/**
 * Validate Microsoft configuration
 */
function validateMicrosoft(config: Partial<EnvConfig>, errors: string[]): void {
  const hasAnyMSConfig = config.MS_CLIENT_ID || config.MS_TENANT_ID || config.MS_REDIRECT_URI;

  if (hasAnyMSConfig) {
    if (!config.MS_CLIENT_ID) {
      errors.push('MS_CLIENT_ID is required for Microsoft integration');
    }
    if (!config.MS_TENANT_ID) {
      errors.push('MS_TENANT_ID is required for Microsoft integration');
    }
    if (!config.MS_REDIRECT_URI) {
      errors.push('MS_REDIRECT_URI is required for Microsoft integration');
    }
  }
}

/**
 * Validate performance configuration
 */
function validatePerformance(config: Partial<EnvConfig>, errors: string[]): void {
  if (config.PERFORMANCE_SAMPLE_RATE !== undefined) {
    if (config.PERFORMANCE_SAMPLE_RATE < 0 || config.PERFORMANCE_SAMPLE_RATE > 1) {
      errors.push('PERFORMANCE_SAMPLE_RATE must be between 0 and 1');
    }
  }

  if (config.RATE_LIMIT_MAX_REQUESTS !== undefined && config.RATE_LIMIT_MAX_REQUESTS < 1) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  if (config.RATE_LIMIT_WINDOW_MS < 1000) {
    errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
  }
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const errors: string[] = [];

  // Build configuration object
  const config: EnvConfig = {
    // API Configuration
    GEMINI_API_KEY: getEnv('GEMINI_API_KEY') || '',

    // MCP Configuration
    MCP_SERVER_URL: getEnv('MCP_SERVER_URL', 'wss://localhost:3001/mcp'),
    MCP_AUTH_ENABLED: parseBoolean(getEnv('MCP_AUTH_ENABLED'), true),
    MCP_CLIENT_ID: getEnv('MCP_CLIENT_ID'),
    MCP_CLIENT_SECRET: getEnv('MCP_CLIENT_SECRET'),

    // Microsoft Configuration
    MS_CLIENT_ID: getEnv('MS_CLIENT_ID'),
    MS_TENANT_ID: getEnv('MS_TENANT_ID'),
    MS_REDIRECT_URI: getEnv('MS_REDIRECT_URI'),
    MS_SCOPES: getEnv('MS_SCOPES', 'Mail.Read,Mail.ReadWrite,Mail.Send'),

    // Security Configuration
    ENABLE_CSP: parseBoolean(getEnv('ENABLE_CSP'), true),
    ENABLE_HSTS: parseBoolean(getEnv('ENABLE_HSTS'), true),
    JWT_SECRET: getEnv('JWT_SECRET'),
    JWT_EXPIRY: parseNumber(getEnv('JWT_EXPIRY'), 3600),

    // Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: parseNumber(getEnv('RATE_LIMIT_MAX_REQUESTS'), 100),
    RATE_LIMIT_WINDOW_MS: parseNumber(getEnv('RATE_LIMIT_WINDOW_MS'), 60000),

    // Feature Flags
    ENABLE_ANALYTICS: parseBoolean(getEnv('ENABLE_ANALYTICS'), false),
    ENABLE_ERROR_REPORTING: parseBoolean(getEnv('ENABLE_ERROR_REPORTING'), false),
    ENABLE_DEBUG_MODE: parseBoolean(getEnv('ENABLE_DEBUG_MODE'), false),

    // Performance & Monitoring
    ENABLE_PERFORMANCE_MONITORING: parseBoolean(getEnv('ENABLE_PERFORMANCE_MONITORING'), true),
    PERFORMANCE_SAMPLE_RATE: parseFloat(getEnv('PERFORMANCE_SAMPLE_RATE'), 0.1),
    LOG_LEVEL: (getEnv('LOG_LEVEL') as any) || 'info',

    // Data & Compliance
    DATA_RETENTION_DAYS: parseNumber(getEnv('DATA_RETENTION_DAYS'), 90),
    GDPR_ENABLED: parseBoolean(getEnv('GDPR_ENABLED'), true),
    ENABLE_DATA_ENCRYPTION: parseBoolean(getEnv('ENABLE_DATA_ENCRYPTION'), true),

    // Development
    NODE_ENV: (import.meta.env.MODE as any) || 'development',
    API_BASE_URL: getEnv('API_BASE_URL', 'http://localhost:3001/api'),
    USE_MOCK_DATA: parseBoolean(getEnv('USE_MOCK_DATA'), false),
  };

  // Run validations
  validateRequired(errors);
  validateSecurity(config, errors);
  validateMCP(config, errors);
  validateMicrosoft(config, errors);
  validatePerformance(config, errors);

  // Throw if there are validation errors
  if (errors.length > 0) {
    if (config.NODE_ENV === 'production') {
      throw new ValidationError(errors);
    } else {
      // In development, just warn
      console.warn('Environment validation warnings:');
      errors.forEach(error => console.warn(`   - ${error}`));
    }
  }

  return config;
}

/**
 * Cached configuration instance
 */
let cachedConfig: EnvConfig | null = null;

/**
 * Get validated environment configuration (cached)
 */
export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = loadEnvConfig();
  }
  return cachedConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === 'development';
}

/**
 * Get log level
 */
export function getLogLevel(): 'error' | 'warn' | 'info' | 'debug' {
  return getEnvConfig().LOG_LEVEL;
}
