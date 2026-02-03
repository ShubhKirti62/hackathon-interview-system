import React, { useState, useEffect } from 'react';
import { X, Star, Mail, Phone, File, ExternalLink, Upload, Video, Calendar, Copy } from 'lucide-react';
import api from '../../../services/api';
import { API_ENDPOINTS } from '../../../services/endpoints';
import { showToast } from '../../../utils/toast';
import { formatCandidateStatus, getStatusColor, getStatusBackgroundColor } from '../../../utils/statusFormatter';
import type { Candidate } from '../../../pages/admin/types';

export const ViewCandidateModal: React.FC<{ candidate: Candidate, onClose: () => void, onSuccess: () => void, onInvite: () => void }> = ({ candidate, onClose, onSuccess, onInvite }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [remarks, setRemarks] = useState(candidate.remarks || '');
    const [activeTab, setActiveTab] = useState<'info' | 'resume' | 'interviews' | 'status'>('info');
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loadingInterviews, setLoadingInterviews] = useState(false);

    // Fetch interviews for this candidate
    useEffect(() => {
        const fetchInterviews = async () => {
            if (activeTab === 'interviews') {
                setLoadingInterviews(true);
                try {
                    const response = await api.get(`${API_ENDPOINTS.INTERVIEWS.BY_CANDIDATE}?candidateId=${candidate._id}`);
                    setInterviews(response.data);
                } catch (error) {
                    console.error('Failed to fetch interviews:', error);
                    showToast.error('Failed to fetch interviews');
                } finally {
                    setLoadingInterviews(false);
                }
            }
        };

        fetchInterviews();
    }, [activeTab, candidate._id]);

    const getNextPendingItem = (status: string) => {
        const s = status?.toLowerCase().replace(/_/g, ' ') || '';
        if (s.includes('profile submitted')) return 'Send Invitation Mail';
        if (s.includes('interview 1st round pending')) return 'Waiting for Interview Results';
        if (s.includes('1st round completed')) return 'Result: Send 2nd Round Invitiation (Qualified) or Reject';
        if (s.includes('2nd round qualified')) return 'Final Offer / Decision';
        if (s.includes('rejected')) return 'None (Archived)';
        if (s.includes('slot booked')) return 'Interview in Progress';
        return 'Process Completed';
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!remarks.trim()) {
            setError('Please provide remarks/reason for this decision.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.patch(API_ENDPOINTS.CANDIDATES.UPDATE_STATUS(candidate._id), {
                status: newStatus,
                remarks: remarks
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const getResumeUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // Use VITE_API_URL (which is http://localhost:5000/api) and remove /api
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');

        // Ensure path doesn't have leading slash if baseUrl has trailing, though replace removes it
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${baseUrl}/${cleanPath.replace(/\\/g, '/')}`;
    };

    return (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="card admin-modal" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-card)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Candidate Profile</h2>
                        {candidate.internalReferred && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                                <Star size={16} fill="var(--warning)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Referred</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', zIndex: 10 }}>
                    <button onClick={() => setActiveTab('info')} style={{ padding: '1rem 2rem', border: 'none', background: activeTab === 'info' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', borderRight: '1px solid var(--border-color)', cursor: 'pointer' }}>Detailed Info</button>
                    <button onClick={() => setActiveTab('resume')} style={{ padding: '1rem 2rem', border: 'none', background: activeTab === 'resume' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'resume' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', borderRight: '1px solid var(--border-color)', cursor: 'pointer' }}>Resume Content</button>
                    <button onClick={() => setActiveTab('interviews')} style={{ padding: '1rem 2rem', border: 'none', background: activeTab === 'interviews' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'interviews' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', borderRight: '1px solid var(--border-color)', cursor: 'pointer' }}>Interviews Info</button>
                    <button onClick={() => setActiveTab('status')} style={{ padding: '1rem 2rem', border: 'none', background: activeTab === 'status' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'status' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', borderRight: '1px solid var(--border-color)', cursor: 'pointer' }}>Status</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
                    {activeTab === 'info' ? (
                        <div className="admin-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Personal Details</h3>
                                <div style={{ marginBottom: '1rem' }}><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</div><div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{candidate.name}</div></div>
                                <div style={{ marginBottom: '1rem' }}><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> Email Address</div><div>{candidate.email}</div></div>
                                <div style={{ marginBottom: '1rem' }}><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> Phone Number</div><div>{candidate.phone || 'N/A'}</div></div>
                                <h3 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Professional Profile</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Domain</div><div style={{ fontWeight: '500' }}>{candidate.domain}</div></div>
                                    <div><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Experience</div><div style={{ fontWeight: '500' }}>{candidate.experienceLevel}</div></div>
                                    <div><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</div><div style={{ fontWeight: '500' }}>{formatCandidateStatus(candidate.status)}</div></div>
                                </div>

                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Decision Remarks</h3>
                                <textarea className="input" placeholder="Enter reason for approval or rejection..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} disabled={candidate.status === '2nd_round_qualified' || candidate.status === 'rejected'} style={{ resize: 'none' }} />
                            </div>
                            <div>
                                {candidate.overallScore !== undefined && (
                                    <>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Interview Performance</h3>
                                        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '1rem', border: '1px solid var(--primary)', textAlign: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overall AI Score</div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{candidate.overallScore}/5.0</div>
                                        </div>
                                    </>
                                )}
                                {candidate.interviewLink && (
                                    <>
                                        <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Scheduled Interview</h3>
                                        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date & Time</div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                        {new Date(candidate.interviewDate!).toLocaleDateString()} at {candidate.interviewTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', color: 'var(--success)' }}>
                                                    <Video size={18} />
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Meeting Link</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <a
                                                            href={candidate.interviewLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '180px' }}
                                                        >
                                                            {candidate.interviewLink}
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(candidate.interviewLink!);
                                                                showToast.success('Link copied to clipboard');
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                                                            title="Copy Link"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Resume File</h3>
                                {candidate.resumeUrl ? (
                                    <a href={getResumeUrl(candidate.resumeUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}><File size={20} /> View Resume PDF <ExternalLink size={16} /></a>
                                ) : <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No resume uploaded</div>}
                            </div>
                        </div>
                    ) : activeTab === 'resume' ? (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>{candidate.resumeText || 'No text content available.'}</pre>
                        </div>
                    ) : activeTab === 'interviews' ? (
                        <div>
                            {loadingInterviews ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Loading interviews...
                                </div>
                            ) : interviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <Video size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <div>No interviews found for this candidate</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {interviews.map((interview, interviewIndex) => (
                                        <div key={interview._id} style={{
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.75rem',
                                            backgroundColor: 'var(--bg-card)',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Interview Header */}
                                            <div style={{
                                                padding: '1.5rem',
                                                backgroundColor: 'var(--bg-secondary)',
                                                borderBottom: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                                        Interview #{interviewIndex + 1}
                                                    </h3>
                                                    <span style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600',
                                                        backgroundColor: interview.status === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                        color: interview.status === 'Completed' ? '#22c55e' : '#eab308'
                                                    }}>
                                                        {interview.status}
                                                    </span>
                                                </div>
                                                
                                                {/* Interview Summary */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Domain</div>
                                                        <div style={{ fontWeight: '500' }}>{interview.domain || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Round</div>
                                                        <div style={{ fontWeight: '500' }}>{interview.round || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Experience Level</div>
                                                        <div style={{ fontWeight: '500' }}>{interview.experienceLevel || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Overall Score</div>
                                                        <div style={{ fontWeight: '500' }}>{interview.feedback?.technical || 'N/A'}/10</div>
                                                    </div>
                                                </div>
                                                
                                                {interview.startedAt && (
                                                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ marginBottom: '0.25rem' }}>Started: {new Date(interview.startedAt).toLocaleString()}</div>
                                                        {interview.completedAt && (
                                                            <div>Completed: {new Date(interview.completedAt).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {interview.aiOverallSummary && (
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>AI Summary:</div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                                                            {interview.aiOverallSummary}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Questions & Answers */}
                                            <div style={{ padding: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                    Questions & Answers
                                                </h4>
                                                {interview.responses && interview.responses.length > 0 ? (
                                                    interview.responses.map((response: any, responseIndex: number) => (
                                                        <div key={response._id || responseIndex} style={{
                                                            marginBottom: '1.5rem',
                                                            padding: '1rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '0.5rem',
                                                            backgroundColor: 'var(--bg-secondary)'
                                                        }}>
                                                            {/* Question Header */}
                                                            <div style={{ marginBottom: '1rem' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                                    <h5 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                                        Question {responseIndex + 1}
                                                                    </h5>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                        {response.questionId?.difficulty && (
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '0.2rem 0.5rem',
                                                                                borderRadius: '4px',
                                                                                backgroundColor: response.questionId.difficulty === 'Easy' ? 'rgba(34, 197, 94, 0.1)' :
                                                                                    response.questionId.difficulty === 'Medium' ? 'rgba(251, 146, 60, 0.1)' :
                                                                                        'rgba(239, 68, 68, 0.1)',
                                                                                color: response.questionId.difficulty === 'Easy' ? 'var(--success)' :
                                                                                    response.questionId.difficulty === 'Medium' ? 'var(--warning)' :
                                                                                        'var(--error)'
                                                                            }}>
                                                                                {response.questionId.difficulty}
                                                                            </span>
                                                                        )}
                                                                        {response.score !== undefined && (
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '0.2rem 0.5rem',
                                                                                borderRadius: '4px',
                                                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                                color: 'var(--primary)',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                Score: {response.score}/10
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                                                                    {response.questionId?.text || 'Question not available'}
                                                                </p>
                                                                {response.questionId?.keywords && response.questionId.keywords.length > 0 && (
                                                                    <div style={{ marginTop: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Keywords: </span>
                                                                        {response.questionId.keywords.map((keyword: string, i: number) => (
                                                                            <span key={i} style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '0.1rem 0.3rem',
                                                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                                color: 'var(--primary)',
                                                                                borderRadius: '3px',
                                                                                marginRight: '0.25rem'
                                                                            }}>
                                                                                {keyword}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Candidate's Answer */}
                                                            <div style={{ marginBottom: '1rem' }}>
                                                                <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                                    Candidate's Answer:
                                                                </h6>
                                                                <div style={{
                                                                    padding: '0.75rem',
                                                                    backgroundColor: 'var(--bg-card)',
                                                                    borderRadius: '0.25rem',
                                                                    fontSize: '0.875rem',
                                                                    lineHeight: '1.5',
                                                                    color: 'var(--text-primary)'
                                                                }}>
                                                                    {response.userResponseText || 'No text response available'}
                                                                </div>
                                                                {response.timeTakenSeconds && (
                                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                        Time taken: {Math.floor(response.timeTakenSeconds / 60)}m {response.timeTakenSeconds % 60}s
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* AI Feedback */}
                                                            {response.aiFeedback && (
                                                                <div>
                                                                    <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                                        AI Feedback:
                                                                    </h6>
                                                                    <div style={{
                                                                        padding: '0.75rem',
                                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                                        borderRadius: '0.25rem',
                                                                        fontSize: '0.875rem',
                                                                        lineHeight: '1.5',
                                                                        color: 'var(--text-primary)'
                                                                    }}>
                                                                        {response.aiFeedback}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                        No responses available for this interview.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Current Status</h3>
                            <div style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '2rem',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                backgroundColor: getStatusBackgroundColor(candidate.status),
                                color: getStatusColor(candidate.status),
                                marginBottom: '2rem'
                            }}>
                                {formatCandidateStatus(candidate.status)}
                            </div>

                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Next Pending Item</h3>
                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '0.75rem',
                                borderLeft: '4px solid var(--primary)',
                                fontWeight: '500',
                                fontSize: '1.1rem'
                            }}>
                                {getNextPendingItem(candidate.status)}
                            </div>
                        </div>
                    )}
                </div>
                {activeTab === 'status' && (
                    <div style={{
                        padding: '1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end',
                        backgroundColor: 'var(--bg-secondary)',
                        zIndex: 10
                    }}>
                        {error && <div style={{ color: 'var(--error)', flex: 1, alignSelf: 'center' }}>{error}</div>}

                        {(candidate.status === 'Profile Submitted' || candidate.status === 'profile_submitted') && (
                            <button onClick={onInvite} className="btn" style={{ background: 'var(--primary)', border: 'none', color: 'white' }} disabled={loading}>
                                {loading ? 'Processing...' : 'Send Invitation Mail'}
                            </button>
                        )}

                        {(candidate.status === 'Interview 1st Round Pending' || candidate.status === 'interview_1st_round_pending') && (
                            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Waiting for interview results...</div>
                        )}

                        {(candidate.status === '1st Round Completed' || candidate.status === '1st_round_completed') && (
                            <>
                                <button onClick={() => handleStatusUpdate('2nd_round_qualified')} className="btn" style={{ background: 'var(--success)', border: 'none', color: 'white' }} disabled={loading}>
                                    {loading ? 'Processing...' : 'Send 2nd Round Invite'}
                                </button>
                                <button onClick={() => handleStatusUpdate('rejected')} className="btn" style={{ background: 'var(--error)', border: 'none', color: 'white' }} disabled={loading}>
                                    {loading ? 'Processing...' : 'Reject'}
                                </button>
                            </>
                        )}

                        {/* Pending fallbacks */}
                        {(candidate.status === 'Pending' || candidate.status === 'Shortlisted') && (
                            <button onClick={() => handleStatusUpdate('profile_submitted')} className="btn" style={{ background: 'var(--primary)', border: 'none', color: 'white' }} disabled={loading}>
                                {loading ? 'Processing...' : 'Move to Profile Submitted'}
                            </button>
                        )}

                        {(candidate.status === '2nd_round_qualified' || candidate.status === '2nd Round Qualified' || candidate.status === 'Rejected' || candidate.status === 'rejected') && (
                            <div style={{ color: (candidate.status === '2nd_round_qualified' || candidate.status === '2nd Round Qualified') ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>Decision: {candidate.status}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const AddCandidateModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', domain: 'Frontend', experienceLevel: 'Fresher/Intern', internalReferred: false, noticePeriod: 30 });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const validateIndianPhone = (phone: string): boolean => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length === 12 && digitsOnly.startsWith('91');
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!value.startsWith('+91')) {
            value = '+91' + value.replace(/^\+91/, '');
        }
        if (value.length === 3 && !value.includes(' ')) {
            value = '+91 ';
        }
        const afterCountryCode = value.substring(4);
        const digitsOnly = afterCountryCode.replace(/\D/g, '');
        const limitedDigits = digitsOnly.substring(0, 10);
        const formattedValue = '+91 ' + limitedDigits;

        setFormData({ ...formData, phone: formattedValue });

        if (limitedDigits.length > 0) {
            if (limitedDigits.length < 10) {
                setPhoneError('Please enter a complete 10-digit Indian mobile number');
            } else {
                setPhoneError('');
            }
        } else {
            setPhoneError('');
        }
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setResumeFile(file);
            setParsing(true);
            const fd = new FormData();
            fd.append('resume', file);
            try {
                const res = await api.post(API_ENDPOINTS.CANDIDATES.PARSE_RESUME, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormData(prev => ({ ...prev, ...res.data }));
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to parse resume');
            }
            finally { setParsing(false); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateIndianPhone(formData.phone)) {
            setPhoneError('Please enter a valid 10-digit Indian mobile number');
            return;
        }
        setLoading(true);
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v.toString()));
        if (resumeFile) fd.append('resume', resumeFile);
        try {
            await api.post(API_ENDPOINTS.CANDIDATES.BASE, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast.success('Candidate added successfully!');
            onSuccess();
            onClose();
        } catch (err) { setError('Failed to add candidate'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Add Candidate</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}
                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: resumeFile ? '2px solid var(--primary)' : '2px dashed var(--border-color)', borderRadius: '0.75rem', textAlign: 'center', backgroundColor: resumeFile ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={32} style={{ color: resumeFile ? 'var(--primary)' : 'var(--primary)' }} />
                            <div style={{ fontWeight: '600' }}>
                                {resumeFile ? 'Change Resume' : 'Auto-fill from Resume'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PDF or Word (DOCX)</div>
                            <input type="file" accept=".pdf,.docx,.doc" onChange={handleResumeUpload} style={{ display: 'none' }} />
                        </label>
                        {parsing && <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '500' }}>Analyzing resume...</div>}

                        {resumeFile && !parsing && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                    📄 {resumeFile.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Size: {(resumeFile.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                        )}
                    </div>

                    <form id="add-candidate-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label><input className="input" placeholder="e.g. John Doe" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label><input className="input" type="email" placeholder="john@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                                <input
                                    className="input"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                />
                                {phoneError && (
                                    <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        {phoneError}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Target Domain</label>
                                <select className="input" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Full Stack">Full Stack</option>
                                    <option value="Sales & Marketing">Sales & Marketing</option>
                                    <option value="Business Analyst">Business Analyst</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="QA/Testing">QA/Testing</option>
                                    <option value="UI/UX Design">UI/UX Design</option>
                                    <option value="Product Management">Product Management</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Experience Level</label>
                                <select className="input" value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}>
                                    <option value="Fresher/Intern">Fresher/Intern</option>
                                    <option value="0-1 years">0-1 years</option>
                                    <option value="1-2 years">1-2 years</option>
                                    <option value="2-4 years">2-4 years</option>
                                    <option value="4-6 years">4-6 years</option>
                                    <option value="6-8 years">6-8 years</option>
                                    <option value="8-10 years">8-10 years</option>
                                    <option value="10+ years">10+ years</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Notice Period</label>
                                <select className="input" value={formData.noticePeriod} onChange={e => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) })}>
                                    <option value={15}>Immediate (≤ 15 days)</option>
                                    <option value={30}>1 Month (≤ 30 days)</option>
                                    <option value={60}>2 Months (≤ 60 days)</option>
                                    <option value={90}>3 Months (≤ 90 days)</option>
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                                <input type="checkbox" style={{ width: '1.1rem', height: '1.1rem' }} checked={formData.internalReferred} onChange={e => setFormData({ ...formData, internalReferred: e.target.checked })} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Internal Referral Candidate</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: 'var(--text-primary)', color: "var(--bg-primary)" }}>Cancel</button>
                    <button type="submit" form="add-candidate-form" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Adding...' : 'Add Candidate'}</button>
                </div>
            </div>
        </div>
    );
};

export const EditCandidateModal: React.FC<{ onClose: () => void, onSuccess: () => void, candidate: Candidate }> = ({ onClose, onSuccess, candidate }) => {
    const formatPhone = (phone: string | undefined): string => {
        if (!phone) return '+91 ';
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.startsWith('91') && digitsOnly.length >= 2) {
            const mobileDigits = digitsOnly.substring(2);
            return '+91 ' + mobileDigits.substring(0, 10);
        }
        return '+91 ' + digitsOnly.substring(0, 10);
    };

    const [formData, setFormData] = useState({
        name: candidate.name,
        email: candidate.email,
        phone: formatPhone(candidate.phone),
        domain: candidate.domain,
        experienceLevel: candidate.experienceLevel,
        internalReferred: candidate.internalReferred
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const validateIndianPhone = (phone: string): boolean => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length === 12 && digitsOnly.startsWith('91');
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!value.startsWith('+91')) {
            value = '+91' + value.replace(/^\+91/, '');
        }
        if (value.length === 3 && !value.includes(' ')) {
            value = '+91 ';
        }
        const afterCountryCode = value.substring(4);
        const digitsOnly = afterCountryCode.replace(/\D/g, '');
        const limitedDigits = digitsOnly.substring(0, 10);
        const formattedValue = '+91 ' + limitedDigits;

        setFormData({ ...formData, phone: formattedValue });

        if (limitedDigits.length > 0) {
            if (limitedDigits.length < 10) {
                setPhoneError('Please enter a complete 10-digit Indian mobile number');
            } else {
                setPhoneError('');
            }
        } else {
            setPhoneError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateIndianPhone(formData.phone)) {
            setPhoneError('Please enter a valid 10-digit Indian mobile number');
            return;
        }
        setLoading(true);
        try {
            await api.patch(`${API_ENDPOINTS.CANDIDATES.BASE}/${candidate._id}`, formData);
            showToast.success('Candidate updated successfully!');
            onSuccess();
            onClose();
        } catch (err) { setError('Failed to update candidate'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Edit Candidate</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}

                    <form id="edit-candidate-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label><input className="input" placeholder="e.g. John Doe" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label><input className="input" type="email" placeholder="john@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                                <input
                                    className="input"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                />
                                {phoneError && (
                                    <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        {phoneError}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Target Domain</label>
                                <select className="input" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Full Stack">Full Stack</option>
                                    <option value="Sales & Marketing">Sales & Marketing</option>
                                    <option value="Business Analyst">Business Analyst</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="QA/Testing">QA/Testing</option>
                                    <option value="UI/UX Design">UI/UX Design</option>
                                    <option value="Product Management">Product Management</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Experience Level</label>
                                <select className="input" value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}>
                                    <option value="Fresher/Intern">Fresher/Intern</option>
                                    <option value="0-1 years">0-1 years</option>
                                    <option value="1-2 years">1-2 years</option>
                                    <option value="2-4 years">2-4 years</option>
                                    <option value="4-6 years">4-6 years</option>
                                    <option value="6-8 years">6-8 years</option>
                                    <option value="8-10 years">8-10 years</option>
                                    <option value="10+ years">10+ years</option>
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                                <input type="checkbox" style={{ width: '1.1rem', height: '1.1rem' }} checked={formData.internalReferred} onChange={e => setFormData({ ...formData, internalReferred: e.target.checked })} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Internal Referral Candidate</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: 'var(--text-primary)', color: "var(--bg-primary)" }}>Cancel</button>
                    <button type="submit" form="edit-candidate-form" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Updating...' : 'Update Candidate'}</button>
                </div>
            </div>
        </div>
    );
};
