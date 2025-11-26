import { Router } from 'express';
import { hitlSystem } from '../platform/HumanInTheLoop';

const router = Router();

/**
 * Get pending approvals
 */
router.get('/approvals', async (req, res) => {
    try {
        const { status, approver } = req.query;

        let approvals;
        if (status === 'pending') {
            approvals = hitlSystem.getPendingApprovals(approver as string);
        } else {
            const filters: any = {};
            if (status) filters.status = status;
            approvals = hitlSystem.getAuditTrail(filters);
        }

        res.json({ approvals });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Get approval by ID
 */
router.get('/approvals/:id', async (req, res) => {
    try {
        const approval = hitlSystem.getApproval(req.params.id);

        if (!approval) {
            return res.status(404).json({ error: 'Approval not found' });
        }

        res.json({ approval });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Request approval
 */
router.post('/approvals/request', async (req, res) => {
    try {
        const { taskId, taskType, description, requestedBy, metadata } = req.body;

        if (!taskId || !taskType || !description || !requestedBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const approval = await hitlSystem.requestApproval(
            taskId,
            taskType,
            description,
            requestedBy,
            metadata || {}
        );

        res.json({ approval });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Approve a task
 */
router.post('/approvals/:id/approve', async (req, res) => {
    try {
        const { approvedBy } = req.body;

        if (!approvedBy) {
            return res.status(400).json({ error: 'approvedBy is required' });
        }

        const approval = await hitlSystem.approve(req.params.id, approvedBy);
        res.json({ approval });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Reject a task
 */
router.post('/approvals/:id/reject', async (req, res) => {
    try {
        const { rejectedBy, reason } = req.body;

        if (!rejectedBy || !reason) {
            return res.status(400).json({ error: 'rejectedBy and reason are required' });
        }

        const approval = await hitlSystem.reject(req.params.id, rejectedBy, reason);
        res.json({ approval });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Get approval statistics
 */
router.get('/approvals/stats', async (req, res) => {
    try {
        const stats = hitlSystem.getStatistics();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Activate kill switch
 */
router.post('/kill-switch/activate', async (req, res) => {
    try {
        const { activatedBy, reason } = req.body;

        if (!activatedBy || !reason) {
            return res.status(400).json({ error: 'activatedBy and reason are required' });
        }

        hitlSystem.activateKillSwitch(activatedBy, reason);
        res.json({ success: true, message: 'Kill switch activated' });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Deactivate kill switch
 */
router.post('/kill-switch/deactivate', async (req, res) => {
    try {
        const { deactivatedBy } = req.body;

        if (!deactivatedBy) {
            return res.status(400).json({ error: 'deactivatedBy is required' });
        }

        hitlSystem.deactivateKillSwitch(deactivatedBy);
        res.json({ success: true, message: 'Kill switch deactivated' });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

/**
 * Get kill switch status
 */
router.get('/kill-switch/status', async (req, res) => {
    try {
        const active = hitlSystem.isKillSwitchActive();
        res.json({ active });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

export default router;
