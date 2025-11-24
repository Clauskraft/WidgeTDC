
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

interface Checkpoint {
    id: string;
    state: AgentState;
    timestamp: Date;
    metadata?: any;
}

export class StateGraphRouter {
    private graphRag: UnifiedGraphRAG;
    private memory: UnifiedMemorySystem;
    private checkpoints: Map<string, Checkpoint> = new Map();

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
     * Save checkpoint for time-travel debugging
     */
    private saveCheckpoint(state: AgentState, metadata?: any): string {
        const checkpointId = `${state.id}-${Date.now()}`;
        this.checkpoints.set(checkpointId, {
            id: checkpointId,
            state: JSON.parse(JSON.stringify(state)), // Deep clone
            timestamp: new Date(),
            metadata
        });
        
        // Keep only last 50 checkpoints per task
        const taskCheckpoints = Array.from(this.checkpoints.entries())
            .filter(([_, cp]) => cp.state.id === state.id)
            .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime())
            .slice(50);
        
        this.checkpoints.clear();
        taskCheckpoints.forEach(([id, cp]) => this.checkpoints.set(id, cp));
        
        return checkpointId;
    }

    /**
     * Time-travel: restore to previous checkpoint
     */
    public async timeTravel(checkpointId: string): Promise<AgentState | null> {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint) {
            return null;
        }
        
        console.log(`⏪ [StateGraph] Time-traveling to checkpoint: ${checkpointId}`);
        return JSON.parse(JSON.stringify(checkpoint.state)); // Deep clone
    }

    /**
     * Get all checkpoints for a task
     */
    public getCheckpoints(taskId: string): Checkpoint[] {
        return Array.from(this.checkpoints.values())
            .filter(cp => cp.state.id === taskId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    /**
     * Route the state to the next node
     */
    public async route(state: AgentState): Promise<AgentState> {
        console.log(`🔄 [StateGraph] Routing from ${state.currentNode}...`);
        
        // Save checkpoint before routing
        this.saveCheckpoint(state, { action: 'before_routing', node: state.currentNode });
        
        // Update history
        if (state.history[state.history.length - 1] !== state.currentNode) {
            state.history.push(state.currentNode);
        }

        let newState: AgentState;
        
        switch (state.currentNode) {
            case 'router':
                newState = await this.handleRouterNode(state);
                break;
            
            case 'planner':
                newState = await this.handlePlannerNode(state);
                break;

            case 'researcher':
                newState = await this.handleResearcherNode(state);
                break;

            case 'reviewer':
                newState = await this.handleReviewerNode(state);
                break;

            case 'end':
                newState = state;
                break;

            default:
                console.error(`Unknown node: ${state.currentNode}`);
                state.status = 'failed';
                newState = state;
        }
        
        // Save checkpoint after routing
        this.saveCheckpoint(newState, { action: 'after_routing', node: newState.currentNode });
        
        return newState;
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

    /**
     * Planner Node: Break down complex tasks
     */
    private async handlePlannerNode(state: AgentState): Promise<AgentState> {
        console.log('  -> Planner: Analyzing task...');
        
        const lastMessage = state.messages[state.messages.length - 1].content;
        
        // Use GraphRAG to understand context and dependencies
        const ragResult = await this.graphRag.query(`Plan: ${lastMessage}`, {
            userId: 'system',
            orgId: 'default'
        });
        
        // Simple planning logic (can be enhanced with LLM)
        const plan = [
            `Step 1: Analyze requirements (confidence: ${ragResult.confidence.toFixed(2)})`,
            `Step 2: Identify dependencies (${ragResult.nodes.length} related concepts found)`,
            'Step 3: Execute plan',
            'Step 4: Review results'
        ];
        
        state.scratchpad.plan = plan;
        state.scratchpad.ragContext = ragResult;
        state.currentNode = 'researcher';
        
        return state;
    }

    /**
     * Researcher Node: Gather information
     */
    private async handleResearcherNode(state: AgentState): Promise<AgentState> {
        console.log('  -> Researcher: Gathering information...');
        
        const lastMessage = state.messages[state.messages.length - 1].content;
        
        // Use UnifiedMemorySystem to search for relevant information
        const searchResults = await this.memory.getWorkingMemory({
            userId: 'system',
            orgId: 'default'
        });
        
        state.scratchpad.research = {
            query: lastMessage,
            foundContext: searchResults.recentEvents?.slice(0, 5) || [],
            foundFeatures: searchResults.recentFeatures?.slice(0, 3) || []
        };
        
        state.currentNode = 'reviewer';
        return state;
    }

    /**
     * Reviewer Node: Validate and finalize
     */
    private async handleReviewerNode(state: AgentState): Promise<AgentState> {
        console.log('  -> Reviewer: Validating results...');
        
        // Simple validation (can be enhanced)
        const hasPlan = state.scratchpad.plan && state.scratchpad.plan.length > 0;
        const hasResearch = state.scratchpad.research;
        
        if (hasPlan && hasResearch) {
            state.status = 'completed';
            state.currentNode = 'end';
        } else {
            // If missing info, go back to researcher
            state.currentNode = 'researcher';
        }
        
        return state;
    }
}

export const stateGraphRouter = new StateGraphRouter();

