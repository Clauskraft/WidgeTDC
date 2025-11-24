// Evolution Agent MCP types

export interface AgentRunReport {
  agentId: string;
  promptVersion: number;
  inputSummary: string;
  outputSummary: string;
  kpiName: string;
  kpiDelta: number;
  runContext: Record<string, any>;
}

export interface PromptVersionResponse {
  agentId: string;
  version: number;
  promptText: string;
  createdAt: string;
  createdBy: string;
}

export interface EvolutionEvaluation {
  agentId: string;
  currentVersion: number;
  needsRefinement: boolean;
  reason?: string;
  averageKpiDelta?: number;
}
