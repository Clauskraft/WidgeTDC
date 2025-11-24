import { EventEmitter } from 'events';

export type EventType = 
    | 'system.alert' 
    | 'security.alert' 
    | 'agent.decision' 
    | 'agent.log'
    | 'mcp.tool.executed'
    | 'autonomous.task.executed'
    | 'taskrecorder.suggestion.created'
    | 'taskrecorder.suggestion.approved'
    | 'taskrecorder.execution.started';

export interface BaseEvent {
    type: EventType;
    timestamp: string;
    source: string;
    payload: any;
}

class MCPEventBus extends EventEmitter {
    emitEvent(event: BaseEvent) {
        this.emit(event.type, event);
        this.emit('*', event); // Catch-all
    }

    // Direct emit for convenience (for non-BaseEvent objects)
    emit(type: EventType | '*', ...args: any[]): boolean {
        return super.emit(type, ...args);
    }

    onEvent(type: EventType | '*', listener: (event: BaseEvent | any) => void) {
        this.on(type, listener);
    }
}

export const eventBus = new MCPEventBus();
