// AgentTeam – Phase 2 Week 5-6
// Role-based agent coordination system
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { hybridSearchEngine } from './HybridSearchEngine.js';
import { emotionAwareDecisionEngine } from './EmotionAwareDecisionEngine.js';
import { unifiedGraphRAG } from './UnifiedGraphRAG.js';
import { stateGraphRouter } from './StateGraphRouter.js';
import { projectMemory } from '../../services/project/ProjectMemory.js';
/**
 * Data Agent - Handles data ingestion, transformation, and quality
 */
class DataAgent {
    constructor() {
        this.role = 'data';
        this.tasksCompleted = 0;
        this.lastActivity = new Date();
    }
    canHandle(message) {
        return message.type === 'query' && (message.content.includes('data') ||
            message.content.includes('ingest') ||
            message.content.includes('transform') ||
            message.content.includes('quality'));
    }
    async execute(message) {
        console.log(`📊 [DataAgent] Processing: ${message.content}`);
        this.lastActivity = new Date();
        this.tasksCompleted++;
        // Use HybridSearchEngine to find relevant data
        const searchResults = await hybridSearchEngine.search(message.content, {
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default',
            limit: 10,
            timestamp: new Date()
        });
        return {
            role: this.role,
            result: {
                dataFound: searchResults.length,
                sources: searchResults.map(r => ({
                    source: r.source,
                    relevance: r.score
                })),
                quality: this.assessDataQuality(searchResults)
            }
        };
    }
    assessDataQuality(searchResults) {
        // Simple quality assessment
        const avgScore = searchResults.results.reduce((sum, r) => sum + r.score, 0) / searchResults.results.length || 0;
        return {
            completeness: Math.min(1.0, searchResults.results.length / 10),
            freshness: avgScore,
            reliability: avgScore * 0.9
        };
    }
    async getStatus() {
        return {
            role: this.role,
            active: true,
            tasksCompleted: this.tasksCompleted,
            lastActivity: this.lastActivity,
            capabilities: ['data_ingestion', 'data_quality', 'data_transformation']
        };
    }
}
/**
 * Security Agent - Handles security checks, threat detection, and compliance
 */
class SecurityAgent {
    constructor() {
        this.role = 'security';
        this.tasksCompleted = 0;
        this.lastActivity = new Date();
    }
    canHandle(message) {
        return message.type === 'query' && (message.content.includes('security') ||
            message.content.includes('threat') ||
            message.content.includes('compliance') ||
            message.content.includes('vulnerability')) || message.type === 'alert';
    }
    async execute(message) {
        console.log(`🔒 [SecurityAgent] Processing: ${message.content}`);
        this.lastActivity = new Date();
        this.tasksCompleted++;
        // Use EmotionAwareDecisionEngine for security decisions
        const decision = await emotionAwareDecisionEngine.makeDecision(message.content, {
            orgId: message.metadata?.orgId || 'default',
            userId: message.metadata?.userId || 'system',
            boardId: message.metadata?.boardId
        });
        return {
            role: this.role,
            result: {
                threatLevel: this.assessThreatLevel(message.content),
                decision: decision,
                recommendations: this.generateSecurityRecommendations(message.content)
            }
        };
    }
    assessThreatLevel(content) {
        const threatKeywords = ['vulnerability', 'breach', 'attack', 'malware', 'exploit'];
        const found = threatKeywords.filter(kw => content.toLowerCase().includes(kw)).length;
        if (found >= 2)
            return 'high';
        if (found >= 1)
            return 'medium';
        return 'low';
    }
    generateSecurityRecommendations(content) {
        const recommendations = [];
        if (content.includes('vulnerability')) {
            recommendations.push('Run security scan');
            recommendations.push('Review access controls');
        }
        if (content.includes('compliance')) {
            recommendations.push('Verify GDPR compliance');
            recommendations.push('Check data retention policies');
        }
        return recommendations;
    }
    async getStatus() {
        return {
            role: this.role,
            active: true,
            tasksCompleted: this.tasksCompleted,
            lastActivity: this.lastActivity,
            capabilities: ['threat_detection', 'compliance_check', 'security_scan']
        };
    }
}
/**
 * Memory Agent - Handles memory operations, retrieval, and consolidation
 */
