import { EventEmitter } from 'events';

export type EventType = 'system.alert' | 'security.alert' | 'agent.decision' | 'agent.log';

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

    onEvent(type: EventType | '*', listener: (event: BaseEvent) => void) {
        this.on(type, listener);
    }
}

export const eventBus = new MCPEventBus();
