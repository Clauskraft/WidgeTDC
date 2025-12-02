import { getDatabase } from '../../database/index.js';
import { PalEventInput } from '@widget-tdc/mcp-types';

export class PalRepository {
  private get db() {
    return getDatabase();
  }

  // User Profile operations
  getUserProfile(userId: string, orgId: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM pal_user_profiles
      WHERE user_id = ? AND org_id = ?
    `);
    
    if (stmt.get && !stmt.getAsObject) { // better-sqlite3
        return stmt.get(userId, orgId);
    } else { // sql.js
        stmt.bind([userId, orgId]);
        if (stmt.step()) {
            const res = stmt.getAsObject();
            stmt.free();
            return res;
        }
        stmt.free();
        return undefined;
    }
  }

  createUserProfile(userId: string, orgId: string, preferenceTone: string = 'neutral'): number {
    const stmt = this.db.prepare(`
      INSERT INTO pal_user_profiles (user_id, org_id, preference_tone)
      VALUES (?, ?, ?)
    `);
    
    let result: any;
    if (stmt.run.length === 1) {
        stmt.run([userId, orgId, preferenceTone]);
    } else {
        result = stmt.run(userId, orgId, preferenceTone);
    }

    if (result && result.lastInsertRowid) {
        return result.lastInsertRowid as number;
    } else {
        const res = this.db.exec("SELECT last_insert_rowid()");
        return res[0].values[0][0] as number;
    }
  }

  updateUserProfile(userId: string, orgId: string, preferenceTone: string): void {
    const stmt = this.db.prepare(`
      UPDATE pal_user_profiles
      SET preference_tone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND org_id = ?
    `);
    
    if (stmt.run.length === 1) {
        stmt.run([preferenceTone, userId, orgId]);
    } else {
        stmt.run(preferenceTone, userId, orgId);
    }
  }

  // Focus Windows operations
  getFocusWindows(userId: string, orgId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pal_focus_windows
      WHERE user_id = ? AND org_id = ?
      ORDER BY weekday, start_hour
    `);
    
    if (stmt.all) {
        return stmt.all(userId, orgId);
    } else {
        stmt.bind([userId, orgId]);
        const results: any[] = [];
        while(stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }
  }

  addFocusWindow(userId: string, orgId: string, weekday: number, startHour: number, endHour: number): number {
    const stmt = this.db.prepare(`
      INSERT INTO pal_focus_windows (user_id, org_id, weekday, start_hour, end_hour)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    let result: any;
    const params = [userId, orgId, weekday, startHour, endHour];
    
    if (stmt.run.length === 1) {
        stmt.run(params);
    } else {
        result = stmt.run(...params);
    }

    if (result && result.lastInsertRowid) {
        return result.lastInsertRowid as number;
    } else {
        const res = this.db.exec("SELECT last_insert_rowid()");
        return res[0].values[0][0] as number;
    }
  }

  // Event operations
  recordEvent(event: PalEventInput): number {
    const stmt = this.db.prepare(`
      INSERT INTO pal_events (user_id, org_id, event_type, payload, detected_stress_level)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const params = [
      event.userId,
      event.orgId,
      event.eventType,
      JSON.stringify(event.payload),
      event.detectedStressLevel || null
    ];
    
    let result: any;
    if (stmt.run.length === 1) {
        stmt.run(params);
    } else {
        result = stmt.run(...params);
    }

    if (result && result.lastInsertRowid) {
        return result.lastInsertRowid as number;
    } else {
        const res = this.db.exec("SELECT last_insert_rowid()");
        return res[0].values[0][0] as number;
    }
  }

  getRecentEvents(userId: string, orgId: string, limit: number = 20): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    let rows: any[];
    if (stmt.all) {
        rows = stmt.all(userId, orgId, limit);
    } else {
        stmt.bind([userId, orgId, limit]);
        rows = [];
        while(stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
    }

    return rows.map((row: any) => {
      let payload = {};
      try {
        payload = JSON.parse(row.payload || '{}');
      } catch (error) {
        console.error('Error parsing payload JSON:', error);
        payload = {};
      }
      return {
        ...row,
        payload,
      };
    });
  }

  getEventsByType(userId: string, orgId: string, eventType: string, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pal_events
      WHERE user_id = ? AND org_id = ? AND event_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    let rows: any[];
    if (stmt.all) {
        rows = stmt.all(userId, orgId, eventType, limit);
    } else {
        stmt.bind([userId, orgId, eventType, limit]);
        rows = [];
        while(stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
    }

    return rows.map((row: any) => {
      let payload = {};
      try {
        payload = JSON.parse(row.payload || '{}');
      } catch (error) {
        console.error('Error parsing payload JSON:', error);
        payload = {};
      }
      return {
        ...row,
        payload,
      };
    });
  }

  getStressLevelDistribution(userId: string, orgId: string, hoursBack: number = 24): any {
    const stmt = this.db.prepare(`
      SELECT detected_stress_level, COUNT(*) as count
      FROM pal_events
      WHERE user_id = ? AND org_id = ?
        AND detected_stress_level IS NOT NULL
        AND created_at >= datetime('now', '-' || ? || ' hours')
      GROUP BY detected_stress_level
    `);
    
    if (stmt.all) {
        return stmt.all(userId, orgId, hoursBack);
    } else {
        stmt.bind([userId, orgId, hoursBack]);
        const results: any[] = [];
        while(stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }
  }
}
