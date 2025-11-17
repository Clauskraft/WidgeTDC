import crypto from 'crypto';
import { AuditEntry, AuditAction, GDPRContext } from './types';

export class AuditLog {
  private entries: AuditEntry[] = [];
  private genesisHash: string;

  constructor() {
    this.genesisHash = this.computeHash('GENESIS_BLOCK');
  }

  private computeHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private createEntryPayload(entry: Omit<AuditEntry, 'currentHash'>): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      action: entry.action,
      userId: entry.userId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      previousHash: entry.previousHash
    });
  }

  log(action: AuditAction, userId: string, resourceType: string, resourceId: string, details: Record<string, unknown> = {}, gdprContext?: GDPRContext): AuditEntry {
    const previousHash = this.entries.length > 0
      ? this.entries[this.entries.length - 1].currentHash
      : this.genesisHash;

    const entryWithoutHash: Omit<AuditEntry, 'currentHash'> = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      userId,
      resourceType,
      resourceId,
      details: {
        ...details,
        gdprContext: gdprContext || {}
      },
      previousHash
    };

    const payload = this.createEntryPayload(entryWithoutHash);
    const currentHash = this.computeHash(payload);

    const entry: AuditEntry = {
      ...entryWithoutHash,
      currentHash
    };

    this.entries.push(entry);
    return entry;
  }

  verifyChainIntegrity(): boolean {
    if (this.entries.length === 0) return true;
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedPreviousHash = i === 0 ? this.genesisHash : this.entries[i - 1].currentHash;
      if (entry.previousHash !== expectedPreviousHash) return false;
      const entryWithoutHash: Omit<AuditEntry, 'currentHash'> = {
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        userId: entry.userId,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details,
        previousHash: entry.previousHash
      };
      const payload = this.createEntryPayload(entryWithoutHash);
      const computedHash = this.computeHash(payload);
      if (entry.currentHash !== computedHash) return false;
    }
    return true;
  }

  getEntries(filter?: { userId?: string; resourceType?: string; action?: AuditAction; startDate?: Date; endDate?: Date; }): AuditEntry[] {
    let results = this.entries;
    if (filter) {
      if (filter.userId) results = results.filter(e => e.userId === filter.userId);
      if (filter.resourceType) results = results.filter(e => e.resourceType === filter.resourceType);
      if (filter.action) results = results.filter(e => e.action === filter.action);
      if (filter.startDate) results = results.filter(e => e.timestamp >= filter.startDate!);
      if (filter.endDate) results = results.filter(e => e.timestamp <= filter.endDate!);
    }
    return results;
  }

  exportGDPRReport(userId: string): Record<string, unknown> {
    const userEntries = this.getEntries({ userId });
    return {
      dataSubject: userId,
      reportDate: new Date().toISOString(),
      totalEntries: userEntries.length,
      entries: userEntries.map(entry => ({
        timestamp: entry.timestamp,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details
      })),
      chainIntegrity: this.verifyChainIntegrity()
    };
  }
}

export const auditLog = new AuditLog();
