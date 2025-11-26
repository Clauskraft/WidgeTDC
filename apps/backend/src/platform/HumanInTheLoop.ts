/**
 * Human-in-the-Loop (HITL) System
 * Approval workflow for autonomous operations
 */

export type RiskLevel = 'safe' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface TaskApproval {
    id: string;
    taskId: string;
    taskType: string;
    description: string;
    riskLevel: RiskLevel;
    requestedBy: string;
    requestedAt: Date;
    status: ApprovalStatus;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    expiresAt: Date;
    metadata: Record<string, any>;
}

export interface ApprovalRule {
    taskType: string;
    riskLevel: RiskLevel;
    requiresApproval: boolean;
    approvers: string[];
    timeout: number; // milliseconds
}

export class HumanInTheLoopSystem {
    private approvalQueue: Map<string, TaskApproval> = new Map();
    private approvalRules: Map<string, ApprovalRule> = new Map();
    private auditTrail: TaskApproval[] = [];
    private killSwitchActive: boolean = false;
    private notificationCallbacks: Set<(approval: TaskApproval) => void> = new Set();

    constructor() {
        this.initializeDefaultRules();
        this.startExpirationChecker();
    }

    /**
     * Initialize default approval rules
     */
    private initializeDefaultRules(): void {
        const defaultRules: ApprovalRule[] = [
            {
                taskType: 'data_deletion',
                riskLevel: 'critical',
                requiresApproval: true,
                approvers: ['admin'],
                timeout: 24 * 60 * 60 * 1000, // 24 hours
            },
            {
                taskType: 'external_api_call',
                riskLevel: 'high',
                requiresApproval: true,
                approvers: ['admin', 'supervisor'],
                timeout: 4 * 60 * 60 * 1000, // 4 hours
            },
            {
                taskType: 'data_modification',
                riskLevel: 'medium',
                requiresApproval: true,
                approvers: ['admin', 'supervisor', 'user'],
                timeout: 2 * 60 * 60 * 1000, // 2 hours
            },
            {
                taskType: 'read_operation',
                riskLevel: 'safe',
                requiresApproval: false,
                approvers: [],
                timeout: 0,
            },
        ];

        defaultRules.forEach(rule => {
            this.approvalRules.set(rule.taskType, rule);
        });
    }

    /**
     * Classify task risk level
     */
    classifyRisk(taskType: string, taskData: any): RiskLevel {
        // Check if task type has predefined risk
        const rule = this.approvalRules.get(taskType);
        if (rule) {
            return rule.riskLevel;
        }

        // Heuristic-based classification
        const riskFactors = {
            hasExternalCall: taskData.externalCall ? 2 : 0,
            hasDataModification: taskData.modifiesData ? 2 : 0,
            hasDataDeletion: taskData.deletesData ? 3 : 0,
            affectsMultipleUsers: taskData.userCount > 10 ? 1 : 0,
            hasCost: taskData.estimatedCost > 100 ? 1 : 0,
        };

        const totalRisk = Object.values(riskFactors).reduce((sum, val) => sum + val, 0);

        if (totalRisk >= 6) return 'critical';
        if (totalRisk >= 4) return 'high';
        if (totalRisk >= 2) return 'medium';
        return 'safe';
    }

    /**
     * Request approval for a task
     */
    async requestApproval(
        taskId: string,
        taskType: string,
        description: string,
        requestedBy: string,
        metadata: Record<string, any> = {}
    ): Promise<TaskApproval> {
        // Check kill switch
        if (this.killSwitchActive) {
            throw new Error('Kill switch is active - all autonomous operations are disabled');
        }

        // Classify risk
        const riskLevel = this.classifyRisk(taskType, metadata);

        // Check if approval is required
        const rule = this.approvalRules.get(taskType);
        if (!rule?.requiresApproval && riskLevel === 'safe') {
            // Auto-approve safe tasks
            return this.createAutoApprovedTask(taskId, taskType, description, requestedBy, metadata);
        }

        // Create approval request
        const approval: TaskApproval = {
            id: this.generateId(),
            taskId,
            taskType,
            description,
            riskLevel,
            requestedBy,
            requestedAt: new Date(),
            status: 'pending',
            expiresAt: new Date(Date.now() + (rule?.timeout || 60 * 60 * 1000)),
            metadata,
        };

        this.approvalQueue.set(approval.id, approval);
        this.auditTrail.push(approval);

        // Notify approvers
        this.notifyApprovers(approval);

        console.log(`📋 Approval requested: ${approval.id} (${riskLevel})`);
        return approval;
    }

    /**
     * Approve a task
     */
    async approve(approvalId: string, approvedBy: string, reason?: string): Promise<TaskApproval> {
        const approval = this.approvalQueue.get(approvalId);
        if (!approval) {
            throw new Error(`Approval ${approvalId} not found`);
        }

        if (approval.status !== 'pending') {
            throw new Error(`Approval ${approvalId} is already ${approval.status}`);
        }

        if (new Date() > approval.expiresAt) {
            approval.status = 'expired';
            throw new Error(`Approval ${approvalId} has expired`);
        }

        // Check if approver is authorized
        const rule = this.approvalRules.get(approval.taskType);
        if (rule && !rule.approvers.includes(approvedBy)) {
            throw new Error(`${approvedBy} is not authorized to approve ${approval.taskType}`);
        }

        approval.status = 'approved';
        approval.approvedBy = approvedBy;
        approval.approvedAt = new Date();

        this.approvalQueue.delete(approvalId);
        console.log(`✅ Approval granted: ${approvalId} by ${approvedBy}`);

        return approval;
    }

