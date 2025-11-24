
import { UnifiedGraphRAG, unifiedGraphRAG } from './UnifiedGraphRAG.js';
import { UnifiedMemorySystem, unifiedMemorySystem } from './UnifiedMemorySystem.js';

export type AgentNodeType = 'router' | 'planner' | 'researcher' | 'coder' | 'reviewer' | 'end';

export interface AgentState {
    id: string;
    messages: { role: string; content: string }[];
    context: any;
    currentNode: AgentNodeType;
    history: AgentNodeType[];
    scratchpad: any; // Shared working memory for agents
    status: 'active' | 'completed' | 'failed' | 'waiting';
}

export class StateGraphRouter {
    private graphRag: UnifiedGraphRAG;
    private memory: UnifiedMemorySystem;

    constructor() {
        this.graphRag = unifiedGraphRAG;
        this.memory = unifiedMemorySystem;
    }

    /**
     * Initialize a new state for a task
     */
    public initState(taskId: string, initialInput: string): AgentState {
        return {
            id: taskId,
            messages: [{ role: 'user', content: initialInput }],
            context: {},
            currentNode: 'router',
            history: [],
            scratchpad: {},
            status: 'active'
        };
    }

    /**
     * Route the state to the next node
     */
    public async route(state: AgentState): Promise<AgentState> {
        console.log(`🔄 [StateGraph] Routing from ${state.currentNode}...`);
        
        // Update history
        if (state.history[state.history.length - 1] !== state.currentNode) {
            state.history.push(state.currentNode);
        }

        switch (state.currentNode) {
            case 'router':
                return await this.handleRouterNode(state);
            
            case 'planner':
                // TODO: Implement Planner Agent logic
                console.log('  -> Planner (Mock)');
                state.scratchpad.plan = ['Step 1: Mock Plan'];
                state.currentNode = 'researcher';
                return state;

            case 'researcher':
                // TODO: Implement Researcher Agent logic
                console.log('  -> Researcher (Mock)');
                state.scratchpad.research = 'Found mock data';
                state.currentNode = 'reviewer';
                return state;

            case 'reviewer':
                // TODO: Implement Reviewer Agent logic
                console.log('  -> Reviewer (Mock)');
                state.currentNode = 'end';
                state.status = 'completed';
                return state;

            case 'end':
                return state;

            default:
                console.error(`Unknown node: ${state.currentNode}`);
                state.status = 'failed';
                return state;
        }
    }

    /**
     * Router Logic: Decides the initial path based on query complexity
     */
    private async handleRouterNode(state: AgentState): Promise<AgentState> {
        const lastMessage = state.messages[state.messages.length - 1].content;

        // 1. Use GraphRAG to understand context
        const ragResult = await this.graphRag.query(lastMessage, { 
            userId: 'system', 
            orgId: 'default' 
        });

        state.context.ragReasoning = ragResult;

        // 2. Heuristic routing (Will be replaced by LLM classifier later)
        if (ragResult.confidence < 0.3 || lastMessage.length > 100) {
            // Low confidence or complex query -> Needs Planning
            console.log('  -> Routing to Planner (Complex/Unknown)');
            state.currentNode = 'planner';
        } else {
            // High confidence -> Direct Research or Execution (Simplified)
            console.log('  -> Routing to Researcher (Simple)');
            state.currentNode = 'researcher';
        }

        return state;
    }
}

export const stateGraphRouter = new StateGraphRouter();

