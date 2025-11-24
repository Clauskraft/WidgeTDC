export class FeedIngestionService {
    private baseUrl = '/api/security';

    async getFeeds(): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/feeds`);
            if (!response.ok) throw new Error('Failed to fetch feeds');
            const data = await response.json();
            return data.feeds || [];
        } catch (error) {
            console.error('Error fetching feeds:', error);
            return [];
        }
    }

    async addFeed(url: string): Promise<void> {
        // Backend doesn't seem to have an add feed endpoint yet in the controller I saw.
        // We will log for now.
        console.log('[FeedIngestion] Adding feed (not implemented in backend):', url);
        return Promise.resolve();
    }
}
