import React, { useState } from 'react';
import { AlertTriangle, Shield, UserX, Eye, Camera, Phone, User, CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FraudAlert {
    _id: string;
    candidateId: { _id: string; name: string; email: string; phone?: string; domain?: string; status?: string } | null;
    matchedCandidateId: { _id: string; name: string; email: string; phone?: string; domain?: string; status?: string } | null;
    interviewId?: string;
    alertType: 'duplicate_phone' | 'duplicate_name' | 'face_match' | 'proxy_detected' | 'face_inconsistency';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: {
        faceDistance?: number;
        phoneMatch?: string;
        nameSimilarity?: number;
        matchedName?: string;
        matchedEmail?: string;
        description?: string;
    };
    status: 'pending' | 'reviewed' | 'confirmed_fraud' | 'dismissed';
    reviewedBy?: { name: string; email: string } | null;
    reviewNotes?: string;
    createdAt: string;
}

interface FraudStats {
    total: number;
    pending: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
}

interface FraudDetectionPanelProps {
    alerts: FraudAlert[];
    stats: FraudStats;
    totalAlerts: number;
    page: number;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    onUpdateAlert: (id: string, status: string, reviewNotes?: string) => void;
    onDeleteAlert: (id: string) => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626', border: '#DC2626' },
    high: { bg: 'rgba(234, 88, 12, 0.1)', text: '#EA580C', border: '#EA580C' },
    medium: { bg: 'rgba(202, 138, 4, 0.1)', text: '#CA8A04', border: '#CA8A04' },
    low: { bg: 'rgba(22, 163, 74, 0.1)', text: '#16A34A', border: '#16A34A' },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
    duplicate_phone: 'Duplicate Phone',
    duplicate_name: 'Similar Name',
    face_match: 'Face Match',
    proxy_detected: 'Proxy Detected',
    face_inconsistency: 'Face Inconsistency',
};

const ALERT_TYPE_ICONS: Record<string, React.ReactNode> = {
    duplicate_phone: <Phone size={16} />,
    duplicate_name: <User size={16} />,
    face_match: <Camera size={16} />,
    proxy_detected: <UserX size={16} />,
    face_inconsistency: <Eye size={16} />,
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'rgba(234, 179, 8, 0.1)', text: '#CA8A04' },
    reviewed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
    confirmed_fraud: { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' },
    dismissed: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
};

const FraudDetectionPanel: React.FC<FraudDetectionPanelProps> = ({
    alerts,
    stats,
    totalAlerts,
    page,
    onPageChange,
    onRefresh,
    onUpdateAlert,
    onDeleteAlert,
}) => {
    const [filterType, setFilterType] = useState<string>('');
    const [filterSeverity, setFilterSeverity] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [reviewModal, setReviewModal] = useState<FraudAlert | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');

    const totalPages = Math.ceil(totalAlerts / 20);

    const filteredAlerts = alerts.filter(a => {
        if (filterType && a.alertType !== filterType) return false;
        if (filterSeverity && a.severity !== filterSeverity) return false;
        if (filterStatus && a.status !== filterStatus) return false;
        return true;
    });

    const handleAction = (alertId: string, action: string) => {
        onUpdateAlert(alertId, action);
    };

    return (
        <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '0.5rem' }}>
                        <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Alerts</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '0.5rem' }}>
                        <Shield size={20} style={{ color: '#CA8A04' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending Review</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#CA8A04' }}>{stats.pending}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '0.5rem' }}>
                        <Camera size={20} style={{ color: '#DC2626' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Face Matches</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{(stats.byType?.face_match || 0) + (stats.byType?.proxy_detected || 0)}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem' }}>
                        <UserX size={20} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Proxy Detections</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.byType?.proxy_detected || 0}</div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', fontSize: '0.875rem'
                    }}
                >
                    <option value="">All Types</option>
                    <option value="duplicate_phone">Duplicate Phone</option>
                    <option value="duplicate_name">Similar Name</option>
                    <option value="face_match">Face Match</option>
                    <option value="proxy_detected">Proxy Detected</option>
                    <option value="face_inconsistency">Face Inconsistency</option>
                </select>

                <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', fontSize: '0.875rem'
                    }}
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', fontSize: '0.875rem'
                    }}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="confirmed_fraud">Confirmed Fraud</option>
                    <option value="dismissed">Dismissed</option>
                </select>

                <button
                    onClick={onRefresh}
                    className="btn"
                    style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                    Refresh
                </button>
            </div>

            {/* Alerts Table */}
            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Severity</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Candidate</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Matched With</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAlerts.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No fraud alerts found.
                                </td>
                            </tr>
                        ) : filteredAlerts.map(alert => {
                            const sevColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low;
                            const statColor = STATUS_COLORS[alert.status] || STATUS_COLORS.pending;

                            return (
                                <tr key={alert._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '9999px',
                                            fontSize: '0.75rem', fontWeight: '600',
                                            backgroundColor: sevColor.bg, color: sevColor.text,
                                            border: `1px solid ${sevColor.border}`, textTransform: 'uppercase'
                                        }}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                            {ALERT_TYPE_ICONS[alert.alertType]}
                                            <span>{ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {alert.candidateId ? (
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{alert.candidateId.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.candidateId.email}</div>
                                            </div>
                                        ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {alert.matchedCandidateId ? (
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{alert.matchedCandidateId.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.matchedCandidateId.email}</div>
                                            </div>
                                        ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem', maxWidth: '250px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                            {alert.details?.description || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem',
                                            fontSize: '0.75rem', fontWeight: '500',
                                            backgroundColor: statColor.bg, color: statColor.text
                                        }}>
                                            {alert.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {new Date(alert.createdAt).toLocaleDateString()}<br/>
                                        {new Date(alert.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                            {alert.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => { setReviewModal(alert); setReviewNotes(''); }}
                                                        title="Review"
                                                        style={{
                                                            padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-card)', cursor: 'pointer', color: '#3B82F6'
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(alert._id, 'dismissed')}
                                                        title="Dismiss"
                                                        style={{
                                                            padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-card)', cursor: 'pointer', color: '#6B7280'
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(alert._id, 'confirmed_fraud')}
                                                        title="Confirm Fraud"
                                                        style={{
                                                            padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid #DC2626',
                                                            background: 'rgba(220, 38, 38, 0.1)', cursor: 'pointer', color: '#DC2626'
                                                        }}
                                                    >
                                                        <UserX size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {alert.status !== 'pending' && (
                                                <button
                                                    onClick={() => onDeleteAlert(alert._id)}
                                                    title="Delete"
                                                    style={{
                                                        padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-card)', cursor: 'pointer', color: '#EF4444'
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        style={{
                            padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                            opacity: page <= 1 ? 0.5 : 1, color: 'var(--text-primary)'
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        style={{
                            padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: page >= totalPages ? 0.5 : 1, color: 'var(--text-primary)'
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }} onClick={() => setReviewModal(null)}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '0.75rem', padding: '2rem',
                        maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Review Alert</h3>

                        {/* Alert Summary */}
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                    backgroundColor: SEVERITY_COLORS[reviewModal.severity]?.bg,
                                    color: SEVERITY_COLORS[reviewModal.severity]?.text,
                                    border: `1px solid ${SEVERITY_COLORS[reviewModal.severity]?.border}`,
                                    textTransform: 'uppercase'
                                }}>
                                    {reviewModal.severity}
                                </span>
                                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {ALERT_TYPE_LABELS[reviewModal.alertType]}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {reviewModal.details?.description}
                            </p>
                        </div>

                        {/* Side-by-side candidate comparison */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>CANDIDATE</div>
                                {reviewModal.candidateId ? (
                                    <>
                                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{reviewModal.candidateId.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.candidateId.email}</div>
                                        {reviewModal.candidateId.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.candidateId.phone}</div>}
                                        {reviewModal.candidateId.domain && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.candidateId.domain}</div>}
                                    </>
                                ) : <span style={{ color: 'var(--text-secondary)' }}>N/A</span>}
                            </div>
                            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>MATCHED WITH</div>
                                {reviewModal.matchedCandidateId ? (
                                    <>
                                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{reviewModal.matchedCandidateId.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.matchedCandidateId.email}</div>
                                        {reviewModal.matchedCandidateId.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.matchedCandidateId.phone}</div>}
                                        {reviewModal.matchedCandidateId.domain && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reviewModal.matchedCandidateId.domain}</div>}
                                    </>
                                ) : <span style={{ color: 'var(--text-secondary)' }}>N/A</span>}
                            </div>
                        </div>

                        {/* Review Notes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Review Notes
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                placeholder="Add notes about your review decision..."
                                style={{
                                    width: '100%', minHeight: '80px', padding: '0.75rem',
                                    border: '1px solid var(--border-color)', borderRadius: '0.375rem',
                                    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    resize: 'vertical', fontSize: '0.875rem', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setReviewModal(null)}
                                className="btn"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onUpdateAlert(reviewModal._id, 'dismissed', reviewNotes);
                                    setReviewModal(null);
                                }}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)', cursor: 'pointer', color: '#6B7280', fontWeight: '500'
                                }}
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    onUpdateAlert(reviewModal._id, 'reviewed', reviewNotes);
                                    setReviewModal(null);
                                }}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none',
                                    background: '#3B82F6', cursor: 'pointer', color: 'white', fontWeight: '500'
                                }}
                            >
                                <CheckCircle size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                Mark Reviewed
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('This will block the candidate. Are you sure?')) {
                                        onUpdateAlert(reviewModal._id, 'confirmed_fraud', reviewNotes);
                                        setReviewModal(null);
                                    }
                                }}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none',
                                    background: '#DC2626', cursor: 'pointer', color: 'white', fontWeight: '500'
                                }}
                            >
                                <UserX size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                Confirm Fraud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudDetectionPanel;