class MemoryAgent {
    constructor() {
        this.role = 'memory';
        this.tasksCompleted = 0;
        this.lastActivity = new Date();
    }
    canHandle(message) {
        return message.type === 'query' && (message.content.includes('memory') ||
            message.content.includes('remember') ||
            message.content.includes('recall') ||
            message.content.includes('forget'));
    }
    async execute(message) {
        console.log(`🧠 [MemoryAgent] Processing: ${message.content}`);
        this.lastActivity = new Date();
        this.tasksCompleted++;
        // Use UnifiedMemorySystem for memory operations
        const memory = await unifiedMemorySystem.getWorkingMemory({
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default'
        });
        // Use GraphRAG for memory retrieval
        const graphResult = await unifiedGraphRAG.query(message.content, {
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default'
        });
        return {
            role: this.role,
            result: {
                workingMemory: memory,
                graphContext: graphResult,
                consolidation: await this.consolidateMemory(memory)
            }
        };
    }
    async consolidateMemory(memory) {
        return {
            patterns: memory.recentPatterns?.length || 0,
            features: memory.recentFeatures?.length || 0,
            events: memory.recentEvents?.length || 0
        };
    }
    async getStatus() {
        return {
            role: this.role,
            active: true,
            tasksCompleted: this.tasksCompleted,
            lastActivity: this.lastActivity,
            capabilities: ['memory_retrieval', 'memory_consolidation', 'pattern_detection']
        };
    }
}
/**
 * PAL Agent - Personal Assistant, Life Coach, Strategic & Political Advisor, Compensation Expert
 * Inspired by CgentCore's L1 Director Agent architecture
 */
