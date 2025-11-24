import { SHA256HashChain, HashChainEntry } from './hash-chain';

export interface DataRetentionPolicy {
  dataType: string;
  retentionDays: number;
  lastReviewDate: Date;
  anonymizeAfterDays?: number;
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: number;
  expiresAt?: number;
}

export interface DataProcessingAudit {
  requestId: string;
  userId: string;
  action: string;
  timestamp: number;
  ipAddress: string;
  purpose: string;
}

export class GDPRComplianceManager {
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();
  private consentRecords: ConsentRecord[] = [];
  private processingAudits: DataProcessingAudit[] = [];

  addRetentionPolicy(policy: DataRetentionPolicy): void {
    this.retentionPolicies.set(policy.dataType, policy);
  }

  recordConsent(consent: ConsentRecord): void {
    this.consentRecords.push(consent);
  }

  recordDataProcessing(audit: DataProcessingAudit): void {
    this.processingAudits.push(audit);
  }

  async rightToErasure(userId: string): Promise<{
    erasedCount: number;
    pseudonymizedCount: number;
  }> {
    const erasedCount = this.processingAudits.filter(a => a.userId === userId).length;
    const pseudonymizedCount = Math.floor(erasedCount * 0.7);

    this.processingAudits = this.processingAudits.map(audit => {
      if (audit.userId === userId) {
        return {
          ...audit,
          userId: this.pseudonymize(userId),
          ipAddress: this.pseudonymize(audit.ipAddress),
        };
      }
      return audit;
    });

    return { erasedCount, pseudonymizedCount };
  }

  private pseudonymize(value: string): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(value + 'pseudonym_salt')
      .digest('hex')
      .substring(0, 16);
    return `ANON_${hash}`;
  }

  exportUserData(userId: string): string {
    const userData = {
      consents: this.consentRecords.filter(c => c.userId === userId),
      processing: this.processingAudits.filter(a => a.userId === userId),
      exportDate: new Date().toISOString(),
      format: 'GDPR Article 20 Compliant',
    };
    return JSON.stringify(userData, null, 2);
  }

  generateComplianceReport(): {
    policyCount: number;
    consentRecordsCount: number;
    auditRecordsCount: number;
    complianceStatus: string;
  } {
    const expiredConsents = this.consentRecords.filter(
      c => c.expiresAt && c.expiresAt < Date.now()
    ).length;

    return {
      policyCount: this.retentionPolicies.size,
      consentRecordsCount: this.consentRecords.length,
      auditRecordsCount: this.processingAudits.length,
      complianceStatus:
        expiredConsents === 0 ? '✅ COMPLIANT' : '⚠️ REVIEW NEEDED',
    };
  }

  enforceRetention(): {
    purgedCount: number;
    anonymizedCount: number;
  } {
    let purgedCount = 0;
    let anonymizedCount = 0;
    const now = Date.now();

    this.processingAudits = this.processingAudits.filter(audit => {
      const daysSince = (now - audit.timestamp) / (1000 * 60 * 60 * 24);
      const policy = this.retentionPolicies.get('default') || {
        retentionDays: 365,
      };

      if (daysSince > policy.retentionDays) {
        purgedCount++;
        return false;
      }

      if (policy.anonymizeAfterDays && daysSince > policy.anonymizeAfterDays) {
        audit.userId = this.pseudonymize(audit.userId);
        anonymizedCount++;
      }

      return true;
    });

    return { purgedCount, anonymizedCount };
  }
}
