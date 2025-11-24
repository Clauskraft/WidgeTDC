export class AuditLogService {
    async logEvent(event: string, details: any): Promise<void> {
        console.log('[AuditLog]', event, details);
        // In real implementation, send to backend
        return Promise.resolve();
    }

    async getLogs(): Promise<any[]> {
        return Promise.resolve([]);
    }
}
