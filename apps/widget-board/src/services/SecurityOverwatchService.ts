export class SecurityOverwatchService {
    private baseUrl = '/api/security';

    async getSecurityStatus(): Promise<{ status: string; activeThreats: number }> {
        // For now, we derive status from feeds or activity. 
        // This is a simplified implementation.
        try {
            const response = await fetch(`${this.baseUrl}/feeds`);
            if (!response.ok) throw new Error('Failed to fetch security status');
            const data = await response.json();
            // Simple logic: if any feed has critical threat level, status is critical
            const criticalFeeds = data.feeds.filter((f: any) => f.threatLevel === 'critical').length;
            return {
                status: criticalFeeds > 0 ? 'critical' : 'secure',
                activeThreats: criticalFeeds
            };
        } catch (error) {
            console.error('Error fetching security status:', error);
            return { status: 'unknown', activeThreats: 0 };
        }
    }

    async getAlerts(): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/activity?severity=high`);
            if (!response.ok) throw new Error('Failed to fetch alerts');
            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    }
}
