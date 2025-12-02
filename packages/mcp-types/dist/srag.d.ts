export type QueryType = 'analytical' | 'semantic';
export interface SragQueryRequest {
    orgId: string;
    naturalLanguageQuery: string;
}
export interface SragQueryResponse {
    type: QueryType;
    result: any;
    sqlQuery: string | null;
    metadata: {
        traceId: string;
        docIds?: number[];
    };
}
export interface RawDocumentInput {
    orgId: string;
    sourceType: string;
    sourcePath: string;
    content: string;
}
export interface StructuredFactInput {
    orgId: string;
    docId?: number;
    factType: string;
    jsonPayload: Record<string, any>;
    occurredAt?: string;
}
