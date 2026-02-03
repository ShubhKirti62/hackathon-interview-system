import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import { API_ENDPOINTS } from '../../../services/endpoints';
import { APP_ROUTES } from '../../../routes';
import { showToast } from '../../../utils/toast';
import { validateTimeRange, restrictDateTimeInput, getRestrictedTimeMessage, validateTimeString, restrictTimeInput, validateDateForWorkingHours, restrictDateInput, getRestrictedDateMessage } from '../../../utils/timeValidation';
import type { Candidate, User } from '../../../pages/admin/types';

export const AddSlotModal: React.FC<{ onClose: () => void, onSuccess: () => void, interviewers: User[], candidates: Candidate[] }> = ({ onClose, onSuccess, interviewers, candidates }) => {
    const [formData, setFormData] = useState({ interviewerId: '', candidateId: '', startTime: '', endTime: '' });

    // Get first round completed candidates - allow flexible status matching
    const firstRoundCompletedCandidates = candidates.filter(c => {
        const s = (c.status || '').toLowerCase();
        return s === 'interviewed' || s === '1st_round_completed';
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.interviewerId || !formData.candidateId || !formData.startTime || !formData.endTime) {
            showToast.error('All fields are mandatory');
            return;
        }

        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const now = new Date();

        if (start < now) {
            showToast.error('Start time must be in the future');
            return;
        }

        if (end <= start) {
            showToast.error('End time must be after start time');
            return;
        }

        try {
            await api.post(API_ENDPOINTS.SLOTS.BASE, formData);
            showToast.success('Interview slot created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            showToast.error('Failed to create slot');
        }
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
                    <h2 style={{ margin: 0 }}>Create Slot</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <form id="create-slot-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Select Interviewer *</label>
                                <select className="input" required value={formData.interviewerId} onChange={e => setFormData({ ...formData, interviewerId: e.target.value })}>
                                    <option value="">Select Interviewer</option>
                                    {(() => {
                                        const list = Array.isArray(interviewers) ? interviewers : Object.values(interviewers || {});
                                        return list.filter((i: any) => i && i._id && i.name).map((i: any) => (
                                            <option key={i._id} value={i._id}>{i.name}</option>
                                        ));
                                    })()}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Select Candidate *</label>
                                <select className="input" required value={formData.candidateId} onChange={e => setFormData({ ...formData, candidateId: e.target.value })}>
                                    <option value="">Select Candidate (1st Round Completed)</option>
                                    {firstRoundCompletedCandidates.map((candidate: any) => (
                                        <option key={candidate._id} value={candidate._id}>
                                            {candidate.name} - {candidate.domain}
                                        </option>
                                    ))}
                                </select>
                                {firstRoundCompletedCandidates.length === 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem' }}>
                                        No candidates found with "Completed" status.
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Start Time *</label>
                                <input type="datetime-local" className="input" required value={formData.startTime} onChange={e => {
                                    setFormData({ ...formData, startTime: e.target.value });
                                }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>End Time *</label>
                                <input type="datetime-local" className="input" required value={formData.endTime} onChange={e => {
                                    setFormData({ ...formData, endTime: e.target.value });
                                }} />
                            </div>
                        </div>
                    </form>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button type="submit" form="create-slot-form" className="btn btn-primary" style={{ width: '100%' }}>Create Interview Slot</button>
                </div>
            </div>
        </div>
    );
};

export const FeedbackModal: React.FC<{ slot: any, onClose: () => void, onSuccess: () => void, type: 'admin' | 'candidate' }> = ({ slot, onClose, onSuccess, type }) => {
    const [formData, setFormData] = useState({ score: 0, remarks: '' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(API_ENDPOINTS.SLOTS.FEEDBACK(slot._id), { ...formData, type });
            showToast.success('Feedback submitted successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            showToast.error('Failed to submit feedback');
        }
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>{type.toUpperCase()} Feedback</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <form id="feedback-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Performance Score (0-10)</label>
                                <input type="number" min="0" max="10" className="input" required value={formData.score} onChange={e => setFormData({ ...formData, score: parseInt(e.target.value) })} style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Constructive Feedback</label>
                                <textarea className="input" rows={6} required value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Describe the candidate's performance, strengths, and areas for improvement..." style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </form>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button type="submit" form="feedback-form" className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
                </div>
            </div>
        </div>
    );
};

export const SendInviteModal: React.FC<{
    candidate: Candidate;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ candidate, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [link, setLink] = useState(window.location.origin + APP_ROUTES.INTERVIEW.MEETING.replace(':id', candidate._id));
    const [message, setMessage] = useState('');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(API_ENDPOINTS.INVITES.SEND, {
                candidateId: candidate._id,
                interviewDate: date,
                interviewTime: time,
                meetingLink: link,
                message: message
            });
            setSuccess(true);
            showToast.success('Interview invitation sent successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
                <div className="card" style={{
                    padding: '3rem',
                    borderRadius: '1.5rem',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '90%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        color: 'var(--success)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <CheckCircle size={64} strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Invitation Sent!</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                        The candidate has been notified via email and their status has been updated.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Send Interview Invitation</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSend} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date</label>
                            <input type="date" className="input" required value={date} onChange={e => {
                                const restrictedDate = restrictDateInput(e.target.value);
                                if (!validateDateForWorkingHours(e.target.value)) {
                                    showToast.error(getRestrictedDateMessage());
                                }
                                setDate(restrictedDate);
                            }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Time</label>
                            <input type="time" className="input" required value={time} min="10:00" max="19:00" onChange={e => {
                                const restrictedTime = restrictTimeInput(e.target.value);
                                if (!validateTimeString(e.target.value)) {
                                    showToast.error(getRestrictedTimeMessage());
                                }
                                setTime(restrictedTime);
                            }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Meeting Link</label>
                        <input type="url" className="input" placeholder="http://your-domain.com/interview/meeting/..." required value={link} onChange={e => setLink(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Additional Message (Optional)</label>
                        <textarea className="input" rows={4} placeholder="Any specific instructions..." value={message} onChange={e => setMessage(e.target.value)} style={{ resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Invitation'} <Send size={16} style={{ marginLeft: '0.5rem' }} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const InterviewDetailsModal: React.FC<{ interview: any, onClose: () => void }> = ({ interview, onClose }) => {
    if (!interview) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Interview Details</h2>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {interview.candidateId?.name} - {interview.domain} - {interview.round}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Interview Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status:</span>
                                <div style={{ fontWeight: '500' }}>{interview.status}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Completed:</span>
                                <div style={{ fontWeight: '500' }}>{interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overall Score:</span>
                                <div style={{ fontWeight: '500' }}>{interview.feedback?.technical || 'N/A'}/10</div>
                            </div>
                        </div>
                        {interview.aiOverallSummary && (
                            <div style={{ marginTop: '1rem' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI Summary:</span>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', lineHeight: '1.5' }}>{interview.aiOverallSummary}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Questions & Answers</h3>
                        {interview.responses && interview.responses.length > 0 ? (
                            interview.responses.map((response: any, index: number) => (
                                <div key={response._id || index} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Question {index + 1}</h4>
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

                                    <div style={{ marginBottom: '1rem' }}>
                                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Candidate's Answer:</h5>
                                        <div style={{
                                            padding: '0.75rem',
                                            backgroundColor: 'var(--bg-secondary)',
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

                                    {response.aiFeedback && (
                                        <div>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Feedback:</h5>
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

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export const EditSlotModal: React.FC<{ 
    onClose: () => void, 
    onSuccess: () => void, 
    slot: any, 
    interviewers: User[], 
    candidates: Candidate[] 
}> = ({ onClose, onSuccess, slot, interviewers, candidates }) => {
    const [formData, setFormData] = useState({
        interviewerId: slot.interviewerId?._id || slot.interviewerId,
        candidateId: slot.candidateId?._id || slot.candidateId,
        startTime: new Date(slot.startTime).toISOString().slice(0, 16),
        endTime: new Date(slot.endTime).toISOString().slice(0, 16)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.interviewerId || !formData.startTime || !formData.endTime) {
            showToast.error('Interviewer and time fields are mandatory');
            return;
        }

        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const now = new Date();

        if (start < now) {
            showToast.error('Start time must be in the future');
            return;
        }

        if (end <= start) {
            showToast.error('End time must be after start time');
            return;
        }

        try {
            await api.patch(`${API_ENDPOINTS.SLOTS.BASE}/${slot._id}`, formData);
            showToast.success('Interview slot updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            showToast.error('Failed to update slot');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Edit Interview Slot</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Interviewer *</label>
                        <select
                            className="input"
                            value={formData.interviewerId}
                            onChange={(e) => setFormData({ ...formData, interviewerId: e.target.value })}
                            required
                        >
                            <option value="">Select Interviewer</option>
                            {interviewers.map(interviewer => (
                                <option key={interviewer._id} value={interviewer._id}>
                                    {interviewer.name} ({interviewer.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Candidate</label>
                        <select
                            className="input"
                            value={formData.candidateId}
                            onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                        >
                            <option value="">Unbooked Slot</option>
                            {candidates.map(candidate => (
                                <option key={candidate._id} value={candidate._id}>
                                    {candidate.name} ({candidate.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Start Time *</label>
                        <input
                            type="datetime-local"
                            className="input"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>End Time *</label>
                        <input
                            type="datetime-local"
                            className="input"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            min={formData.startTime}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            Update Slot
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
