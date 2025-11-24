// Memory domain entities

export interface MemoryEntity {
  id: number;
  orgId: string;
  userId?: string;
  entityType: string;
  content: string;
  importance: number;
  createdAt: Date;
}

export interface MemoryRelation {
  id: number;
  orgId: string;
  sourceId: number;
  targetId: number;
  relationType: 'depends_on' | 'contradicts' | 'same_project' | 'related_to';
  createdAt: Date;
}

export interface MemoryTag {
  id: number;
  entityId: number;
  tag: string;
}
