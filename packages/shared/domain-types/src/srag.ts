// SRAG domain entities

export interface RawDocument {
  id: number;
  orgId: string;
  sourceType: string;
  sourcePath: string;
  content: string;
  createdAt: Date;
}

export interface StructuredFact {
  id: number;
  orgId: string;
  docId?: number;
  factType: string;
  jsonPayload: Record<string, any>;
  occurredAt?: Date;
  createdAt: Date;
}
