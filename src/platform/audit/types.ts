/**
 * Audit Log Types
 * 
 * Enterprise-grade audit logging with hash-chain integrity verification,
 * retention policies, and GDPR/ISO 27001/SOC 2 compliance support.
 * 
 * Design principles:
 * - Append-only: Events cannot be modified or deleted
 * - Hash-chain: Each event includes hash of previous event for integrity
 * - Privacy-aware: Use IDs and metadata, not raw sensitive content
 * - Retention-aware: Support for automatic expiration and archival
 */

/**
 * Unique identifier for audit events (sequential)
 */
export type AuditEventId = string;

/**
 * Audit domain categorizes the functional area
 */
export type AuditDomain =
  | 'authentication'
  | 'authorization'
  | 'widget-lifecycle'
  | 'data-access'
  | 'configuration'
  | 'collaboration'
  | 'export'
  | 'system'
  | 'user-action';

/**
 * Sensitivity level for audit events (GDPR-aware)
 */
export type AuditSensitivity =
  | 'public'      // No sensitive data
  | 'internal'    // Internal use only
  | 'confidential' // Contains business-sensitive data
  | 'restricted'  // Contains PII or highly sensitive data
  | 'pii';        // Contains personally identifiable information

/**
 * Retention policy for audit events
 */
export interface AuditRetention {
  /** Retention period in days */
  retentionDays: number;
  
  /** Whether to archive before deletion */
  archiveBeforeDelete: boolean;
  
  /** Archive location (if applicable) */
  archiveLocation?: string;
  
  /** Whether retention is legally mandated */
  legalHold: boolean;
}

/**
 * Actor performing the audited action
 */
export interface AuditActor {
  /** Actor type */
  type: 'user' | 'system' | 'service' | 'anonymous';
  
  /** Actor ID (user ID, service ID, etc.) */
  id: string;
  
  /** Actor name (for display) */
  name?: string;
  
  /** IP address or source identifier */
  source?: string;
  
  /** Session ID */
  sessionId?: string;
}

/**
 * Audit event payload (privacy-aware)
 */
export interface AuditEventPayload {
  /** Action performed */
  action: string;
  
  /** Resource type */
  resourceType?: string;
  
  /** Resource ID (not raw content) */
  resourceId?: string;
  
  /** Action outcome */
  outcome: 'success' | 'failure' | 'partial';
  
  /** Additional metadata (no PII) */
  metadata?: Record<string, unknown>;
  
  /** Error details (if outcome is failure) */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Audit event with hash-chain integrity
 */
export interface AuditEvent {
  /** Unique event identifier (sequential) */
  id: AuditEventId;
  
  /** Timestamp (ISO 8601) */
  timestamp: Date;
  
  /** Audit domain */
  domain: AuditDomain;
  
  /** Sensitivity level */
  sensitivity: AuditSensitivity;
  
  /** Actor who performed the action */
  actor: AuditActor;
  
  /** Event payload */
  payload: AuditEventPayload;
  
  /** SHA-256 hash of previous event (for integrity chain) */
  previousHash: string;
  
  /** SHA-256 hash of this event */
  hash: string;
  
  /** Retention policy */
  retention: AuditRetention;
  
  /** Additional tags for filtering */
  tags?: string[];
}

/**
 * Query parameters for audit log search
 */
export interface AuditQuery {
  /** Filter by domain */
  domain?: AuditDomain | AuditDomain[];
  
  /** Filter by sensitivity */
  sensitivity?: AuditSensitivity | AuditSensitivity[];
  
  /** Filter by actor ID */
  actorId?: string;
  
  /** Filter by actor type */
  actorType?: AuditActor['type'];
  
  /** Filter by action */
  action?: string;
  
  /** Filter by resource type */
  resourceType?: string;
  
  /** Filter by resource ID */
  resourceId?: string;
  
  /** Filter by outcome */
  outcome?: AuditEventPayload['outcome'];
  
  /** Filter by time range */
  timeRange?: {
    from: Date;
    to: Date;
  };
  
  /** Filter by tags */
  tags?: string[];
  
  /** Maximum results to return */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Audit log statistics
 */
export interface AuditStatistics {
  /** Total events */
  totalEvents: number;
  
  /** Events by domain */
  byDomain: Record<AuditDomain, number>;
  
  /** Events by sensitivity */
  bySensitivity: Record<AuditSensitivity, number>;
  
  /** Events by outcome */
  byOutcome: Record<AuditEventPayload['outcome'], number>;
  
  /** First event timestamp */
  firstEventAt?: Date;
  
  /** Last event timestamp */
  lastEventAt?: Date;
}

/**
 * Integrity verification result
 */
export interface IntegrityVerificationResult {
  /** Whether integrity is valid */
  valid: boolean;
  
  /** Number of events verified */
  eventsVerified: number;
  
  /** Broken chain positions (if any) */
  brokenChainAt?: number[];
  
  /** Verification timestamp */
  verifiedAt: Date;
  
  /** Error details */
  errors?: string[];
}

/**
 * Audit Log Service interface
 * 
 * Manages append-only audit logging with hash-chain integrity verification
 * and retention-aware policies.
 */
export interface AuditLogService {
  /**
   * Append an audit event to the log
   * @param event Event to append (without id, hash, previousHash)
   * @returns The created audit event with hash-chain fields
   */
  append(event: Omit<AuditEvent, 'id' | 'hash' | 'previousHash'>): Promise<AuditEvent>;
  
  /**
   * Query audit events
   * @param query Query parameters
   * @returns Array of matching events
   */
  query(query: AuditQuery): Promise<AuditEvent[]>;
  
  /**
   * Get an audit event by ID
   * @param id Event ID
   * @returns Event or undefined if not found
   */
  getById(id: AuditEventId): Promise<AuditEvent | undefined>;
  
  /**
   * Verify the integrity of the audit log hash-chain
   * @param options Verification options
   * @returns Verification result
   */
  verifyIntegrity(options?: { from?: AuditEventId; to?: AuditEventId }): Promise<IntegrityVerificationResult>;
  
  /**
   * Get audit log statistics
   * @returns Statistics summary
   */
  getStatistics(): Promise<AuditStatistics>;
  
  /**
   * Archive events based on retention policy
   * @param dryRun If true, return events that would be archived without actually archiving
   * @returns Number of events archived
   */
  archiveExpiredEvents(dryRun?: boolean): Promise<number>;
  
  /**
   * Export audit events to external storage
   * @param query Query to filter events for export
   * @param format Export format
   * @returns Serialized events
   */
  exportEvents(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}

/**
 * Default retention policies by sensitivity
 */
export const DEFAULT_RETENTION_POLICIES: Record<AuditSensitivity, AuditRetention> = {
  public: {
    retentionDays: 90,
    archiveBeforeDelete: false,
    legalHold: false,
  },
  internal: {
    retentionDays: 365,
    archiveBeforeDelete: true,
    legalHold: false,
  },
  confidential: {
    retentionDays: 730, // 2 years
    archiveBeforeDelete: true,
    legalHold: false,
  },
  restricted: {
    retentionDays: 2555, // 7 years (common legal requirement)
    archiveBeforeDelete: true,
    legalHold: true,
  },
  pii: {
    retentionDays: 365, // GDPR: only as long as necessary
    archiveBeforeDelete: true,
    legalHold: false,
  },
};
