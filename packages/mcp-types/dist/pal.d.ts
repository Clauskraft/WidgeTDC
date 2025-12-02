export interface PalEventInput {
    userId: string;
    orgId: string;
    eventType: string;
    payload: any;
    detectedStressLevel?: 'low' | 'medium' | 'high';
}
export interface PalBoardAction {
    actionType: 'isolate_widget_view' | 'mute_notifications' | 'show_nudge';
    targetWidgetIds?: string[];
    message?: string;
}
export interface PalRecommendationsResponse {
    userId: string;
    orgId: string;
    boardAdjustments: PalBoardAction[];
    reminders: string[];
    focusWindow?: {
        weekday: number;
        startHour: number;
        endHour: number;
    };
}
export interface PalProfileUpdateInput {
    userId: string;
    orgId: string;
    preferenceTone: 'neutral' | 'friendly' | 'professional';
}
