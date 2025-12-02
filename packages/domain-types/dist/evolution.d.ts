export interface AgentPrompt {
    id: number;
    agentId: string;
    version: number;
    promptText: string;
    createdAt: Date;
    createdBy: string;
}
export interface AgentRun {
    id: number;
    agentId: string;
    promptVersion: number;
    inputSummary: string;
    outputSummary: string;
    kpiName: string;
    kpiDelta: number;
    runContext: Record<string, any>;
    createdAt: Date;
}
