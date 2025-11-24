/**
 * In-Memory Audit Log Service
 * 
 * Development implementation of AuditLogService with full hash-chain
 * integrity verification and retention-aware design.
 */

import type {
  AuditEvent,
  AuditEventId,
  AuditQuery,
  AuditLogService,
  AuditStatistics,
  IntegrityVerificationResult,
} from './types';
import { DEFAULT_RETENTION_POLICIES } from './types';
import { createLogger } from '../core/logging';

/**
 * In-memory implementation of AuditLogService
 */
export class InMemoryAuditLogService implements AuditLogService {
  private events: AuditEvent[] = [];
  private eventCounter = 0;
  private readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
  private readonly logger = createLogger('InMemoryAuditLogService', 'warn');

  /**
   * Generate the next sequential event ID
   */
  private generateEventId(): AuditEventId {
    return `AE${String(++this.eventCounter).padStart(12, '0')}`;
  }

  /**
   * Compute SHA-256 hash of event content
   * Note: Uses Web Crypto API for production-grade hashing
   */
  private async computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Serialize event payload for hashing
   */
  private serializeForHash(event: Omit<AuditEvent, 'hash'>): string {
    return JSON.stringify({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      domain: event.domain,
      sensitivity: event.sensitivity,
      actor: event.actor,
      payload: event.payload,
      previousHash: event.previousHash,
    });
  }

  async append(event: Omit<AuditEvent, 'id' | 'hash' | 'previousHash'>): Promise<AuditEvent> {
    const id = this.generateEventId();
    const previousHash = this.events.length > 0 
      ? this.events[this.events.length - 1].hash 
      : this.GENESIS_HASH;

    // Use default retention policy if not provided
    const retention = event.retention || DEFAULT_RETENTION_POLICIES[event.sensitivity];

    const eventWithChain: Omit<AuditEvent, 'hash'> = {
      ...event,
      id,
      previousHash,
      retention,
    };

    const hash = await this.computeHash(this.serializeForHash(eventWithChain));

    const completeEvent: AuditEvent = {
      ...eventWithChain,
      hash,
    };

    this.events.push(completeEvent);
    return completeEvent;
  }

