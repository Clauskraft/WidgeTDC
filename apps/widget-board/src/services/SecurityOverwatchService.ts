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

    async getActivities(filters: { severity?: string; category?: string; limit?: number } = {}): Promise<any[]> {
        try {
            const params = new URLSearchParams();
            if (filters.severity && filters.severity !== 'all') params.append('severity', filters.severity);
            if (filters.category && filters.category !== 'all') params.append('category', filters.category);
            if (filters.limit) params.append('limit', filters.limit.toString());

            const response = await fetch(`${this.baseUrl}/activity?${params}`);
            if (!response.ok) throw new Error('Failed to fetch activity');
            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error('Error fetching activity:', error);
            return [];
        }
    }

    connectToActivityStream(
        filters: { severity?: string; category?: string } = {},
        onMessage: (event: any) => void,
        onError?: () => void
    ): EventSource {
        const params = new URLSearchParams();
        if (filters.severity && filters.severity !== 'all') params.append('severity', filters.severity);
        if (filters.category && filters.category !== 'all') params.append('category', filters.category);

        const eventSource = new EventSource(`${this.baseUrl}/activity/stream?${params}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Error parsing SSE event:', error);
            }
        };

        eventSource.onerror = () => {
            if (onError) onError();
            eventSource.close();
        };

        return eventSource;
    }

    async acknowledgeActivity(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/activity/${id}/ack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acknowledged: true })
            });
            return response.ok;
        } catch (error) {
            console.error('Error acknowledging activity:', error);
            return false;
        }
    }

    async searchSecurity(params: { query: string; severity: string; timeframe: string; sources: string[] }): Promise<{ results: any[]; metrics: any }> {
        try {
            const response = await fetch(`${this.baseUrl}/search/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) throw new Error('Search failed');
            return await response.json();
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
}
