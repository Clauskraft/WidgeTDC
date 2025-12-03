/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    AGENT CAPABILITY REGISTRY                              ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Hver agent registrerer sine evner - andre kan kalde dem                  ║
 * ║                                                                           ║
 * ║  ARKITEKTUR:                                                              ║
 * ║  ┌─────────────────────────────────────────────────────────────────┐     ║
 * ║  │                      COMMUNICATION LAYERS                        │     ║
 * ║  ├─────────────────────────────────────────────────────────────────┤     ║
 * ║  │  BLACKBOARD (Async)          │  NEURAL CHAT (Sync)              │     ║
 * ║  │  • Handovers                 │  • Real-time discussion          │     ║
 * ║  │  • Formal tasks              │  • Quick questions               │     ║
 * ║  │  • Offline messages          │  • Status updates                │     ║
 * ║  │  • File: DropZone/agents/    │  • Neo4j persistence             │     ║
 * ║  ├─────────────────────────────────────────────────────────────────┤     ║
 * ║  │                    CAPABILITY LAYER                              │     ║
 * ║  │  • invoke_capability(agent, capability, params)                  │     ║
 * ║  │  • Agents expose their strengths as callable functions           │     ║
 * ║  └─────────────────────────────────────────────────────────────────┘     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { AgentId } from './types.js';

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    agent: AgentId;
    category: 'code' | 'research' | 'analysis' | 'creative' | 'integration' | 'decision';
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    costEstimate?: 'low' | 'medium' | 'high';  // Token/tid cost
    reliability?: number;  // 0-1 score
}

export interface CapabilityRequest {
    requestId: string;
    fromAgent: AgentId;
    toAgent: AgentId;
    capability: string;
    params: Record<string, any>;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timestamp: string;
    deadline?: string;
}

export interface CapabilityResponse {
    requestId: string;
    success: boolean;
    result?: any;
    error?: string;
    executionTimeMs?: number;
    timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT CAPABILITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const AGENT_CAPABILITIES: Record<AgentId, AgentCapability[]> = {
    claude: [
        {
            id: 'claude.architecture',
            name: 'System Architecture Design',
            description: 'Design complex system architectures, API designs, database schemas',
            agent: 'claude',
            category: 'code',
            costEstimate: 'medium',
            reliability: 0.95
        },
        {
            id: 'claude.code_review',
            name: 'Deep Code Review',
            description: 'Thorough code review with security, performance, and maintainability focus',
            agent: 'claude',
            category: 'analysis',
            costEstimate: 'medium',
            reliability: 0.9
        },
        {
            id: 'claude.mcp_tools',
            name: 'MCP Tool Execution',
            description: 'Execute MCP tools, file operations, Neo4j queries',
            agent: 'claude',
            category: 'integration',
            costEstimate: 'low',
            reliability: 0.98
        },
        {
            id: 'claude.refactor',
            name: 'Code Refactoring',
            description: 'Refactor code for better structure, readability, and performance',
            agent: 'claude',
            category: 'code',
            costEstimate: 'high',
            reliability: 0.85
        }
    ],
    
    'claude-cli': [
        {
            id: 'claude-cli.terminal',
            name: 'Terminal Command Execution',
            description: 'Execute shell commands, scripts, build processes directly',
            agent: 'claude-cli',
            category: 'integration',
            costEstimate: 'low',
            reliability: 0.95
        },
        {
            id: 'claude-cli.git',
            name: 'Git Operations',
            description: 'Git commits, branches, merges, conflict resolution',
            agent: 'claude-cli',
            category: 'integration',
            costEstimate: 'low',
            reliability: 0.9
        },
        {
            id: 'claude-cli.rapid_prototype',
            name: 'Rapid Prototyping',
            description: 'Quick file creation, scaffolding, boilerplate generation',
            agent: 'claude-cli',
            category: 'code',
            costEstimate: 'low',
            reliability: 0.9
        },
        {
            id: 'claude-cli.build_test',
            name: 'Build & Test Automation',
            description: 'Run builds, tests, linting, type checking',
            agent: 'claude-cli',
            category: 'integration',
            costEstimate: 'low',
            reliability: 0.95
        }
    ],
    
    gemini: [
        {
            id: 'gemini.research',
            name: 'Deep Research',
            description: 'Comprehensive research with web search, document analysis',
            agent: 'gemini',
            category: 'research',
            costEstimate: 'medium',
            reliability: 0.9
        },
        {
            id: 'gemini.multimodal',
            name: 'Multimodal Analysis',
            description: 'Analyze images, diagrams, screenshots alongside text',
            agent: 'gemini',
            category: 'analysis',
            costEstimate: 'medium',
            reliability: 0.85
        },
        {
            id: 'gemini.large_context',
            name: 'Large Context Processing',
            description: 'Process very large documents or codebases (1M+ tokens)',
            agent: 'gemini',
            category: 'analysis',
            costEstimate: 'high',
            reliability: 0.8
        },
        {
            id: 'gemini.project_management',
            name: 'Project Management',
            description: 'Sprint planning, roadmap creation, task prioritization',
            agent: 'gemini',
            category: 'decision',
            costEstimate: 'low',
            reliability: 0.9
        }
    ],
    
    deepseek: [
        {
            id: 'deepseek.rapid_code',
            name: 'Rapid Code Generation',
            description: 'Fast code generation for well-defined tasks',
            agent: 'deepseek',
            category: 'code',
            costEstimate: 'low',
            reliability: 0.8
        },
        {
            id: 'deepseek.math',
            name: 'Mathematical Analysis',
            description: 'Complex mathematical computations and proofs',
            agent: 'deepseek',
            category: 'analysis',
            costEstimate: 'low',
            reliability: 0.9
        },
        {
            id: 'deepseek.tests',
            name: 'Test Generation',
            description: 'Generate unit tests, integration tests, test data',
            agent: 'deepseek',
            category: 'code',
            costEstimate: 'low',
            reliability: 0.85
        }
    ],
    
    clak: [
        {
            id: 'clak.decision',
            name: 'Executive Decision',
            description: 'Make final decisions on direction, priorities, approvals',
            agent: 'clak',
            category: 'decision',
            costEstimate: 'low',
            reliability: 1.0
        },
        {
            id: 'clak.domain_knowledge',
            name: 'Domain Knowledge',
            description: 'TDC Erhverv context, business requirements, user needs',
            agent: 'clak',
            category: 'research',
            costEstimate: 'low',
            reliability: 1.0
        },
        {
            id: 'clak.approval',
            name: 'Security/Deploy Approval',
            description: 'Approve sensitive operations, deployments, API keys',
            agent: 'clak',
            category: 'decision',
            costEstimate: 'low',
            reliability: 1.0
        }
    ],
    
    system: []  // System agent has no capabilities (it's infrastructure)
};
