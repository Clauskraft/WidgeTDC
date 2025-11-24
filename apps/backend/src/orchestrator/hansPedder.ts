// HansPedder orchestrator – central autonomous agent
import { AutonomousAgent, startAutonomousLearning } from '../mcp/autonomous/AutonomousAgent.js';
import { getCognitiveMemory } from '../mcp/memory/CognitiveMemory.js';
import { getSourceRegistry } from '../mcp/SourceRegistry.js';
import { mcpRouter } from '../mcp/mcpRouter.js';

// -------------------------------------------------------------------
// 1️⃣  System Prompt – tailor it for HansPedder
// -------------------------------------------------------------------
const HANS_PEDDER_PROMPT = `
You are **HansPedder**, the orchestrator of the WidgeTDC platform.
Your mission is to continuously improve the system by:
- Querying the CognitiveMemory for patterns and insights.
- Recording failures in FailureMemory and proposing mitigations.
- Selecting optimal data sources via the DecisionEngine.
- Broadcasting updates to all connected widgets through the MCP WebSocket.
When a knowledge gap or recurring failure is detected, automatically
trigger a new learning cycle using the AutonomousAgent.
Provide concise status messages to the user.
`;

// -------------------------------------------------------------------
// 2️⃣  Runtime status tracking (exposed via health endpoint)
// -------------------------------------------------------------------
export const hansPedderStatus = {
    active: false,
    startedAt: null as Date | null,
};

export function getHansPedderStatus() {
    return hansPedderStatus;
}

// -------------------------------------------------------------------
// 3️⃣  Initialise core components
// -------------------------------------------------------------------
// Note: These must be called AFTER database initialization
// We wrap the agent creation in the start function or a lazy getter

let hansPedder: AutonomousAgent | null = null;

// -------------------------------------------------------------------
// 5️⃣  Export start function for the backend server
// -------------------------------------------------------------------
export async function startHansPedder() {
    // Ensure dependencies are ready
    const cognitive = getCognitiveMemory();
    const sourceReg = getSourceRegistry();

    // Initialize agent if not already done
    if (!hansPedder) {
        hansPedder = new AutonomousAgent(cognitive, sourceReg);
        // TODO: Inject system prompt if supported in future versions
    }

    console.info('🚀 Starting HansPedder autonomous loop...');
    hansPedderStatus.active = true;
    hansPedderStatus.startedAt = new Date();
    await startAutonomousLearning(hansPedder);
}

// -------------------------------------------------------------------
// 6️⃣  If run directly (CLI), start immediately
// -------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
    startHansPedder().catch(err => {
        console.error('❌ HansPedder failed to start:', err);
        process.exit(1);
    });
}
