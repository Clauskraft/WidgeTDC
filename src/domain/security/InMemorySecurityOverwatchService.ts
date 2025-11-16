/**
 * In-Memory Security Overwatch Service
 * 
 * Development implementation of SecurityOverwatchService
 */

import type {
  SecurityOverwatchService,
  SecurityAlert,
  AlertId,
  AlertQuery,
  Vulnerability,
  ThreatIntelligence,
  ComplianceFramework,
  ComplianceStatus,
  SecurityMetrics,
  AlertStatus,
  AlertSeverity,
} from './types';

export class InMemorySecurityOverwatchService implements SecurityOverwatchService {
  private alerts: Map<AlertId, SecurityAlert> = new Map();
  private vulnerabilities: Vulnerability[] = [];
  private threatIntel: ThreatIntelligence[] = [];
  private alertCounter = 0;

  private generateAlertId(): AlertId {
    return `SEC${String(++this.alertCounter).padStart(8, '0')}`;
  }

  async getAlert(id: AlertId): Promise<SecurityAlert | undefined> {
    return this.alerts.get(id);
  }

  async queryAlerts(query: AlertQuery): Promise<SecurityAlert[]> {
    let results = Array.from(this.alerts.values());

    // Filter by severity
    if (query.severity) {
      const severities = Array.isArray(query.severity) ? query.severity : [query.severity];
      results = results.filter(a => severities.includes(a.severity));
    }

    // Filter by status
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      results = results.filter(a => statuses.includes(a.status));
    }

    // Filter by category
    if (query.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      results = results.filter(a => categories.includes(a.category));
    }

    // Filter by date range
    if (query.dateRange) {
      const { from, to } = query.dateRange;
      results = results.filter(a => {
        const timestamp = a.detectedAt.getTime();
        return timestamp >= from.getTime() && timestamp <= to.getTime();
      });
    }

    // Filter by assigned user
    if (query.assignedTo) {
      results = results.filter(a => a.assignedTo?.id === query.assignedTo);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(a => 
        a.tags && query.tags!.some(tag => a.tags!.includes(tag))
      );
    }

