import type { Email, User } from '../types';

/**
 * Defines a map of all possible MCP events and their corresponding payload types.
 * This interface is the single source of truth for event-driven communication.
 *
 * For events with no payload, use `void`.
 */
export interface McpEventMap {
    'EmailSelected': Email;
    'UserLoggedIn': User;
    'WidgetResized': { widgetId: string; newWidth: number; newHeight: number };
    'DashboardReset': void; // Example of an event with no payload
    'ShowNotification': NotificationPayload;
    'UndoRemoveWidget': { widget: any };
    'TriggerUndo': void;
    'TriggerRedo': void;
}

export interface NotificationPayload {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
    duration?: number;
    undoAction?: {
        eventName: string;
        payload: any;
    };
}