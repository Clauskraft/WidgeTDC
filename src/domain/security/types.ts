/**
 * Cybersecurity Overwatch Domain Types
 *
 * Enterprise cybersecurity monitoring with threat intelligence,
 * vulnerability scanning, and compliance reporting.
 */

/**
 * Security alert severity
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Security alert status
 */
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'false-positive' | 'ignored';

/**
 * Security alert category
 */
export type AlertCategory =
  | 'network-intrusion'
  | 'malware'
  | 'vulnerability'
  | 'data-breach'
  | 'unauthorized-access'
  | 'compliance-violation'
  | 'configuration-issue'
  | 'suspicious-activity';

/**
 * Security alert identifier
 */
export type AlertId = string;

/**
 * Security alert
 */
export interface SecurityAlert {
  /** Unique alert identifier */
  id: AlertId;

  /** Alert title */
  title: string;

  /** Alert description */
  description: string;

  /** Alert severity */
  severity: AlertSeverity;

  /** Alert category */
  category: AlertCategory;

  /** Alert status */
  status: AlertStatus;

  /** Affected resource */
  resource?: {
    type: string;
    id: string;
    name?: string;
  };

  /** Source of the alert */
  source: string;

  /** Detection timestamp */
  detectedAt: Date;

  /** Resolution timestamp */
  resolvedAt?: Date;

  /** Assigned to */
  assignedTo?: {
    id: string;
    name: string;
  };

  /** Risk score (0-100) */
  riskScore: number;

  /** Recommended actions */
  recommendedActions?: string[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Tags */
  tags?: string[];
}

/**
 * Vulnerability information
 */
export interface Vulnerability {
  /** CVE identifier */
  cve?: string;

  /** Vulnerability title */
  title: string;

  /** Description */
  description: string;

  /** Severity */
  severity: AlertSeverity;

  /** CVSS score */
  cvssScore?: number;

  /** Affected component */
  affectedComponent: {
    name: string;
    version: string;
  };

  /** Fixed in version */
  fixedInVersion?: string;

  /** Publication date */
  publishedAt: Date;

  /** Whether patch is available */
  patchAvailable: boolean;

  /** Exploit available */
  exploitAvailable: boolean;

  /** References */
  references?: string[];
}

/**
 * Threat intelligence feed item
 */
export interface ThreatIntelligence {
  /** Threat identifier */
  id: string;

  /** Threat type */
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email';

  /** Threat indicator */
  indicator: string;

  /** Threat description */
  description: string;

  /** Confidence level (0-100) */
  confidence: number;

  /** First seen timestamp */
  firstSeen: Date;

  /** Last seen timestamp */
  lastSeen: Date;

  /** Source feed */
  source: string;

  /** Tags */
  tags: string[];
}

/**
 * Compliance framework
 */
export type ComplianceFramework = 'GDPR' | 'ISO27001' | 'SOC2' | 'NIST' | 'HIPAA' | 'PCI-DSS';

/**
 * Compliance status
 */
export interface ComplianceStatus {
  /** Framework */
  framework: ComplianceFramework;

  /** Overall compliance percentage */
  compliancePercentage: number;

  /** Compliant controls */
  compliantControls: number;

  /** Total controls */
  totalControls: number;

  /** Last assessment date */
  lastAssessedAt: Date;

  /** Non-compliant items */
  nonCompliantItems: Array<{
    control: string;
    description: string;
    severity: AlertSeverity;
  }>;
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  /** Open alerts by severity */
  alertsBySeverity: Record<AlertSeverity, number>;

  /** Alerts by category */
  alertsByCategory: Record<AlertCategory, number>;

  /** Mean time to resolve (hours) */
  meanTimeToResolve: number;

  /** Total vulnerabilities */
  totalVulnerabilities: number;

  /** Critical vulnerabilities */
  criticalVulnerabilities: number;

  /** Active threats */
  activeThreats: number;

  /** Security score (0-100) */
  securityScore: number;
}

/**
 * Alert query
 */
export interface AlertQuery {
  /** Filter by severity */
  severity?: AlertSeverity | AlertSeverity[];

  /** Filter by status */
  status?: AlertStatus | AlertStatus[];

  /** Filter by category */
  category?: AlertCategory | AlertCategory[];

  /** Filter by date range */
  dateRange?: {
    from: Date;
    to: Date;
  };

  /** Filter by assigned user */
  assignedTo?: string;

  /** Filter by tags */
  tags?: string[];

  /** Sort by */
  sortBy?: 'detectedAt' | 'severity' | 'riskScore';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Maximum results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Cybersecurity Overwatch Service interface
 *
 * Manages security monitoring, threat intelligence, vulnerability management,
 * and compliance reporting.
 */
export interface SecurityOverwatchService {
  /**
   * Get an alert by ID
   * @param id Alert ID
   * @returns Alert or undefined if not found
   */
  getAlert(id: AlertId): Promise<SecurityAlert | undefined>;

  /**
   * Query alerts
   * @param query Alert query
   * @returns Array of matching alerts
   */
  queryAlerts(query: AlertQuery): Promise<SecurityAlert[]>;

  /**
   * Create a new alert
   * @param alert Alert to create (without ID and timestamps)
   * @returns Created alert
   */
  createAlert(alert: Omit<SecurityAlert, 'id' | 'detectedAt'>): Promise<SecurityAlert>;

  /**
   * Update an alert
   * @param id Alert ID
   * @param updates Partial alert updates
   * @returns Updated alert
   */
  updateAlert(
    id: AlertId,
    updates: Partial<Omit<SecurityAlert, 'id' | 'detectedAt'>>
  ): Promise<SecurityAlert>;

  /**
   * Resolve an alert
   * @param id Alert ID
   * @param resolution Resolution details
   * @returns Updated alert
   */
  resolveAlert(
    id: AlertId,
    resolution: { status: AlertStatus; notes?: string }
  ): Promise<SecurityAlert>;

  /**
   * Get vulnerabilities
   * @param filters Optional filters
   * @returns Array of vulnerabilities
   */
  getVulnerabilities(filters?: {
    severity?: AlertSeverity;
    patchAvailable?: boolean;
  }): Promise<Vulnerability[]>;

  /**
   * Get threat intelligence
   * @param filters Optional filters
   * @returns Array of threat intelligence items
   */
  getThreatIntelligence(filters?: {
    type?: ThreatIntelligence['type'];
    minConfidence?: number;
  }): Promise<ThreatIntelligence[]>;

  /**
   * Get compliance status for a framework
   * @param framework Compliance framework
   * @returns Compliance status
   */
  getComplianceStatus(framework: ComplianceFramework): Promise<ComplianceStatus>;

  /**
   * Get security metrics
   * @returns Security metrics summary
   */
  getMetrics(): Promise<SecurityMetrics>;

  /**
   * Run vulnerability scan
   * @returns Number of vulnerabilities found
   */
  runVulnerabilityScan(): Promise<number>;

  /**
   * Generate compliance report
   * @param framework Compliance framework
   * @param format Report format
   * @returns Serialized report
   */
  generateComplianceReport(framework: ComplianceFramework, format: 'json' | 'pdf'): Promise<string>;
}
