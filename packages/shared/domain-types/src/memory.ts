typescript
// Memory domain entities

export interface MemoryEntity {
  readonly id: number;
  readonly orgId: string;
  readonly userId?: string;
  readonly entityType: string;
  readonly content: string;
  readonly importance: number;
  readonly createdAt: Date;
}

export type MemoryRelationType = 
  | 'depends_on' 
  | 'contradicts' 
  | 'same_project' 
  | 'related_to';

export interface MemoryRelation {
  readonly id: number;
  readonly orgId: string;
  readonly sourceId: number;
  readonly targetId: number;
  readonly relationType: MemoryRelationType;
  readonly createdAt: Date;
}

export interface MemoryTag {
  readonly id: number;
  readonly entityId: number;
  readonly tag: string;
}