    /**
     * Reject a task
     */
    async reject(approvalId: string, rejectedBy: string, reason: string): Promise<TaskApproval> {
        const approval = this.approvalQueue.get(approvalId);
        if (!approval) {
            throw new Error(`Approval ${approvalId} not found`);
        }

        if (approval.status !== 'pending') {
            throw new Error(`Approval ${approvalId} is already ${approval.status}`);
        }

        approval.status = 'rejected';
        approval.approvedBy = rejectedBy;
        approval.approvedAt = new Date();
        approval.rejectionReason = reason;

        this.approvalQueue.delete(approvalId);
        console.log(`❌ Approval rejected: ${approvalId} by ${rejectedBy}`);

        return approval;
    }

    /**
     * Get pending approvals
     */
    getPendingApprovals(approver?: string): TaskApproval[] {
        const pending = Array.from(this.approvalQueue.values());

        if (!approver) return pending;

        return pending.filter(approval => {
            const rule = this.approvalRules.get(approval.taskType);
            return rule?.approvers.includes(approver);
        });
    }

    /**
     * Get approval by ID
     */
    getApproval(approvalId: string): TaskApproval | undefined {
        return this.approvalQueue.get(approvalId) ||
            this.auditTrail.find(a => a.id === approvalId);
    }

    /**
     * Get audit trail
     */
    getAuditTrail(filters?: {
        taskType?: string;
        riskLevel?: RiskLevel;
        status?: ApprovalStatus;
        since?: Date;
    }): TaskApproval[] {
        let trail = this.auditTrail;

        if (filters) {
            if (filters.taskType) {
                trail = trail.filter(a => a.taskType === filters.taskType);
            }
            if (filters.riskLevel) {
                trail = trail.filter(a => a.riskLevel === filters.riskLevel);
            }
            if (filters.status) {
                trail = trail.filter(a => a.status === filters.status);
            }
            if (filters.since) {
                trail = trail.filter(a => a.requestedAt >= filters.since!);
            }
        }

        return trail;
    }

    /**
     * Activate kill switch
     */
    activateKillSwitch(activatedBy: string, reason: string): void {
        this.killSwitchActive = true;
        console.log(`🚨 KILL SWITCH ACTIVATED by ${activatedBy}: ${reason}`);

        // Reject all pending approvals
        Array.from(this.approvalQueue.values()).forEach(approval => {
            this.reject(approval.id, 'system', `Kill switch activated: ${reason}`);
        });
    }

    /**
     * Deactivate kill switch
     */
    deactivateKillSwitch(deactivatedBy: string): void {
        this.killSwitchActive = false;
        console.log(`✅ Kill switch deactivated by ${deactivatedBy}`);
    }

    /**
     * Check if kill switch is active
     */
    isKillSwitchActive(): boolean {
        return this.killSwitchActive;
    }

    /**
     * Subscribe to approval notifications
     */
    onApprovalRequest(callback: (approval: TaskApproval) => void): () => void {
        this.notificationCallbacks.add(callback);
        return () => this.notificationCallbacks.delete(callback);
    }

    /**
     * Notify approvers
     */
    private notifyApprovers(approval: TaskApproval): void {
        this.notificationCallbacks.forEach(callback => {
            try {
                callback(approval);
            } catch (error) {
                console.error('Notification callback error:', error);
            }
        });
    }

    /**
     * Create auto-approved task
     */
    private createAutoApprovedTask(
        taskId: string,
        taskType: string,
        description: string,
        requestedBy: string,
        metadata: Record<string, any>
    ): TaskApproval {
        const approval: TaskApproval = {
            id: this.generateId(),
            taskId,
            taskType,
            description,
            riskLevel: 'safe',
            requestedBy,
            requestedAt: new Date(),
            status: 'approved',
            approvedBy: 'system',
            approvedAt: new Date(),
            expiresAt: new Date(Date.now() + 1000),
            metadata,
        };

        this.auditTrail.push(approval);
        return approval;
    }

    /**
     * Start expiration checker
     */
    private startExpirationChecker(): void {
        setInterval(() => {
            const now = new Date();
            Array.from(this.approvalQueue.values()).forEach(approval => {
                if (now > approval.expiresAt && approval.status === 'pending') {
                    approval.status = 'expired';
                    this.approvalQueue.delete(approval.id);
                    console.log(`⏰ Approval expired: ${approval.id}`);
                }
            });
        }, 60 * 1000); // Check every minute
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        totalRequests: number;
        pending: number;
        approved: number;
        rejected: number;
        expired: number;
        byRiskLevel: Record<RiskLevel, number>;
    } {
        const stats = {
            totalRequests: this.auditTrail.length,
            pending: 0,
            approved: 0,
            rejected: 0,
            expired: 0,
            byRiskLevel: {
                safe: 0,
                medium: 0,
                high: 0,
                critical: 0,
            } as Record<RiskLevel, number>,
        };

        this.auditTrail.forEach(approval => {
            stats[approval.status]++;
            stats.byRiskLevel[approval.riskLevel]++;
        });

        stats.pending = this.approvalQueue.size;

        return stats;
    }

    private generateId(): string {
        return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const hitlSystem = new HumanInTheLoopSystem();