class PalAgent {
    constructor() {
        this.role = 'pal';
        this.conversationHistory = [];
    }
    canHandle(message) {
        const content = message.content.toLowerCase();
        return message.type === 'query' && (
        // Personal Assistant
        content.includes('assistant') ||
            content.includes('help me') ||
            content.includes('remind') ||
            content.includes('schedule') ||
            // Coach
            content.includes('coach') ||
            content.includes('advice') ||
            content.includes('guidance') ||
            content.includes('improve') ||
            // Strategic
            content.includes('strategy') ||
            content.includes('strategic') ||
            content.includes('planning') ||
            content.includes('roadmap') ||
            // Political
            content.includes('political') ||
            content.includes('politics') ||
            content.includes('policy') ||
            content.includes('stakeholder') ||
            // Compensation
            content.includes('salary') ||
            content.includes('compensation') ||
            content.includes('gage') ||
            content.includes('pay') ||
            content.includes('bonus') ||
            // Personal/workflow
            content.includes('workflow') ||
            content.includes('optimize') ||
            content.includes('personal') ||
            content.includes('preference') ||
            content.includes('emotional'));
    }
    async execute(message) {
        console.log(`👤 [PalAgent] Processing: ${message.content}`);
        // Store conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message.content,
            timestamp: new Date()
        });
        // Determine agent mode based on content
        const mode = this.determineMode(message.content);
        // Use EmotionAwareDecisionEngine for personal decisions
        const decision = await emotionAwareDecisionEngine.makeDecision(message.content, {
            orgId: message.metadata?.orgId || 'default',
            userId: message.metadata?.userId || 'system',
            boardId: message.metadata?.boardId
        });
        // Route to specialized handler
        let result;
        switch (mode) {
            case 'coach':
                result = await this.handleCoach(message, decision);
                break;
            case 'strategic':
                result = await this.handleStrategic(message, decision);
                break;
            case 'political':
                result = await this.handlePolitical(message, decision);
                break;
            case 'compensation':
                result = await this.handleCompensation(message, decision);
                break;
            case 'assistant':
            default:
                result = await this.handleAssistant(message, decision);
                break;
        }
        // Store agent response
        this.conversationHistory.push({
            role: 'assistant',
            content: JSON.stringify(result),
            timestamp: new Date()
        });
        return {
            role: this.role,
            mode,
            result,
            emotionalState: decision.emotionalState,
            confidence: decision.confidence
        };
    }
    /**
     * Determine agent mode from message content
     */
    determineMode(content) {
        const lower = content.toLowerCase();
        if (lower.includes('coach') || lower.includes('guidance') || lower.includes('improve')) {
            return 'coach';
        }
        if (lower.includes('strategy') || lower.includes('strategic') || lower.includes('planning')) {
            return 'strategic';
        }
        if (lower.includes('political') || lower.includes('politics') || lower.includes('policy') || lower.includes('stakeholder')) {
            return 'political';
        }
        if (lower.includes('salary') || lower.includes('compensation') || lower.includes('gage') || lower.includes('pay') || lower.includes('bonus')) {
            return 'compensation';
        }
        return 'assistant';
    }
    /**
     * Personal Assistant Mode - Task management, reminders, scheduling
     */
    async handleAssistant(message, decision) {
        console.log('  📋 [PalAgent] Assistant mode');
        // Use UnifiedMemorySystem to recall user preferences
        const memory = await unifiedMemorySystem.getWorkingMemory({
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default'
        });
        return {
            type: 'assistant',
            response: this.generateAssistantResponse(message.content),
            recommendations: this.generateWorkflowRecommendations(message.content),
            context: {
                recentPatterns: memory.recentPatterns?.slice(0, 3) || [],
                preferences: memory.recentFeatures?.slice(0, 3) || []
            },
            nextActions: [
                'Review your calendar for conflicts',
                'Check pending tasks',
                'Update preferences based on feedback'
            ]
        };
    }
    /**
     * Coach Mode - Personal development, guidance, improvement
     */
    async handleCoach(message, decision) {
        console.log('  🎯 [PalAgent] Coach mode');
        // Use GraphRAG to find related coaching insights
        const graphResult = await unifiedGraphRAG.query(`Coaching advice: ${message.content}`, {
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default'
        });
        return {
            type: 'coach',
            guidance: this.generateCoachingGuidance(message.content, decision),
            insights: graphResult.nodes.slice(0, 3).map((n) => ({
                insight: n.content,
                confidence: n.score
            })),
            actionPlan: [
                'Identify specific goals',
                'Break down into actionable steps',
                'Set measurable milestones',
                'Schedule regular check-ins'
            ],
            emotionalSupport: {
                currentState: decision.emotionalState,
                recommendations: this.getEmotionalRecommendations(decision.emotionalState)
            }
        };
    }
    /**
     * Strategic Advisor Mode - Strategic planning, roadmaps, business strategy
     */
    async handleStrategic(message, decision) {
        console.log('  🎲 [PalAgent] Strategic advisor mode');
        // Use StateGraphRouter for strategic planning workflow
        const state = stateGraphRouter.initState(`strategic-${Date.now()}`, message.content);
        let currentState = state;
        let iterations = 0;
        while (currentState.status === 'active' && iterations < 5) {
            currentState = await stateGraphRouter.route(currentState);
            iterations++;
        }
        return {
            type: 'strategic',
            analysis: this.generateStrategicAnalysis(message.content),
            roadmap: currentState.scratchpad.plan || [],
            recommendations: [
                'Define clear objectives',
                'Identify key stakeholders',
                'Assess risks and opportunities',
                'Create timeline with milestones',
                'Establish success metrics'
            ],
            considerations: {
                risks: ['Resource constraints', 'Timeline pressure', 'Stakeholder alignment'],
                opportunities: ['Market timing', 'Competitive advantage', 'Innovation potential'],
                dependencies: ['Team capacity', 'Technology readiness', 'Budget approval']
            },
            planningState: currentState.scratchpad
        };
    }
    /**
     * Political Advisor Mode - Stakeholder management, organizational politics
     */
    async handlePolitical(message, decision) {
        console.log('  🏛️ [PalAgent] Political advisor mode');
        return {
            type: 'political',
            analysis: this.generatePoliticalAnalysis(message.content),
            stakeholderMap: [
                { role: 'Champion', influence: 'high', support: 'positive' },
                { role: 'Decision Maker', influence: 'high', support: 'neutral' },
                { role: 'Influencer', influence: 'medium', support: 'positive' }
            ],
            recommendations: [
                'Identify key decision makers',
                'Build coalition of supporters',
                'Address concerns proactively',
                'Communicate value proposition clearly',
                'Timing is critical - choose right moment'
            ],
            tactics: {
                communication: 'Tailor message to audience',
                timing: 'Align with organizational cycles',
                relationships: 'Leverage existing networks',
                framing: 'Position as win-win solution'
            },
            warnings: [
                'Avoid creating unnecessary opposition',
                'Respect organizational hierarchy',
                'Be transparent about intentions'
            ]
        };
    }
    /**
     * Compensation Expert Mode - Salary, benefits, negotiation
     */
    async handleCompensation(message, decision) {
        console.log('  💰 [PalAgent] Compensation expert mode');
        // Use HybridSearchEngine to find market data
        const searchResults = await hybridSearchEngine.search(`compensation ${message.content}`, {
            userId: message.metadata?.userId || 'system',
            orgId: message.metadata?.orgId || 'default',
            limit: 5,
            timestamp: new Date()
        });
        return {
            type: 'compensation',
            analysis: this.generateCompensationAnalysis(message.content),
            marketData: {
                sources: searchResults.slice(0, 3).map((r) => ({
                    source: r.source,
                    relevance: r.score
                })),
                note: 'Market data should be verified from multiple sources'
            },
            recommendations: [
                'Research market rates for your role and location',
                'Consider total compensation package (salary + benefits)',
                'Document your achievements and value',
                'Prepare negotiation strategy',
                'Know your walk-away point'
            ],
            negotiationTips: [
                'Focus on value delivered, not just time served',
                'Use data to support your request',
                'Consider non-monetary benefits',
                'Practice your pitch',
                'Be prepared to negotiate'
            ],
            factors: {
                baseSalary: 'Foundation of compensation',
                bonuses: 'Variable compensation',
                equity: 'Long-term value',
                benefits: 'Health, retirement, etc.',
                perks: 'Flexibility, development, etc.'
            }
        };
    }
    generateAssistantResponse(content) {
        if (content.includes('remind')) {
            return 'I can help you set reminders. What would you like to be reminded about?';
        }
        if (content.includes('schedule')) {
            return 'I can help you manage your schedule. What would you like to schedule?';
        }
        return 'How can I assist you today?';
    }
    generateCoachingGuidance(content, decision) {
        return `Based on your current emotional state (${decision.emotionalState}), I recommend focusing on clear, achievable goals. Let's break down your challenge into manageable steps.`;
    }
    generateStrategicAnalysis(content) {
        return 'Strategic analysis requires understanding objectives, constraints, and opportunities. Let me help you develop a comprehensive strategy.';
    }
    generatePoliticalAnalysis(content) {
        return 'Organizational politics require careful navigation. Key factors: stakeholder interests, power dynamics, and timing.';
    }
    generateCompensationAnalysis(content) {
        return 'Compensation analysis should consider market rates, your value proposition, and total package (salary + benefits + equity).';
    }
    getEmotionalRecommendations(emotionalState) {
        const recommendations = {
            'positive': ['Maintain momentum', 'Set stretch goals', 'Share success'],
            'neutral': ['Focus on growth', 'Seek feedback', 'Plan next steps'],
            'negative': ['Take breaks', 'Seek support', 'Reframe challenges', 'Celebrate small wins']
        };
        return recommendations[emotionalState] || recommendations['neutral'];
    }
    generateWorkflowRecommendations(content) {
        const recommendations = [];
        if (content.includes('optimize')) {
            recommendations.push('Review recent task patterns');
            recommendations.push('Identify bottlenecks');
            recommendations.push('Automate repetitive tasks');
        }
        if (content.includes('workflow')) {
            recommendations.push('Analyze user preferences');
            recommendations.push('Suggest workflow improvements');
            recommendations.push('Implement time-blocking');
        }
        return recommendations;
    }
    async getStatus() {
        return {
            role: this.role,
            active: true,
            tasksCompleted: this.conversationHistory.filter(m => m.role === 'assistant').length,
            lastActivity: this.conversationHistory.length > 0
                ? this.conversationHistory[this.conversationHistory.length - 1].timestamp
                : new Date(),
            capabilities: [
                'personal_assistant',
                'life_coach',
                'strategic_advisor',
                'political_advisor',
                'compensation_expert',
                'workflow_optimization',
                'emotional_awareness',
                'conversation_history'
            ]
        };
    }
    /**
     * Get conversation history
     */
    getConversationHistory() {
        return this.conversationHistory.slice(-20); // Last 20 messages
    }
}
/**
 * Orchestrator Agent - Coordinates other agents and manages task flow
 */
