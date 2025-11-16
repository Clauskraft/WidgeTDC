# ADR-0002: Audit Log Hash-Chain and Retention

## Status
Accepted

## Context

Enterprise platforms require comprehensive audit logging for:
- **Security Monitoring**: Track all security-relevant events
- **Compliance**: Meet GDPR, ISO 27001, SOC 2, and other regulatory requirements
- **Forensics**: Investigate incidents and trace actions
- **Accountability**: Maintain non-repudiation of actions
- **Privacy**: Balance logging needs with data protection obligations

### Current State

No formal audit logging system exists in the platform. Some components log to console, but there is:
- No structured event format
- No integrity verification
- No retention management
- No privacy controls
- No compliance framework

### Requirements

**Functional**:
- Append-only event log (immutable history)
- Cryptographic integrity verification
- Retention policies based on sensitivity
- Query and search capabilities
- Privacy-aware event structure
- Export for compliance reporting

**Non-Functional**:
- < 10ms append latency (P95)
- < 100ms query latency (P95)
- GDPR Article 5(1)(e) compliance (storage limitation)
- ISO 27001 A.12.4 (logging and monitoring)
- SOC 2 CC6.8 (audit logs)

**Compliance Requirements**:
- **GDPR**: Purpose limitation, storage limitation, data minimization
- **ISO 27001**: Logging of user activities, exceptions, faults, and events
- **SOC 2**: Monitoring of system components, logging of changes
- **Right to Erasure**: Support for data subject requests (GDPR Article 17)

## Decision

We will implement a **hash-chain audit log** with **retention-aware policies** and **privacy-by-design** principles.

### Architecture

**Core Concepts**:

1. **Hash-Chain Integrity**: Each event includes the SHA-256 hash of the previous event, creating an immutable chain that detects tampering
2. **Sequential IDs**: Events have monotonically increasing IDs for ordering
3. **Privacy-Aware**: Events store IDs and metadata, not raw sensitive content
4. **Retention Policies**: Automatic archival/deletion based on sensitivity and legal requirements

### Type System (`src/platform/audit/types.ts`)

````typescript
// Audit event with hash-chain
interface AuditEvent {
  id: AuditEventId;              // Sequential: AE000000000001, AE000000000002, ...
  timestamp: Date;               // ISO 8601 timestamp
  domain: AuditDomain;           // Functional area: authentication, widget-lifecycle, etc.
  sensitivity: AuditSensitivity; // GDPR-aware: public, internal, confidential, restricted, pii
  actor: AuditActor;            // Who performed the action
  payload: AuditEventPayload;   // What was done (privacy-aware)
  previousHash: string;         // SHA-256 hash of previous event (hex)
  hash: string;                 // SHA-256 hash of this event (hex)
  retention: AuditRetention;    // Retention policy
  tags?: string[];              // For filtering
}

// Privacy-aware payload (no raw sensitive content)
interface AuditEventPayload {
  action: string;               // e.g., "widget.created", "user.login"
  resourceType?: string;        // e.g., "widget", "user", "template"
  resourceId?: string;          // ID only, not content
  outcome: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>; // Additional context (no PII)
  error?: { code: string; message: string };
}

// Retention policy by sensitivity
interface AuditRetention {
  retentionDays: number;        // How long to keep
  archiveBeforeDelete: boolean; // Archive before deletion
  archiveLocation?: string;     // Where to archive
  legalHold: boolean;          // Cannot be deleted (litigation, investigation)
}
````

**Default Retention Policies**:

````typescript
const DEFAULT_RETENTION_POLICIES = {
  public: {
    retentionDays: 90,          // 3 months
    archiveBeforeDelete: false,
    legalHold: false,
  },
  internal: {
    retentionDays: 365,         // 1 year
    archiveBeforeDelete: true,
    legalHold: false,
  },
  confidential: {
    retentionDays: 730,         // 2 years
    archiveBeforeDelete: true,
    legalHold: false,
  },
  restricted: {
    retentionDays: 2555,        // 7 years (common legal requirement)
    archiveBeforeDelete: true,
    legalHold: true,
  },
  pii: {
    retentionDays: 365,         // 1 year (GDPR: only as long as necessary)
    archiveBeforeDelete: true,
    legalHold: false,
  },
};
````

### Hash-Chain Implementation

**Algorithm**:

1. **Genesis**: First event uses genesis hash `0000...0000` (64 zeros)
2. **Chaining**: Each subsequent event includes `previousHash = SHA256(previous event)`
3. **Event Hash**: `hash = SHA256(event fields + previousHash)`
4. **Verification**: Walk the chain verifying each hash matches

**Serialization for Hashing**:

