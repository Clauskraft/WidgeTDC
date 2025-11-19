import { getDatabase } from '../../database/index.js';
import { PalEventInput } from '@widget-tdc/mcp-types';

export class PalRepository {
  private db = getDatabase();

  // User Profile operations
  getUserProfile(userId: string, orgId: string): any {
    return this.db
      .prepare(
        `
      SELECT * FROM pal_user_profiles
      WHERE user_id = ? AND org_id = ?
    `
      )
      .get(userId, orgId);
  }

  createUserProfile(userId: string, orgId: string, preferenceTone: string = 'neutral'): number {
    const result = this.db
      .prepare(
        `
      INSERT INTO pal_user_profiles (user_id, org_id, preference_tone)
      VALUES (?, ?, ?)
    `
      )
      .run(userId, orgId, preferenceTone);

    return result.lastInsertRowid as number;
  }

  updateUserProfile(userId: string, orgId: string, preferenceTone: string): void {
    this.db
      .prepare(
        `
      UPDATE pal_user_profiles
      SET preference_tone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND org_id = ?
    `
      )
      .run(preferenceTone, userId, orgId);
  }

  // Focus Windows operations
  getFocusWindows(userId: string, orgId: string): any[] {
    return this.db
      .prepare(
        `
      SELECT * FROM pal_focus_windows
      WHERE user_id = ? AND org_id = ?
      ORDER BY weekday, start_hour
    `
      )
      .all(userId, orgId);
  }

  addFocusWindow(
    userId: string,
    orgId: string,
    weekday: number,
    startHour: number,
    endHour: number
  ): number {
    const result = this.db
      .prepare(
        `
      INSERT INTO pal_focus_windows (user_id, org_id, weekday, start_hour, end_hour)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(userId, orgId, weekday, startHour, endHour);

    return result.lastInsertRowid as number;
  }

  // Event operations
  recordEvent(event: PalEventInput): number {
    const result = this.db
      .prepare(
        `
      INSERT INTO pal_events (user_id, org_id, event_type, payload, detected_stress_level)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        event.userId,
        event.orgId,
        event.eventType,
        JSON.stringify(event.payload),
        event.detectedStressLevel || null
      );

    return result.lastInsertRowid as number;
  }

  getRecentEvents(userId: string, orgId: string, limit: number = 20): any[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(userId, orgId, limit);

    return rows.map((row: any) => ({
      ...row,
      payload: JSON.parse(row.payload || '{}'),
    }));
  }

  getEventsByType(userId: string, orgId: string, eventType: string, limit: number = 10): any[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ? AND event_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(userId, orgId, eventType, limit);

    return rows.map((row: any) => ({
      ...row,
      payload: JSON.parse(row.payload || '{}'),
    }));
  }

  getStressLevelDistribution(userId: string, orgId: string, hoursBack: number = 24): any {
    const result = this.db
      .prepare(
        `
      SELECT detected_stress_level, COUNT(*) as count
      FROM pal_events
      WHERE user_id = ? AND org_id = ?
        AND detected_stress_level IS NOT NULL
        AND created_at >= datetime('now', '-' || ? || ' hours')
      GROUP BY detected_stress_level
    `
      )
      .all(userId, orgId, hoursBack);

    return result;
  }
}
