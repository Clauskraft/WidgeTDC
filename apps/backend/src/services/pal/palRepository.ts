import { prisma } from '../../database/prisma.js';
import { PalEventInput } from '@widget-tdc/mcp-types';

export class PalRepository {
  // User Profile operations
  async getUserProfile(userId: string, orgId: string): Promise<any | null> {
    const profile = await prisma.palUserProfile.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      user_id: profile.userId,
      org_id: profile.orgId,
      preference_tone: profile.preferenceTone,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
  }

  async createUserProfile(userId: string, orgId: string, preferenceTone: string = 'neutral'): Promise<number> {
    const profile = await prisma.palUserProfile.create({
      data: {
        userId,
        orgId,
        preferenceTone,
      },
    });

    return profile.id;
  }

  async updateUserProfile(userId: string, orgId: string, preferenceTone: string): Promise<void> {
    await prisma.palUserProfile.update({
      where: {
        userId_orgId: { userId, orgId },
      },
      data: {
        preferenceTone,
      },
    });
  }

  // Focus Windows operations
  async getFocusWindows(userId: string, orgId: string): Promise<any[]> {
    const windows = await prisma.palFocusWindow.findMany({
      where: { userId, orgId },
      orderBy: [
        { weekday: 'asc' },
        { startHour: 'asc' },
      ],
    });

    return windows.map(w => ({
      id: w.id,
      user_id: w.userId,
      org_id: w.orgId,
      weekday: w.weekday,
      start_hour: w.startHour,
      end_hour: w.endHour,
      created_at: w.createdAt,
    }));
  }

  async addFocusWindow(userId: string, orgId: string, weekday: number, startHour: number, endHour: number): Promise<number> {
    const window = await prisma.palFocusWindow.create({
      data: {
        userId,
        orgId,
        weekday,
        startHour,
        endHour,
      },
    });

    return window.id;
  }

  // Event operations
  async recordEvent(event: PalEventInput): Promise<number> {
    const palEvent = await prisma.palEvent.create({
      data: {
        userId: event.userId,
        orgId: event.orgId,
        eventType: event.eventType,
        payload: event.payload || {},
        detectedStressLevel: event.detectedStressLevel != null ? Number(event.detectedStressLevel) : null,
      },
    });

    return palEvent.id;
  }

  async getRecentEvents(userId: string, orgId: string, limit: number = 20): Promise<any[]> {
    const events = await prisma.palEvent.findMany({
      where: { userId, orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events.map(e => ({
      id: e.id,
      user_id: e.userId,
      org_id: e.orgId,
      event_type: e.eventType,
      payload: e.payload,
      detected_stress_level: e.detectedStressLevel,
      created_at: e.createdAt,
    }));
  }

  async getEventsByType(userId: string, orgId: string, eventType: string, limit: number = 10): Promise<any[]> {
    const events = await prisma.palEvent.findMany({
      where: { userId, orgId, eventType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events.map(e => ({
      id: e.id,
      user_id: e.userId,
      org_id: e.orgId,
      event_type: e.eventType,
      payload: e.payload,
      detected_stress_level: e.detectedStressLevel,
      created_at: e.createdAt,
    }));
  }

  async getStressLevelDistribution(userId: string, orgId: string, hoursBack: number = 24): Promise<any[]> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const events = await prisma.palEvent.groupBy({
      by: ['detectedStressLevel'],
      where: {
        userId,
        orgId,
        detectedStressLevel: { not: null },
        createdAt: { gte: since },
      },
      _count: {
        detectedStressLevel: true,
      },
    });

    return events.map(e => ({
      detected_stress_level: e.detectedStressLevel,
      count: e._count.detectedStressLevel,
    }));
  }
}
