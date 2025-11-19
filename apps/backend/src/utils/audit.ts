export async function logAudit(
  orgId: string,
  userId: string,
  event: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  console.info('[AUDIT]', JSON.stringify({ orgId, userId, event, metadata, timestamp: new Date().toISOString() }));
}