    // Sort
    const sortBy = query.sortBy || 'detectedAt';
    const sortDirection = query.sortDirection || 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'detectedAt':
          comparison = a.detectedAt.getTime() - b.detectedAt.getTime();
          break;
        case 'riskScore':
          comparison = a.riskScore - b.riskScore;
          break;
        case 'severity':
          const severityOrder: Record<AlertSeverity, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
            info: 0,
          };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async createAlert(alert: Omit<SecurityAlert, 'id' | 'detectedAt'>): Promise<SecurityAlert> {
    const id = this.generateAlertId();
    const completeAlert: SecurityAlert = {
      ...alert,
      id,
      detectedAt: new Date(),
    };

    this.alerts.set(id, completeAlert);
    return completeAlert;
  }

  async updateAlert(id: AlertId, updates: Partial<Omit<SecurityAlert, 'id' | 'detectedAt'>>): Promise<SecurityAlert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert ${id} not found`);
    }

    const updated: SecurityAlert = {
      ...existing,
      ...updates,
      id: existing.id,
      detectedAt: existing.detectedAt,
    };

    this.alerts.set(id, updated);
    return updated;
  }

  async resolveAlert(id: AlertId, resolution: { status: AlertStatus; notes?: string }): Promise<SecurityAlert> {
    const updates: Partial<SecurityAlert> = {
      status: resolution.status,
      resolvedAt: new Date(),
    };

    if (resolution.notes) {
      updates.metadata = {
        ...(await this.getAlert(id))?.metadata,
        resolutionNotes: resolution.notes,
      };
    }

    return this.updateAlert(id, updates);
  }

  async getVulnerabilities(filters?: { severity?: AlertSeverity; patchAvailable?: boolean }): Promise<Vulnerability[]> {
    let results = [...this.vulnerabilities];

    if (filters?.severity) {
      results = results.filter(v => v.severity === filters.severity);
    }

    if (filters?.patchAvailable !== undefined) {
      results = results.filter(v => v.patchAvailable === filters.patchAvailable);
    }

    return results;
  }

  async getThreatIntelligence(filters?: { type?: ThreatIntelligence['type']; minConfidence?: number }): Promise<ThreatIntelligence[]> {
    let results = [...this.threatIntel];

    if (filters?.type) {
      results = results.filter(t => t.type === filters.type);
    }

    if (filters?.minConfidence !== undefined) {
      results = results.filter(t => t.confidence >= filters.minConfidence);
    }

    return results;
  }

  async getComplianceStatus(framework: ComplianceFramework): Promise<ComplianceStatus> {
    // Mock compliance data
    const mockData: Record<ComplianceFramework, ComplianceStatus> = {
      GDPR: {
        framework: 'GDPR',
        compliancePercentage: 85,
        compliantControls: 34,
        totalControls: 40,
        lastAssessedAt: new Date(),
        nonCompliantItems: [
          {
            control: 'Article 32',
            description: 'Security of processing - encryption at rest not enabled for all databases',
            severity: 'high',
          },
        ],
      },
      ISO27001: {
        framework: 'ISO27001',
        compliancePercentage: 92,
        compliantControls: 110,
        totalControls: 120,
        lastAssessedAt: new Date(),
        nonCompliantItems: [],
      },
      SOC2: {
        framework: 'SOC2',
        compliancePercentage: 88,
        compliantControls: 45,
        totalControls: 51,
        lastAssessedAt: new Date(),
        nonCompliantItems: [],
      },
      NIST: {
        framework: 'NIST',
        compliancePercentage: 78,
        compliantControls: 156,
        totalControls: 200,
        lastAssessedAt: new Date(),
        nonCompliantItems: [],
      },
      HIPAA: {
        framework: 'HIPAA',
        compliancePercentage: 90,
        compliantControls: 45,
        totalControls: 50,
        lastAssessedAt: new Date(),
        nonCompliantItems: [],
      },
      'PCI-DSS': {
        framework: 'PCI-DSS',
        compliancePercentage: 82,
        compliantControls: 246,
        totalControls: 300,
        lastAssessedAt: new Date(),
        nonCompliantItems: [],
      },
    };

    return mockData[framework];
  }

  async getMetrics(): Promise<SecurityMetrics> {
    const alertsBySeverity: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const alertsByCategory: Record<string, number> = {};
    let totalResolveTime = 0;
    let resolvedCount = 0;

    for (const alert of this.alerts.values()) {
      if (alert.status === 'open' || alert.status === 'investigating') {
        alertsBySeverity[alert.severity]++;
      }

      alertsByCategory[alert.category] = (alertsByCategory[alert.category] || 0) + 1;

      if (alert.resolvedAt) {
        const resolveTime = alert.resolvedAt.getTime() - alert.detectedAt.getTime();
        totalResolveTime += resolveTime;
        resolvedCount++;
      }
    }

    const meanTimeToResolve = resolvedCount > 0 
      ? totalResolveTime / resolvedCount / (1000 * 60 * 60) // Convert to hours
      : 0;

    const criticalVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'critical').length;

    // Calculate security score (simple algorithm)
    const openCritical = alertsBySeverity.critical;
    const openHigh = alertsBySeverity.high;
    const securityScore = Math.max(0, 100 - (openCritical * 10 + openHigh * 5));

    return {
      alertsBySeverity,
      alertsByCategory: alertsByCategory as any,
      meanTimeToResolve,
      totalVulnerabilities: this.vulnerabilities.length,
      criticalVulnerabilities,
      activeThreats: this.threatIntel.length,
      securityScore,
    };
  }

  async runVulnerabilityScan(): Promise<number> {
    // Mock vulnerability scan - in production, this would integrate with scanners
    const mockVulnerabilities: Vulnerability[] = [
      {
        cve: 'CVE-2024-12345',
        title: 'Sample Vulnerability',
        description: 'This is a mock vulnerability for demonstration',
        severity: 'medium',
        cvssScore: 5.5,
        affectedComponent: {
          name: 'sample-library',
          version: '1.0.0',
        },
        fixedInVersion: '1.0.1',
        publishedAt: new Date(),
        patchAvailable: true,
        exploitAvailable: false,
        references: ['https://example.com/CVE-2024-12345'],
      },
    ];

    this.vulnerabilities.push(...mockVulnerabilities);
    return mockVulnerabilities.length;
  }

  async generateComplianceReport(framework: ComplianceFramework, format: 'json' | 'pdf'): Promise<string> {
    const status = await this.getComplianceStatus(framework);

    if (format === 'json') {
      return JSON.stringify(status, null, 2);
    } else {
      // For PDF, return a simple text representation
      return `Compliance Report: ${framework}\n` +
             `Compliance: ${status.compliancePercentage}%\n` +
             `Compliant Controls: ${status.compliantControls}/${status.totalControls}\n` +
             `Last Assessed: ${status.lastAssessedAt.toISOString()}\n`;
    }
  }
}
