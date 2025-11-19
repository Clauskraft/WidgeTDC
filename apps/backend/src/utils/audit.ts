import { AuditAction, auditLog } from '../../../../src/services/audit';

/**
 * Lightweight wrapper around the shared audit log that keeps backend services
 * decoupled from the front-end implementation details.
 */
export async function logAudit(
  orgId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  auditLog.log(
    AuditAction.UPDATE,
    userId,
    action,
    orgId,
    {
      ...details,
      orgId,
    }
  );
}
