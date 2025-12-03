/**
 * Neural Chat - Agent Communication System
 * 
 * DUAL-LAYER ARCHITECTURE:
 * 
 * 1. BLACKBOARD (Async/File-based)
 *    - Handovers between agents
 *    - Formal task assignments
 *    - Works when agents are offline
 *    - Location: DropZone/agents/[agent]/inbox
 * 
 * 2. NEURAL CHAT (Sync/Neo4j-based)
 *    - Real-time discussions
 *    - Quick questions
 *    - Status updates
 *    - Persisted in Neo4j graph
 * 
 * 3. CAPABILITY BROKER
 *    - Agents expose their strengths
 *    - Cross-agent task delegation
 *    - Smart routing based on capability match
 */

export { neuralChatRouter } from './ChatController.js';
export { neuralChatService } from './ChatService.js';
export { capabilityBroker, AGENT_CAPABILITIES } from './CapabilityBroker.js';
export { approvalGate } from './ApprovalGate.js';
export * from './types.js';
export type { AgentCapability, CapabilityRequest, CapabilityResponse } from './AgentCapabilities.js';
export type { ApprovalResult, ApprovalDecision } from './ApprovalGate.js';
