// Project Memory MCP Tool Handlers
import { projectMemory } from '../services/project/ProjectMemory.js';
export async function projectMemoryLogEventHandler(params) {
    const event = {
        eventType: params.eventType || 'other',
        status: params.status || 'success',
        details: params.details || {}
    };
    projectMemory.logLifecycleEvent(event);
    return {
        success: true,
        message: `Event logged: ${event.eventType} - ${event.status}`
    };
}
export async function projectMemoryGetEventsHandler(params) {
    const limit = params.limit || 50;
    const events = projectMemory.getLifecycleEvents(limit);
    return {
        success: true,
        events,
        count: events.length
    };
}
export async function projectMemoryAddFeatureHandler(params) {
    const feature = {
        name: params.name,
        description: params.description || params.name,
        status: params.status || 'planned'
    };
    projectMemory.addFeature(feature);
    return {
        success: true,
        message: `Feature added: ${feature.name}`
    };
}
export async function projectMemoryUpdateFeatureHandler(params) {
    const { name, status } = params;
    if (!name || !status) {
        throw new Error('Missing required params: name, status');
    }
    projectMemory.updateFeatureStatus(name, status);
    return {
        success: true,
        message: `Feature updated: ${name} -> ${status}`
    };
}
export async function projectMemoryGetFeaturesHandler(params) {
    const features = projectMemory.getFeatures();
    return {
        success: true,
        features,
        count: features.length
    };
}
