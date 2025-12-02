export interface MemoryEntityInput {
    orgId: string;
    userId?: string;
    entityType: string;
    content: string;
    importance?: number;
    tags?: string[];
}
export interface MemorySearchQuery {
    orgId: string;
    userId?: string;
    keywords: string[];
    entityTypes?: string[];
    limit?: number;
}
export interface CmaContextRequest {
    userId: string;
    orgId: string;
    userQuery: string;
    widgetData: string;
    keywords: string[];
}
export interface CmaContextResponse {
    prompt: string;
    memories: Array<{
        id: number;
        content: string;
        importance: number;
    }>;
}
export interface CmaIngestResponse {
    id: number;
}