class OrchestratorAgent {
    constructor() {
        this.role = 'orchestrator';
        this.messageHistory = [];
    }
    canHandle(message) {
        return message.type === 'coordinate' || message.to === 'orchestrator';
    }
    async execute(message) {
        console.log(`🎯 [OrchestratorAgent] Coordinating: ${message.content}`);
        this.messageHistory.push(message);
        // Use StateGraphRouter for complex coordination
        const state = stateGraphRouter.initState(`coord-${Date.now()}`, message.content);
        let currentState = state;
        let iterations = 0;
        while (currentState.status === 'active' && iterations < 10) {
            currentState = await stateGraphRouter.route(currentState);
            iterations++;
        }
        return {
            role: this.role,
            result: {
                coordination: {
                    state: currentState.status,
                    path: currentState.history,
                    iterations
                },
                messageHistory: this.messageHistory.slice(-10)
            }
        };
    }
    async getStatus() {
        return {
            role: this.role,
            active: true,
            tasksCompleted: this.messageHistory.length,
            lastActivity: new Date(),
            capabilities: ['coordination', 'task_routing', 'agent_management']
        };
    }
}
/**
 * AgentTeam - Coordinates role-based agents
 */
export class AgentTeam {
    constructor() {
        this.agents = new Map();
        this.messageQueue = [];
        this.coordinationHistory = [];
        // Initialize all agents
        this.agents.set('data', new DataAgent());
        this.agents.set('security', new SecurityAgent());
        this.agents.set('memory', new MemoryAgent());
        this.agents.set('pal', new PalAgent());
        this.agents.set('orchestrator', new OrchestratorAgent());
        console.log('👥 [AgentTeam] Initialized with 5 role-based agents');
    }
    /**
     * Route message to appropriate agent(s)
     */
    async routeMessage(message) {
        console.log(`📨 [AgentTeam] Routing message from ${message.from} to ${message.to}`);
        // If message is to orchestrator, handle directly
        if (message.to === 'orchestrator') {
            const orchestrator = this.agents.get('orchestrator');
            if (orchestrator) {
                return await orchestrator.execute(message);
            }
        }
        // If message is to 'all', broadcast
        if (message.to === 'all') {
            const results = [];
            for (const [role, agent] of this.agents.entries()) {
                if (agent.canHandle(message)) {
                    const result = await agent.execute(message);
                    results.push(result);
                }
            }
            return { results, broadcast: true };
        }
        // Route to specific agent
        const targetAgent = this.agents.get(message.to);
        if (!targetAgent) {
            throw new Error(`Agent ${message.to} not found`);
        }
        if (!targetAgent.canHandle(message)) {
            // Try to find alternative agent
            for (const [role, agent] of this.agents.entries()) {
                if (agent.canHandle(message)) {
                    console.log(`🔄 [AgentTeam] Rerouting from ${message.to} to ${role}`);
                    return await agent.execute(message);
                }
            }
            throw new Error(`No agent can handle message: ${message.content}`);
        }
        return await targetAgent.execute(message);
    }
    /**
     * Coordinate multiple agents for complex task
     */
    async coordinate(task, context) {
        const coordinationMessage = {
            from: 'orchestrator',
            to: 'all',
            type: 'coordinate',
            content: task,
            metadata: context,
            timestamp: new Date()
        };
        this.coordinationHistory.push(coordinationMessage);
        // Use orchestrator to coordinate
        const orchestrator = this.agents.get('orchestrator');
        if (orchestrator) {
            const result = await orchestrator.execute(coordinationMessage);
            // Log to ProjectMemory
            projectMemory.logLifecycleEvent({
                eventType: 'other',
                status: 'success',
                details: {
                    component: 'AgentTeam',
                    action: 'coordination',
                    task,
                    agentsInvolved: this.agents.size,
                    timestamp: new Date().toISOString()
                }
            });
            return result;
        }
        throw new Error('Orchestrator agent not available');
    }
    /**
     * Get status of all agents
     */
    async getAllStatuses() {
        const statuses = [];
        for (const [role, agent] of this.agents.entries()) {
            const status = await agent.getStatus();
            statuses.push(status);
        }
        return statuses;
    }
    /**
     * Get agent by role
     */
    getAgent(role) {
        return this.agents.get(role);
    }
}
export const agentTeam = new AgentTeam();
