import { Router } from 'express';
import { PalRepository } from './palRepository.js';
import { PalEventInput, PalBoardAction } from '@widget-tdc/mcp-types';

export const palRouter = Router();
const palRepo = new PalRepository();

// Record an event
palRouter.post('/event', (req, res) => {
  try {
    const event: PalEventInput = req.body;
    
    if (!event.userId || !event.orgId || !event.eventType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, orgId, eventType',
      });
    }

    const eventId = palRepo.recordEvent(event);
    
    res.json({
      success: true,
      eventId,
    });
  } catch (error: any) {
    console.error('PAL event error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get recommendations
palRouter.get('/recommendations', (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        error: 'Missing required query params: userId, orgId',
      });
    }

    // Get user profile
    let profile = palRepo.getUserProfile(userId as string, orgId as string);
    if (!profile) {
      // Create default profile
      palRepo.createUserProfile(userId as string, orgId as string);
      profile = palRepo.getUserProfile(userId as string, orgId as string);
    }

    // Get focus windows
    const focusWindows = palRepo.getFocusWindows(userId as string, orgId as string);
    
    // Get recent events
    const recentEvents = palRepo.getRecentEvents(userId as string, orgId as string, 10);
    
    // Get stress level distribution
    const stressDistribution = palRepo.getStressLevelDistribution(userId as string, orgId as string, 24);

    // Simple heuristic: if high stress events in last 24h, suggest muting
    const highStressCount = stressDistribution.find((d: any) => d.detected_stress_level === 'high')?.count || 0;
    
    const boardAdjustments: PalBoardAction[] = [];
    const reminders: string[] = [];

    if (highStressCount > 3) {
      boardAdjustments.push({
        actionType: 'mute_notifications',
        message: 'You seem stressed. Would you like to mute notifications for the next hour?',
      });
    }

    // Check current time against focus windows
    const now = new Date();
    const currentWeekday = now.getDay() || 7; // Sunday = 7
    const currentHour = now.getHours();
    
    const currentFocusWindow = focusWindows.find((fw: any) => 
      fw.weekday === currentWeekday && 
      fw.start_hour <= currentHour && 
      fw.end_hour > currentHour
    );

    if (currentFocusWindow) {
      boardAdjustments.push({
        actionType: 'isolate_widget_view',
        message: 'You\'re in a focus window. Showing only essential widgets.',
      });
    }

    // Add contextual reminders based on recent events
    const meetingEvents = recentEvents.filter((e: any) => e.event_type === 'meeting');
    if (meetingEvents.length > 5) {
      reminders.push('You have many meetings scheduled. Consider blocking focus time.');
    }

    res.json({
      success: true,
      userId,
      orgId,
      boardAdjustments,
      reminders,
      focusWindow: currentFocusWindow || null,
      profile: {
        preferenceTone: profile.preference_tone,
      },
    });
  } catch (error: any) {
    console.error('PAL recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user profile
palRouter.get('/profile', (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        error: 'Missing required query params: userId, orgId',
      });
    }

    let profile = palRepo.getUserProfile(userId as string, orgId as string);
    
    if (!profile) {
      // Create default profile
      palRepo.createUserProfile(userId as string, orgId as string);
      profile = palRepo.getUserProfile(userId as string, orgId as string);
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update user profile
palRouter.put('/profile', (req, res) => {
  try {
    const { userId, orgId, preferenceTone } = req.body;
    
    if (!userId || !orgId || !preferenceTone) {
      return res.status(400).json({
        error: 'Missing required fields: userId, orgId, preferenceTone',
      });
    }

    palRepo.updateUserProfile(userId, orgId, preferenceTone);
    
    res.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add focus window
palRouter.post('/focus-window', (req, res) => {
  try {
    const { userId, orgId, weekday, startHour, endHour } = req.body;
    
    if (!userId || !orgId || weekday === undefined || startHour === undefined || endHour === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: userId, orgId, weekday, startHour, endHour',
      });
    }

    const windowId = palRepo.addFocusWindow(userId, orgId, weekday, startHour, endHour);
    
    res.json({
      success: true,
      windowId,
    });
  } catch (error: any) {
    console.error('Add focus window error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
