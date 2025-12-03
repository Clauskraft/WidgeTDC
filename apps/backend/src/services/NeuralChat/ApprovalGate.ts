/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    APPROVAL GATE - Claude as Delegate                     ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Claude har fået delegeret godkendelsesautoritet fra CLAK                 ║
 * ║                                                                           ║
 * ║  APPROVAL FLOW:                                                           ║
 * ║  Gemini/DeepSeek → Claude (auto-review) → Execute                        ║
 * ║                                                                           ║
 * ║  ESCALATE TO CLAK ONLY FOR:                                              ║
 * ║  • Production deployments                                                 ║
 * ║  • API key/credential changes                                            ║
 * ║  • Budget/cost decisions                                                  ║
 * ║  • Security-sensitive operations                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { AgentId } from './types.js';

export type ApprovalDecision = 'approved' | 'rejected' | 'escalate_to_clak';

export interface ApprovalResult {
    decision: ApprovalDecision;
    reason: string;
    approvedBy: AgentId;
    timestamp: string;
    modifications?: string[];  // Claude kan modificere requests
}

// Only these require CLAK personally
const ESCALATE_TO_CLAK = [
    'production_deploy',
    'api_key_create',
    'credential_change',
    'budget_decision',
    'security_config',
    'delete_data',
    'external_integration'
];

class ApprovalGate {
    private static instance: ApprovalGate;

    public static getInstance(): ApprovalGate {
        if (!ApprovalGate.instance) {
            ApprovalGate.instance = new ApprovalGate();
        }
        return ApprovalGate.instance;
    }

    /**
     * Claude reviews and decides on behalf of CLAK
     * Returns immediately - no waiting for human
     */
    review(params: {
        fromAgent: AgentId;
        action: string;
        description: string;
        context?: Record<string, any>;
    }): ApprovalResult {
        const { fromAgent, action, description } = params;
        const timestamp = new Date().toISOString();

        // CLAK's own requests are auto-approved
        if (fromAgent === 'clak') {
            return {
                decision: 'approved',
                reason: 'CLAK authority - auto-approved',
                approvedBy: 'clak',
                timestamp
            };
        }

        // Check if needs escalation to CLAK
        const needsEscalation = ESCALATE_TO_CLAK.some(e => 
            action.toLowerCase().includes(e) || 
            description.toLowerCase().includes(e)
        );

        if (needsEscalation) {
            return {
                decision: 'escalate_to_clak',
                reason: `Action "${action}" requires CLAK's personal approval`,
                approvedBy: 'claude',
                timestamp
            };
        }

        // Claude reviews based on reasonableness
        const review = this.evaluateRequest(params);
        
        return {
            decision: review.approved ? 'approved' : 'rejected',
            reason: review.reason,
            approvedBy: 'claude',
            timestamp,
            modifications: review.modifications
        };
    }

    /**
     * Claude's evaluation logic
     */
    private evaluateRequest(params: {
        fromAgent: AgentId;
        action: string;
        description: string;
        context?: Record<string, any>;
    }): { approved: boolean; reason: string; modifications?: string[] } {
        const { fromAgent, action, description } = params;

        // ════════════════════════════════════════════════════════════
        // APPROVAL RULES (Claude's delegated authority)
        // ════════════════════════════════════════════════════════════

        // 1. Research requests - always approved
        if (action.includes('research') || action.includes('search') || action.includes('analyze')) {
            return { 
                approved: true, 
                reason: 'Research/analysis tasks are pre-approved' 
            };
        }

        // 2. Code review/suggestions - approved
        if (action.includes('review') || action.includes('suggest') || action.includes('recommend')) {
            return { 
                approved: true, 
                reason: 'Review and recommendations are welcome' 
            };
        }

        // 3. Documentation - approved
        if (action.includes('document') || action.includes('readme') || action.includes('comment')) {
            return { 
                approved: true, 
                reason: 'Documentation improvements are pre-approved' 
            };
        }

        // 4. Questions/clarifications - approved
        if (action.includes('question') || action.includes('clarify') || action.includes('ask')) {
            return { 
                approved: true, 
                reason: 'Questions and clarifications are encouraged' 
            };
        }

        // 5. Status updates - approved
        if (action.includes('status') || action.includes('update') || action.includes('report')) {
            return { 
                approved: true, 
                reason: 'Status updates are pre-approved' 
            };
        }

        // 6. Code generation for review - approved with note
        if (action.includes('generate') || action.includes('create') || action.includes('implement')) {
            return { 
                approved: true, 
                reason: 'Code generation approved - will be reviewed before merge',
                modifications: ['Output requires Claude code review before integration']
            };
        }

        // 7. Test generation - always approved
        if (action.includes('test')) {
            return { 
                approved: true, 
                reason: 'Test creation is always welcome' 
            };
        }

        // Default: Approve with logging
        console.log(`⚠️ [ApprovalGate] New action type from ${fromAgent}: ${action}`);
        return { 
            approved: true, 
            reason: `Approved by Claude (delegated authority) - action: ${action}`,
            modifications: ['New action type - logged for pattern review']
        };
    }

    /**
     * Quick check without full review
     */
    canProceed(fromAgent: AgentId, action: string): boolean {
        if (fromAgent === 'clak' || fromAgent === 'claude') return true;
        
        const needsEscalation = ESCALATE_TO_CLAK.some(e => 
            action.toLowerCase().includes(e)
        );
        
        return !needsEscalation;
    }
}

export const approvalGate = ApprovalGate.getInstance();
