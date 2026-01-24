import React, { useState, useEffect } from 'react';
import { Upload, Plus, Users, BarChart, FileText, CheckCircle, X } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';

interface Candidate {
    _id: string;
    name: string;
    email: string;
    domain: string;
    experienceLevel: string;
    status: string;
    createdAt: string;
}

interface Stats {
    totalCandidates: number;
    interviewsCompleted: number;
    resumesProcessed: number;
}

const AdminDashboard: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [stats, setStats] = useState<Stats>({ totalCandidates: 0, interviewsCompleted: 0, resumesProcessed: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [candidatesRes, sessionsRes] = await Promise.all([
                api.get(API_ENDPOINTS.CANDIDATES.BASE),
                api.get(API_ENDPOINTS.SESSIONS.LIST)
            ]);

            setCandidates(candidatesRes.data);

            const completedInterviews = sessionsRes.data.filter((s: any) => s.status === 'Completed').length;
            const resumesCount = candidatesRes.data.filter((c: any) => c.resumeUrl).length;

            setStats({
                totalCandidates: candidatesRes.data.length,
                interviewsCompleted: completedInterviews,
                resumesProcessed: resumesCount
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ gap: '0.5rem' }}
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={18} /> Add Candidate
                    </button>
                    <button
                        className="btn"
                        style={{ gap: '0.5rem', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        onClick={() => setShowQuestionModal(true)}
                    >
                        <FileText size={18} /> Add Question
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={<Users />} label="Total Candidates" value={stats.totalCandidates.toString()} />
                <StatCard icon={<BarChart />} label="Interviews Completed" value={stats.interviewsCompleted.toString()} />
                <StatCard icon={<Upload />} label="Resumes Processed" value={stats.resumesProcessed.toString()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Recent Candidates</h2>
                    {candidates.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No candidates yet. Click "Add Candidate" to get started.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem' }}>Name</th>
                                        <th style={{ padding: '0.75rem' }}>Email</th>
                                        <th style={{ padding: '0.75rem' }}>Domain</th>
                                        <th style={{ padding: '0.75rem' }}>Experience</th>
                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                        <th style={{ padding: '0.75rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.slice(0, 10).map((candidate) => (
                                        <TableRow key={candidate._id} candidate={candidate} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} onSuccess={fetchDashboardData} />}
            {showQuestionModal && <AddQuestionModal onClose={() => setShowQuestionModal(false)} />}
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
        </div>
    </div>
);

const TableRow: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Interviewed': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' };
            case 'Shortlisted': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' };
            case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' };
        }
    };

    const statusStyle = getStatusColor(candidate.status);

    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>{candidate.name}</td>
            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{candidate.email}</td>
            <td style={{ padding: '0.75rem' }}>{candidate.domain}</td>
            <td style={{ padding: '0.75rem' }}>{candidate.experienceLevel}</td>
            <td style={{ padding: '0.75rem' }}>
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                }}>
                    {candidate.status}
                </span>
            </td>
            <td style={{ padding: '0.75rem' }}>
                <button style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.875rem' }}>View</button>
            </td>
        </tr>
    );
};

const AddCandidateModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        domain: 'Frontend',
        experienceLevel: 'Fresher/Intern',
        internalReferred: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(API_ENDPOINTS.CANDIDATES.BASE, formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add candidate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Add Candidate</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email *</label>
                        <input
                            type="email"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone</label>
                        <input
                            type="tel"
                            className="input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Domain *</label>
                        <select
                            className="input"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            required
                        >
                            <option value="Frontend">Frontend</option>
                            <option value="Backend">Backend</option>
                            <option value="Full Stack">Full Stack</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Mobile">Mobile</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Experience Level *</label>
                        <select
                            className="input"
                            value={formData.experienceLevel}
                            onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                            required
                        >
                            <option value="Fresher/Intern">Fresher/Intern</option>
                            <option value="1-2 years">1-2 years</option>
                            <option value="2-4 years">2-4 years</option>
                            <option value="4-6 years">4-6 years</option>
                            <option value="6-8 years">6-8 years</option>
                            <option value="8-10 years">8-10 years</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="internalReferred"
                            checked={formData.internalReferred}
                            onChange={(e) => setFormData({ ...formData, internalReferred: e.target.checked })}
                        />
                        <label htmlFor="internalReferred" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            Internal Referral
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Candidate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddQuestionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        text: '',
        domain: 'Frontend',
        experienceLevel: 'Fresher/Intern',
        difficulty: 'Medium'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(API_ENDPOINTS.QUESTIONS.BASE, formData);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Add Question</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{error}</div>}
                {success && (
                    <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} /> Question added successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Question Text *</label>
                        <textarea
                            className="input"
                            rows={4}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            required
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Domain *</label>
                        <select
                            className="input"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            required
                        >
                            <option value="Frontend">Frontend</option>
                            <option value="Backend">Backend</option>
                            <option value="Full Stack">Full Stack</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Mobile">Mobile</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Experience Level *</label>
                        <select
                            className="input"
                            value={formData.experienceLevel}
                            onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                            required
                        >
                            <option value="Fresher/Intern">Fresher/Intern</option>
                            <option value="1-2 years">1-2 years</option>
                            <option value="2-4 years">2-4 years</option>
                            <option value="4-6 years">4-6 years</option>
                            <option value="6-8 years">6-8 years</option>
                            <option value="8-10 years">8-10 years</option>
                            <option value="All">All Levels</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Difficulty *</label>
                        <select
                            className="input"
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            required
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || success}>
                            {loading ? 'Adding...' : success ? 'Added!' : 'Add Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