````typescript
function serializeForHash(event: Omit<AuditEvent, 'hash'>): string {
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

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
````

### Service Interface

````typescript
interface AuditLogService {
  // Append event (generates ID, hash, previousHash)
  append(event: Omit<AuditEvent, 'id' | 'hash' | 'previousHash'>): Promise<AuditEvent>;
  
  // Query events
  query(query: AuditQuery): Promise<AuditEvent[]>;
  
  // Get by ID
  getById(id: AuditEventId): Promise<AuditEvent | undefined>;
  
  // Verify hash-chain integrity
  verifyIntegrity(options?: { from?: AuditEventId; to?: AuditEventId }): Promise<IntegrityVerificationResult>;
  
  // Get statistics
  getStatistics(): Promise<AuditStatistics>;
  
  // Archive expired events
  archiveExpiredEvents(dryRun?: boolean): Promise<number>;
  
  // Export for compliance reporting
  exportEvents(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}
````

### Implementation Details

**Phase 1**: In-memory implementation (`InMemoryAuditLogService.ts`)
- Stores events in memory (Map)
- Full hash-chain verification
- Retention policy simulation
- Suitable for development and testing

**Phase 2+**: Production implementations
- PostgreSQL with append-only table
- Event sourcing with Kafka/EventStoreDB
- Immutable storage (WORM - Write Once Read Many)
- External archival (S3 Glacier, Azure Archive)

### Privacy-by-Design Principles

1. **Data Minimization**: Store only IDs and metadata, not content
2. **Purpose Limitation**: Each event has explicit domain and sensitivity
3. **Storage Limitation**: Automatic archival/deletion per retention policy
4. **Integrity**: Hash-chain prevents unauthorized modification
5. **Right to Erasure**: PII events can be archived/deleted after retention period

**Example: Privacy-Aware Events**

✅ **Good** (Privacy-Aware):
````typescript
{
  action: "widget.created",
  resourceType: "widget",
  resourceId: "WDG00001234",
  metadata: { widgetType: "AgentChatWidget", author: "USR00005678" }
}
````

❌ **Bad** (Contains PII/Content):
````typescript
{
  action: "widget.created",
  resourceType: "widget",
  resourceId: "WDG00001234",
  metadata: { 
    widgetType: "AgentChatWidget",
    authorName: "John Doe",           // PII
    authorEmail: "john@example.com",  // PII
    configContent: "{ ... }"          // Sensitive content
  }
}
````

## Consequences

### Positive

✅ **Integrity**: Cryptographic hash-chain prevents tampering  
✅ **Compliance**: Meets GDPR, ISO 27001, SOC 2 requirements  
✅ **Privacy**: Privacy-by-design with data minimization  
✅ **Forensics**: Comprehensive audit trail for investigations  
✅ **Accountability**: Non-repudiation of actions  
✅ **Automation**: Retention policies automate lifecycle management  
✅ **Flexibility**: Extensible for new event types and domains

### Negative

⚠️ **Storage**: Append-only log grows indefinitely (mitigated by archival)  
⚠️ **Performance**: Hash computation adds latency (< 10ms acceptable)  
⚠️ **Complexity**: Hash-chain verification requires careful implementation  
⚠️ **Immutability**: Cannot delete events (except per retention policy)

### Mitigation

- **Storage**: Automated archival to cold storage after retention period
- **Performance**: Async hash computation, batching for high throughput
- **Complexity**: Comprehensive tests for integrity verification
- **Immutability**: Legal hold for investigations, otherwise deletion per policy

## Alternatives Considered

### Alternative 1: Simple Logging (Console/File)
**Rejected**: No integrity verification, no retention management, no compliance support

### Alternative 2: Blockchain-Based Audit Log
**Rejected**: Overkill for this use case, high complexity and cost, limited query capabilities

### Alternative 3: Event Sourcing Without Hash-Chain
**Rejected**: Doesn't provide tamper detection, reduced integrity guarantees

## Implementation Notes

### Phase 1 (Current)
- ✅ Define audit types and interfaces
- ✅ Implement in-memory service with hash-chain
- ✅ Implement integrity verification
- ✅ Define default retention policies
- ✅ Document privacy guidelines

### Phase 2 (Future)
- Persistent storage (PostgreSQL/EventStoreDB)
- External archival integration
- Compliance reporting dashboard
- Automated retention enforcement
- Right to erasure workflows

### Phase 3 (Future)
- Real-time audit streaming
- Anomaly detection
- AI-powered audit analysis
- Multi-region audit replication

## Compliance Mapping

### GDPR
- **Article 5(1)(a)**: Lawfulness, fairness, transparency → Explicit event purpose
- **Article 5(1)(c)**: Data minimization → Store IDs, not content
- **Article 5(1)(e)**: Storage limitation → Retention policies
- **Article 17**: Right to erasure → Automated deletion after retention
- **Article 32**: Security of processing → Hash-chain integrity

### ISO 27001
- **A.12.4.1**: Event logging → Comprehensive event capture
- **A.12.4.2**: Protection of log information → Hash-chain immutability
- **A.12.4.3**: Administrator and operator logs → Actor tracking
- **A.12.4.4**: Clock synchronization → ISO 8601 timestamps

### SOC 2
- **CC6.8**: Monitoring of system components → Event domains cover all components
- **CC7.2**: Detection of anomalous events → Query and analysis capabilities
- **CC8.1**: Identification of changes → Widget lifecycle events

## References

- GDPR: https://gdpr-info.eu/
- ISO 27001: https://www.iso.org/standard/27001
- SOC 2: https://www.aicpa.org/soc
- NIST SP 800-92: Guide to Computer Security Log Management
- Web Crypto API: https://w3c.github.io/webcrypto/

---

**Date**: 2024-11-16  
**Author**: Chief Architect + Security Architect (SystemOverSeer)  
**Reviewers**: Security Architect, Compliance Consultant  
**Status**: Implemented in Phase 1
