import React, { useState, useEffect } from 'react';
import './ApprovalQueue.css';

interface TaskApproval {
    id: string;
    taskId: string;
    taskType: string;
    description: string;
    riskLevel: 'safe' | 'medium' | 'high' | 'critical';
    requestedBy: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    expiresAt: string;
    metadata: Record<string, any>;
}

export const ApprovalQueue: React.FC = () => {
    const [approvals, setApprovals] = useState<TaskApproval[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedApproval, setSelectedApproval] = useState<TaskApproval | null>(null);

    useEffect(() => {
        fetchApprovals();
        const interval = setInterval(fetchApprovals, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [filter]);

    const fetchApprovals = async () => {
        try {
            const response = await fetch(`/api/approvals?status=${filter}`);
            const data = await response.json();
            setApprovals(data.approvals || []);
        } catch (error) {
            console.error('Failed to fetch approvals:', error);
        }
    };

    const handleApprove = async (approvalId: string) => {
        try {
            await fetch(`/api/approvals/${approvalId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy: 'current_user' }),
            });
            fetchApprovals();
            setSelectedApproval(null);
        } catch (error) {
            console.error('Failed to approve:', error);
        }
    };

    const handleReject = async (approvalId: string, reason: string) => {
        try {
            await fetch(`/api/approvals/${approvalId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectedBy: 'current_user', reason }),
            });
            fetchApprovals();
            setSelectedApproval(null);
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return '#d32f2f';
            case 'high': return '#f57c00';
            case 'medium': return '#fbc02d';
            case 'safe': return '#388e3c';
            default: return '#757575';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'safe': return '✅';
            default: return '❓';
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date().getTime();
        const expires = new Date(expiresAt).getTime();
        const remaining = expires - now;

        if (remaining < 0) return 'Expired';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="approval-queue">
            <div className="approval-header">
                <h2>Approval Queue</h2>
                <div className="approval-filters">
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({approvals.filter(a => a.status === 'pending').length})
                    </button>
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === 'approved' ? 'active' : ''}
                        onClick={() => setFilter('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={filter === 'rejected' ? 'active' : ''}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected
                    </button>
                </div>
            </div>

            <div className="approval-list">
                {approvals.length === 0 ? (
                    <div className="empty-state">
                        <p>No approvals {filter !== 'all' ? filter : 'found'}</p>
                    </div>
                ) : (
                    approvals.map(approval => (
                        <div
                            key={approval.id}
                            className={`approval-card ${approval.status}`}
                            onClick={() => setSelectedApproval(approval)}
                        >
                            <div className="approval-card-header">
                                <span className="risk-badge" style={{ background: getRiskColor(approval.riskLevel) }}>
                                    {getRiskIcon(approval.riskLevel)} {approval.riskLevel.toUpperCase()}
                                </span>
                                <span className="task-type">{approval.taskType}</span>
                            </div>

                            <div className="approval-card-body">
                                <h3>{approval.description}</h3>
                                <div className="approval-meta">
                                    <span>👤 {approval.requestedBy}</span>
                                    <span>🕐 {new Date(approval.requestedAt).toLocaleString()}</span>
                                    {approval.status === 'pending' && (
                                        <span className="time-remaining">
                                            ⏰ {getTimeRemaining(approval.expiresAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {approval.status === 'pending' && (
                                <div className="approval-actions">
                                    <button
                                        className="approve-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprove(approval.id);
                                        }}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const reason = prompt('Rejection reason:');
                                            if (reason) handleReject(approval.id, reason);
                                        }}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {selectedApproval && (
                <div className="approval-modal" onClick={() => setSelectedApproval(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Approval Details</h2>
                            <button className="close-btn" onClick={() => setSelectedApproval(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-row">
                                <strong>Task ID:</strong>
                                <span>{selectedApproval.taskId}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Type:</strong>
                                <span>{selectedApproval.taskType}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Risk Level:</strong>
                                <span style={{ color: getRiskColor(selectedApproval.riskLevel) }}>
                                    {getRiskIcon(selectedApproval.riskLevel)} {selectedApproval.riskLevel.toUpperCase()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <strong>Description:</strong>
                                <p>{selectedApproval.description}</p>
                            </div>
                            <div className="detail-row">
                                <strong>Requested By:</strong>
                                <span>{selectedApproval.requestedBy}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Requested At:</strong>
                                <span>{new Date(selectedApproval.requestedAt).toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Status:</strong>
                                <span className={`status-badge ${selectedApproval.status}`}>
                                    {selectedApproval.status.toUpperCase()}
                                </span>
                            </div>

                            {Object.keys(selectedApproval.metadata).length > 0 && (
                                <div className="detail-row">
                                    <strong>Metadata:</strong>
                                    <pre>{JSON.stringify(selectedApproval.metadata, null, 2)}</pre>
                                </div>
                            )}
                        </div>

                        {selectedApproval.status === 'pending' && (
                            <div className="modal-actions">
                                <button
                                    className="approve-btn"
                                    onClick={() => handleApprove(selectedApproval.id)}
                                >
                                    ✅ Approve
                                </button>
                                <button
                                    className="reject-btn"
                                    onClick={() => {
                                        const reason = prompt('Rejection reason:');
                                        if (reason) handleReject(selectedApproval.id, reason);
                                    }}
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
