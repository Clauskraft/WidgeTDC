import { AuditLog } from '../AuditLog';
import { AuditAction } from '../types';

describe('AuditLog', () => {
  let auditLog: AuditLog;

  beforeEach(() => {
    auditLog = new AuditLog();
  });

  test('should log audit entry', () => {
    const entry = auditLog.log(AuditAction.CREATE, 'user-123', 'widget', 'widget-456', {
      name: 'Test Widget',
    });
    expect(entry.action).toBe(AuditAction.CREATE);
    expect(entry.userId).toBe('user-123');
    expect(entry.currentHash).toBeDefined();
  });

  test('should verify chain integrity', () => {
    auditLog.log(AuditAction.CREATE, 'user-1', 'widget', 'w-1');
    auditLog.log(AuditAction.UPDATE, 'user-1', 'widget', 'w-1');
    expect(auditLog.verifyChainIntegrity()).toBe(true);
  });

  test('should export GDPR report', () => {
    auditLog.log(AuditAction.CREATE, 'user-gdpr', 'widget', 'w-1');
    const report = auditLog.exportGDPRReport('user-gdpr');
    expect(report.dataSubject).toBe('user-gdpr');
    expect(report.totalEntries).toBe(1);
    expect(report.chainIntegrity).toBe(true);
  });
});
