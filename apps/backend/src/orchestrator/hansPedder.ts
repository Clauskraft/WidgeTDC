// HansPedder orchestrator – central autonomous agent
import { AutonomousAgent, startAutonomousLearning } from '../mcp/autonomous/AutonomousAgent';
import { getCognitiveMemory } from '../mcp/memory/CognitiveMemory';
import { getFailureMemory } from '../mcp/memory/FailureMemory';
import { getSourceRegistry } from '../mcp/SourceRegistry';
import { getMcpRouter } from '../mcp/mcpRouter';

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
const cognitive = getCognitiveMemory();
const failure = getFailureMemory();
const sourceReg = getSourceRegistry();

// -------------------------------------------------------------------
// 4️⃣  Create the autonomous agent with the custom prompt
// -------------------------------------------------------------------
const hansPedder = new AutonomousAgent({
    cognitiveMemory: cognitive,
    failureMemory: failure,
    sourceRegistry: sourceReg,
    systemPrompt: HANS_PEDDER_PROMPT,
});

// -------------------------------------------------------------------
// 5️⃣  Export start function for the backend server
// -------------------------------------------------------------------
export async function startHansPedder() {
    // Ensure MCP router is ready (registers tools, etc.)
    await getMcpRouter(); // side‑effect only

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
