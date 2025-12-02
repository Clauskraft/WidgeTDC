import { getDatabase } from '../../database/index.js';
export class PalRepository {
    get db() {
        return getDatabase();
    }
    // User Profile operations
    getUserProfile(userId, orgId) {
        return this.db.prepare(`
      SELECT * FROM pal_user_profiles
      WHERE user_id = ? AND org_id = ?
    `).get(userId, orgId);
    }
    createUserProfile(userId, orgId, preferenceTone = 'neutral') {
        const result = this.db.prepare(`
      INSERT INTO pal_user_profiles (user_id, org_id, preference_tone)
      VALUES (?, ?, ?)
    `).run(userId, orgId, preferenceTone);
        return result.lastInsertRowid;
    }
    updateUserProfile(userId, orgId, preferenceTone) {
        this.db.prepare(`
      UPDATE pal_user_profiles
      SET preference_tone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND org_id = ?
    `).run(preferenceTone, userId, orgId);
    }
    // Focus Windows operations
    getFocusWindows(userId, orgId) {
        return this.db.prepare(`
      SELECT * FROM pal_focus_windows
      WHERE user_id = ? AND org_id = ?
      ORDER BY weekday, start_hour
    `).all(userId, orgId);
    }
    addFocusWindow(userId, orgId, weekday, startHour, endHour) {
        const result = this.db.prepare(`
      INSERT INTO pal_focus_windows (user_id, org_id, weekday, start_hour, end_hour)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, orgId, weekday, startHour, endHour);
        return result.lastInsertRowid;
    }
    // Event operations
    recordEvent(event) {
        const result = this.db.prepare(`
      INSERT INTO pal_events (user_id, org_id, event_type, payload, detected_stress_level)
      VALUES (?, ?, ?, ?, ?)
    `).run(event.userId, event.orgId, event.eventType, JSON.stringify(event.payload), event.detectedStressLevel || null);
        return result.lastInsertRowid;
    }
    getRecentEvents(userId, orgId, limit = 20) {
        const rows = this.db.prepare(`
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, orgId, limit);
        return rows.map((row) => {
            let payload = {};
            try {
                payload = JSON.parse(row.payload || '{}');
            }
            catch (error) {
                console.error('Error parsing payload JSON:', error);
                payload = {};
            }
            return {
                ...row,
                payload,
            };
        });
    }
    getEventsByType(userId, orgId, eventType, limit = 10) {
        const rows = this.db.prepare(`
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ? AND event_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, orgId, eventType, limit);
        return rows.map((row) => {
            let payload = {};
            try {
                payload = JSON.parse(row.payload || '{}');
            }
            catch (error) {
                console.error('Error parsing payload JSON:', error);
                payload = {};
            }
            return {
                ...row,
                payload,
            };
        });
    }
    getStressLevelDistribution(userId, orgId, hoursBack = 24) {
        const result = this.db.prepare(`
      SELECT detected_stress_level, COUNT(*) as count
      FROM pal_events
      WHERE user_id = ? AND org_id = ?
        AND detected_stress_level IS NOT NULL
        AND created_at >= datetime('now', '-' || ? || ' hours')
      GROUP BY detected_stress_level
    `).all(userId, orgId, hoursBack);
        return result;
    }
}