  async query(query: AuditQuery): Promise<AuditEvent[]> {
    let results = [...this.events];

    // Filter by domain
    if (query.domain) {
      const domains = Array.isArray(query.domain) ? query.domain : [query.domain];
      results = results.filter(e => domains.includes(e.domain));
    }

    // Filter by sensitivity
    if (query.sensitivity) {
      const sensitivities = Array.isArray(query.sensitivity) 
        ? query.sensitivity 
        : [query.sensitivity];
      results = results.filter(e => sensitivities.includes(e.sensitivity));
    }

    // Filter by actor ID
    if (query.actorId) {
      results = results.filter(e => e.actor.id === query.actorId);
    }

    // Filter by actor type
    if (query.actorType) {
      results = results.filter(e => e.actor.type === query.actorType);
    }

    // Filter by action
    if (query.action) {
      results = results.filter(e => e.payload.action === query.action);
    }

    // Filter by resource type
    if (query.resourceType) {
      results = results.filter(e => e.payload.resourceType === query.resourceType);
    }

    // Filter by resource ID
    if (query.resourceId) {
      results = results.filter(e => e.payload.resourceId === query.resourceId);
    }

    // Filter by outcome
    if (query.outcome) {
      results = results.filter(e => e.payload.outcome === query.outcome);
    }

    // Filter by time range
    if (query.timeRange) {
      const { from, to } = query.timeRange;
      results = results.filter(e => {
        const timestamp = e.timestamp.getTime();
        return timestamp >= from.getTime() && timestamp <= to.getTime();
      });
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(e => 
        e.tags && query.tags!.some(tag => e.tags!.includes(tag))
      );
    }

    // Sort
    const sortDirection = query.sortDirection || 'desc';
    results.sort((a, b) => {
      const comparison = a.timestamp.getTime() - b.timestamp.getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async getById(id: AuditEventId): Promise<AuditEvent | undefined> {
    return this.events.find(e => e.id === id);
  }

  async verifyIntegrity(options?: { from?: AuditEventId; to?: AuditEventId }): Promise<IntegrityVerificationResult> {
    const errors: string[] = [];
    const brokenChainAt: number[] = [];

    let startIndex = 0;
    let endIndex = this.events.length - 1;

    // Find start index
    if (options?.from) {
      startIndex = this.events.findIndex(e => e.id === options.from);
      if (startIndex === -1) {
        return {
          valid: false,
          eventsVerified: 0,
          verifiedAt: new Date(),
          errors: [`Start event ${options.from} not found`],
        };
      }
    }

    // Find end index
    if (options?.to) {
      endIndex = this.events.findIndex(e => e.id === options.to);
      if (endIndex === -1) {
        return {
          valid: false,
          eventsVerified: 0,
          verifiedAt: new Date(),
          errors: [`End event ${options.to} not found`],
        };
      }
    }

    // Verify chain
    for (let i = startIndex; i <= endIndex; i++) {
      const event = this.events[i];
      const expectedPreviousHash = i === 0 ? this.GENESIS_HASH : this.events[i - 1].hash;

      // Verify previous hash
      if (event.previousHash !== expectedPreviousHash) {
        brokenChainAt.push(i);
        errors.push(
          `Event ${event.id} has incorrect previousHash. ` +
          `Expected: ${expectedPreviousHash}, Got: ${event.previousHash}`
        );
      }

      // Verify event hash
      const eventWithoutHash: Omit<AuditEvent, 'hash'> = {
        id: event.id,
        timestamp: event.timestamp,
        domain: event.domain,
        sensitivity: event.sensitivity,
        actor: event.actor,
        payload: event.payload,
        previousHash: event.previousHash,
        retention: event.retention,
        tags: event.tags,
      };
      const computedHash = await this.computeHash(this.serializeForHash(eventWithoutHash));

      if (event.hash !== computedHash) {
        brokenChainAt.push(i);
        errors.push(
          `Event ${event.id} has incorrect hash. ` +
          `Expected: ${computedHash}, Got: ${event.hash}`
        );
      }
    }

    return {
      valid: brokenChainAt.length === 0,
      eventsVerified: endIndex - startIndex + 1,
      brokenChainAt: brokenChainAt.length > 0 ? brokenChainAt : undefined,
      verifiedAt: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getStatistics(): Promise<AuditStatistics> {
    const byDomain: Record<string, number> = {};
    const bySensitivity: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};

    for (const event of this.events) {
      byDomain[event.domain] = (byDomain[event.domain] || 0) + 1;
      bySensitivity[event.sensitivity] = (bySensitivity[event.sensitivity] || 0) + 1;
      byOutcome[event.payload.outcome] = (byOutcome[event.payload.outcome] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      byDomain: byDomain as any,
      bySensitivity: bySensitivity as any,
      byOutcome: byOutcome as any,
      firstEventAt: this.events.length > 0 ? this.events[0].timestamp : undefined,
      lastEventAt: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : undefined,
    };
  }

  async archiveExpiredEvents(dryRun: boolean = false): Promise<number> {
    const now = new Date();
    const expiredEvents = this.events.filter(event => {
      const expiryDate = new Date(event.timestamp);
      expiryDate.setDate(expiryDate.getDate() + event.retention.retentionDays);
      return expiryDate < now && !event.retention.legalHold;
    });

    if (!dryRun) {
      // In production, this would archive to external storage
      // For in-memory implementation, we'll keep events for integrity
      // but could mark them as archived
      this.logger.warn(
        `archiveExpiredEvents: ${expiredEvents.length} events would be archived. ` +
        `In-memory implementation does not actually remove events.`
      );
    }

    return expiredEvents.length;
  }

  async exportEvents(query: AuditQuery, format: 'json' | 'csv'): Promise<string> {
    const events = await this.query(query);

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV export
      if (events.length === 0) {
        return 'id,timestamp,domain,sensitivity,actor,action,outcome\n';
      }

      const headers = 'id,timestamp,domain,sensitivity,actor,action,outcome\n';
      const rows = events.map(e => 
        `${e.id},${e.timestamp.toISOString()},${e.domain},${e.sensitivity},${e.actor.id},${e.payload.action},${e.payload.outcome}`
      ).join('\n');

      return headers + rows;
    }
  }
}
