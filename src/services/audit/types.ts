export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  REGISTER = 'REGISTER',
  DEPRECATE = 'DEPRECATE'
}

export interface GDPRContext {
  dataSubject?: string;
  legalBasis?: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
  retentionPeriod?: number;
  purpose?: string;
}
