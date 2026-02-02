import React from 'react';
import { Mail, Play, Square, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';

interface EmailScannerTabProps {
    status: {
        isRunning: boolean;
        isScanning: boolean;
        lastScanTime: string | null;
        totalProcessed: number;
        lastError: string | null;
        counts: { processed: number; failed: number; duplicate: number };
    };
    logs: any[];
    logsTotal: number;
    onClearLogs: () => void;
    onViewCandidate: (candidateId: string) => void;
}

const EmailScannerTab: React.FC<EmailScannerTabProps> = ({ status, logs, logsTotal, onClearLogs, onViewCandidate }) => {
    return (
        <div style={{ overflowX: 'auto' }}>
            {/* Connected Email Info */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Mail size={16} style={{ color: '#3B82F6' }} />
                Connected: <strong style={{ color: 'var(--text-primary)' }}>{import.meta.env.VITE_IMAP_USER || 'hackathoninterviewsystem@gmail.com'}</strong>
                {status.isScanning && <span style={{ marginLeft: 'auto', color: '#3B82F6', fontWeight: 600 }}>Scanning...</span>}
            </div>

            {/* Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: status.isRunning ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)', borderRadius: '0.5rem' }}>
                        {status.isRunning ? <Play size={20} style={{ color: '#10B981' }} /> : <Square size={20} style={{ color: '#6B7280' }} />}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto-Scan</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: status.isRunning ? '#10B981' : 'var(--text-primary)' }}>
                            {status.isRunning ? 'Running' : 'Stopped'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Last Scan: {status.lastScanTime ? new Date(status.lastScanTime).toLocaleTimeString() : (logs.length > 0 ? new Date(logs[0].processedAt || logs[0].createdAt).toLocaleTimeString() : 'Never')}
                        </div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem' }}>
                        <CheckCircle size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Processed</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{status.counts.processed}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                        <AlertCircle size={20} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duplicates</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{status.counts.duplicate}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                        <X size={20} style={{ color: '#EF4444' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Failed</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{status.counts.failed}</div>
                    </div>
                </div>
            </div>

            {status.lastError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', color: '#EF4444', fontSize: '0.875rem' }}>
                    Last error: {status.lastError}
                </div>
            )}

            {/* Logs Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                        Processed Email Logs {logsTotal > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({logsTotal})</span>}
                    </h2>
                    {logs.length > 0 && (
                        <button
                            onClick={onClearLogs}
                            style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    )}
                </div>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <Mail size={48} style={{ color: 'var(--text-secondary)', opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>
                            No emails scanned yet. Click "Scan Now" to scan your inbox for resumes.
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-container" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>From</th>
                                    <th style={{ padding: '0.75rem' }}>Subject</th>
                                    <th style={{ padding: '0.75rem' }}>Attachment</th>
                                    <th style={{ padding: '0.75rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem' }}>Candidate</th>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: any) => {
                                    // Parse "Name <email@example.com>" format
                                    const fromStr = log.from || '';
                                    let name = log.fromName || 'Unknown';
                                    let email = log.fromEmail || '';

                                    if (fromStr && !log.fromName) {
                                        const match = fromStr.match(/^(.*?)\s*<(.*?)>$/);
                                        if (match) {
                                            name = match[1].trim() || 'No Name';
                                            email = match[2].trim();
                                        } else {
                                            name = fromStr;
                                        }
                                    }

                                    return (
                                        <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 500 }}>{name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.subject}</td>
                                            <td style={{ padding: '0.75rem' }}>{log.attachmentName || 'None'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: log.status === 'processed' ? 'rgba(16, 185, 129, 0.1)' : log.status === 'duplicate' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: log.status === 'processed' ? '#10B981' : log.status === 'duplicate' ? '#F59E0B' : '#EF4444'
                                                }}>
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {log.candidateId ? (
                                                    <button
                                                        onClick={() => onViewCandidate(log.candidateId._id || log.candidateId)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--primary)',
                                                            padding: 0,
                                                            cursor: 'pointer',
                                                            fontWeight: 500,
                                                            textDecoration: 'underline'
                                                        }}
                                                    >
                                                        {log.candidateId.name || 'View Candidate'}
                                                    </button>
                                                ) : (
                                                    log.candidateName || '-'
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(log.processedAt || log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailScannerTab;
