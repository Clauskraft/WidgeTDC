// PAL domain entities

export interface PalUserProfile {
  id: number;
  userId: string;
  orgId: string;
  preferenceTone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PalFocusWindow {
  id: number;
  userId: string;
  orgId: string;
  weekday: number;
  startHour: number;
  endHour: number;
}

export interface PalEvent {
  id: number;
  userId: string;
  orgId: string;
  eventType: string;
  payload: Record<string, any>;
  detectedStressLevel?: 'low' | 'medium' | 'high';
  createdAt: Date;
}
