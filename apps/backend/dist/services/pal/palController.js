import { Router } from 'express';
import { PalRepository } from './palRepository.js';
export const palRouter = Router();
const palRepo = new PalRepository();
// Record an event
palRouter.post('/event', async (req, res) => {
    try {
        const event = req.body;
        if (!event.userId || !event.orgId || !event.eventType) {
            return res.status(400).json({
                error: 'Missing required fields: userId, orgId, eventType',
            });
        }
        const eventId = await palRepo.recordEvent(event);
        res.json({
            success: true,
            eventId,
        });
    }
    catch (error) {
        console.error('PAL event error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get recommendations
palRouter.get('/recommendations', async (req, res) => {
    try {
        const { userId, orgId } = req.query;
        if (!userId || !orgId) {
            return res.status(400).json({
                error: 'Missing required query params: userId, orgId',
            });
        }
        // Get user profile
        let profile = await palRepo.getUserProfile(userId, orgId);
        if (!profile) {
            // Create default profile
            await palRepo.createUserProfile(userId, orgId);
            profile = await palRepo.getUserProfile(userId, orgId);
        }
        // Get focus windows
        const focusWindows = await palRepo.getFocusWindows(userId, orgId);
        // Get recent events
        const recentEvents = await palRepo.getRecentEvents(userId, orgId, 10);
        // Get stress level distribution
        const stressDistribution = await palRepo.getStressLevelDistribution(userId, orgId, 24);
        // Simple heuristic: if high stress events in last 24h, suggest muting
        const highStressEntry = stressDistribution.find((d) => d.detected_stress_level >= 7);
        const highStressCount = highStressEntry?.count || 0;
        const boardAdjustments = [];
        const reminders = [];
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
        const currentFocusWindow = focusWindows.find((fw) => fw.weekday === currentWeekday &&
            fw.start_hour <= currentHour &&
            fw.end_hour > currentHour);
        if (currentFocusWindow) {
            boardAdjustments.push({
                actionType: 'isolate_widget_view',
                message: 'You\'re in a focus window. Showing only essential widgets.',
            });
        }
        // Add contextual reminders based on recent events
        const meetingEvents = recentEvents.filter((e) => e.event_type === 'meeting');
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
                preferenceTone: profile?.preference_tone || 'neutral',
            },
        });
    }
    catch (error) {
        console.error('PAL recommendations error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get user profile
palRouter.get('/profile', async (req, res) => {
    try {
        const { userId, orgId } = req.query;
        if (!userId || !orgId) {
            return res.status(400).json({
                error: 'Missing required query params: userId, orgId',
            });
        }
        let profile = await palRepo.getUserProfile(userId, orgId);
        if (!profile) {
            // Create default profile
            await palRepo.createUserProfile(userId, orgId);
            profile = await palRepo.getUserProfile(userId, orgId);
        }
        res.json({
            success: true,
            profile,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update user profile
palRouter.put('/profile', async (req, res) => {
    try {
        const { userId, orgId, preferenceTone } = req.body;
        if (!userId || !orgId || !preferenceTone) {
            return res.status(400).json({
                error: 'Missing required fields: userId, orgId, preferenceTone',
            });
        }
        await palRepo.updateUserProfile(userId, orgId, preferenceTone);
        res.json({
            success: true,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Add focus window
palRouter.post('/focus-window', async (req, res) => {
    try {
        const { userId, orgId, weekday, startHour, endHour } = req.body;
        if (!userId || !orgId || weekday === undefined || startHour === undefined || endHour === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: userId, orgId, weekday, startHour, endHour',
            });
        }
        const windowId = await palRepo.addFocusWindow(userId, orgId, weekday, startHour, endHour);
        res.json({
            success: true,
            windowId,
        });
    }
    catch (error) {
        console.error('Add focus window error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
