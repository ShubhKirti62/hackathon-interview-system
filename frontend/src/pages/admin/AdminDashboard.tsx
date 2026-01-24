import React, { useState, useEffect } from 'react';
import { Upload, Plus, Users, BarChart, FileText, CheckCircle, X, Shield, Briefcase, Star, Filter, Phone, Mail, File, ExternalLink, Settings, Clock } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

interface Candidate {
    _id: string;
    name: string;
    email: string;
    domain: string;
    experienceLevel: string;
    status: string;
    createdAt: string;
    internalReferred: boolean;
    resumeUrl?: string;
    resumeText?: string;
    phone?: string;
    remarks?: string;
    handledBy?: {
        name: string;
        role: string;
    };
    overallScore?: number;
}

interface Setting {
    key: string;
    value: number;
    description: string;
}

interface Question {
    _id: string;
    text: string;
    domain: string;
    experienceLevel: string;
    difficulty: string;
    type: 'MCQ' | 'Descriptive';
    options: string[];
    correctAnswers: string[];
}

interface Stats {
    totalCandidates: number;
    interviewsCompleted: number;
    resumesProcessed: number;
    totalQuestions: number;
    totalHRs: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalCandidates: 0,
        interviewsCompleted: 0,
        resumesProcessed: 0,
        totalQuestions: 0,
        totalHRs: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [filterReferred, setFilterReferred] = useState(false);
    const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'hr'>('candidates');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [hrs, setHrs] = useState<User[]>([]);
    const [showAddHRModal, setShowAddHRModal] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const requests = [
                api.get(API_ENDPOINTS.CANDIDATES.BASE),
                api.get(API_ENDPOINTS.SESSIONS.LIST),
                api.get(API_ENDPOINTS.QUESTIONS.BASE)
            ];

            if (isAdmin) {
                requests.push(api.get(`${API_ENDPOINTS.AUTH.USERS}?role=hr`));
            }

            const [candidatesRes, sessionsRes, questionsRes, hrsRes] = await Promise.all(requests);

            setCandidates(candidatesRes.data);
            setQuestions(questionsRes.data);

            const hrList = isAdmin && hrsRes ? hrsRes.data : [];
            if (isAdmin) setHrs(hrList);

            const completedInterviews = sessionsRes.data.filter((s: any) => s.status === 'Completed').length;
            const resumesCount = candidatesRes.data.filter((c: any) => c.resumeUrl).length;

            setStats({
                totalCandidates: candidatesRes.data.length,
                interviewsCompleted: completedInterviews,
                resumesProcessed: resumesCount,
                totalQuestions: questionsRes.data.length,
                totalHRs: hrList.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleRemoveHR = async (hrId: string) => {
        if (!window.confirm('Are you sure you want to remove access for this HR?')) return;
        try {
            await api.delete(`${API_ENDPOINTS.AUTH.USERS}/${hrId}`);
            fetchDashboardData();
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Failed to remove HR access');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isAdmin ? <Shield size={32} style={{ color: 'var(--primary)' }} /> : <Briefcase size={32} style={{ color: 'var(--primary)' }} />}
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                        {isAdmin ? 'Admin Dashboard' : 'HR Dashboard'}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {activeTab === 'candidates' ? (
                        <button
                            className="btn btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={18} /> Add Candidate
                        </button>
                    ) : activeTab === 'questions' ? (
                        <>
                            <button
                                className="btn"
                                style={{ gap: '0.5rem', backgroundColor: 'var(--success)', color: 'white', border: 'none' }}
                                onClick={() => setShowBulkModal(true)}
                            >
                                <Upload size={18} /> Bulk Upload
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ gap: '0.5rem' }}
                                onClick={() => {
                                    setEditingQuestion(null);
                                    setShowQuestionModal(true);
                                }}
                            >
                                <Plus size={18} /> Add Question
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => setShowAddHRModal(true)}
                        >
                            <Plus size={18} /> Add HR
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className="btn"
                            style={{ gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none' }}
                            onClick={() => setShowSettingsModal(true)}
                        >
                            <Settings size={18} /> Settings
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('candidates')}
                    style={{
                        padding: '1rem 0.5rem',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'candidates' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'candidates' ? '2px solid var(--primary)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Candidates Management
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    style={{
                        padding: '1rem 0.5rem',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'questions' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'questions' ? '2px solid var(--primary)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Questions Library
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('hr')}
                        style={{
                            padding: '1rem 0.5rem',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'hr' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: 'bold',
                            borderBottom: activeTab === 'hr' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        HR Management
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {activeTab === 'candidates' && (
                    <>
                        <StatCard icon={<Users />} label="Total Candidates" value={stats.totalCandidates.toString()} />
                        <StatCard icon={<BarChart />} label="Interviews Completed" value={stats.interviewsCompleted.toString()} />
                        <StatCard icon={<Upload />} label="Resumes Processed" value={stats.resumesProcessed.toString()} />
                    </>
                )}
                {activeTab === 'questions' && (
                    <>
                        <StatCard icon={<FileText />} label="Total Questions" value={stats.totalQuestions.toString()} />
                        <StatCard icon={<BarChart />} label="MCQs" value={questions.filter(q => q.type === 'MCQ').length.toString()} />
                        <StatCard icon={<File />} label="Descriptive" value={questions.filter(q => q.type === 'Descriptive').length.toString()} />
                    </>
                )}
                {activeTab === 'hr' && (
                    <>
                        <StatCard icon={<Users />} label="Total HR Members" value={stats.totalHRs.toString()} />
                        <StatCard icon={<Shield />} label="Admin Access" value="Full" />
                        <StatCard icon={<CheckCircle />} label="System Status" value="Online" />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {activeTab === 'candidates' ? (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Recent Candidates</h2>
                            <button
                                onClick={() => setFilterReferred(!filterReferred)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: filterReferred ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                    color: filterReferred ? 'var(--warning)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Filter size={16} />
                                {filterReferred ? 'Showing Referred Only' : 'Filter by Referral'}
                            </button>
                        </div>
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
                                            <th style={{ padding: '0.75rem' }}>Type</th>
                                            {isAdmin && <th style={{ padding: '0.75rem' }}>Handled By</th>}
                                            <th style={{ padding: '0.75rem' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates
                                            .filter(c => !filterReferred || c.internalReferred)
                                            .slice(0, 10).map((candidate) => (
                                                <TableRow
                                                    key={candidate._id}
                                                    candidate={candidate}
                                                    isAdmin={isAdmin}
                                                    onView={() => setSelectedCandidate(candidate)}
                                                />
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'questions' ? (
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Questions Bank</h2>
                        {questions.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No questions available.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>Question Text</th>
                                            <th style={{ padding: '0.75rem' }}>Domain</th>
                                            <th style={{ padding: '0.75rem' }}>Level</th>
                                            <th style={{ padding: '0.75rem' }}>Difficulty</th>
                                            <th style={{ padding: '0.75rem' }}>Type</th>
                                            <th style={{ padding: '0.75rem' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questions.map((q) => (
                                            <tr key={q._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</td>
                                                <td style={{ padding: '0.75rem' }}>{q.domain}</td>
                                                <td style={{ padding: '0.75rem' }}>{q.experienceLevel}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '4px',
                                                        backgroundColor: q.difficulty === 'Easy' ? 'var(--success)' : q.difficulty === 'Medium' ? 'var(--warning)' : 'var(--error)',
                                                        color: 'white'
                                                    }}>
                                                        {q.difficulty}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{q.type}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingQuestion(q);
                                                            setShowQuestionModal(true);
                                                        }}
                                                        style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>HR Team</h2>
                        {hrs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No HR members found.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem' }}>Email</th>
                                            <th style={{ padding: '0.75rem' }}>Joined</th>
                                            <th style={{ padding: '0.75rem' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hrs.map((hr) => (
                                            <tr key={hr._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem' }}>{hr.name}</td>
                                                <td style={{ padding: '0.75rem' }}>{hr.email}</td>
                                                <td style={{ padding: '0.75rem' }}>{new Date(hr.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button
                                                        onClick={() => handleRemoveHR(hr._id)}
                                                        style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Remove Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} onSuccess={fetchDashboardData} />}
            {showQuestionModal && (
                <AddQuestionModal
                    onClose={() => setShowQuestionModal(false)}
                    onSuccess={fetchDashboardData}
                    existingQuestion={editingQuestion}
                />
            )}
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
            {showBulkModal && (
                <BulkUploadModal
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={fetchDashboardData}
                />
            )}
            {showAddHRModal && (
                <AddHRModal
                    onClose={() => setShowAddHRModal(false)}
                    onSuccess={fetchDashboardData}
                />
            )}
            {selectedCandidate && (
                <ViewCandidateModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onSuccess={fetchDashboardData}
                />
            )}
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

const TableRow: React.FC<{ candidate: Candidate, isAdmin: boolean, onView: () => void }> = ({ candidate, isAdmin, onView }) => {
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
                {candidate.internalReferred ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)' }}>
                        <Star size={14} fill="var(--warning)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Referred</span>
                    </div>
                ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct</span>
                )}
            </td>
            {isAdmin && (
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {candidate.handledBy ? (
                        <div>
                            <div style={{ fontWeight: '500' }}>{candidate.handledBy.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {candidate.handledBy.role.toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending</span>
                    )}
                </td>
            )}
            <td style={{ padding: '0.75rem' }}>
                <button
                    onClick={onView}
                    style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                    View
                </button>
            </td>
        </tr>
    );
};

const ViewCandidateModal: React.FC<{ candidate: Candidate, onClose: () => void, onSuccess: () => void }> = ({ candidate, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [remarks, setRemarks] = useState(candidate.remarks || '');
    const [activeTab, setActiveTab] = useState<'info' | 'resume'>('info');

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
        // Assuming backend serves uploads folder at /uploads
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${baseUrl}/${path.replace(/\\/g, '/')}`;
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
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {/* Modal Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button
                        onClick={() => setActiveTab('info')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: activeTab === 'info' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: '600',
                            borderRight: '1px solid var(--border-color)',
                            cursor: 'pointer'
                        }}
                    >
                        Detailed Info
                    </button>
                    <button
                        onClick={() => setActiveTab('resume')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: activeTab === 'resume' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'resume' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: '600',
                            borderRight: '1px solid var(--border-color)',
                            cursor: 'pointer'
                        }}
                    >
                        Resume Content
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {activeTab === 'info' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Personal Details</h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{candidate.name}</div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Mail size={14} /> Email Address
                                    </div>
                                    <div style={{ fontSize: '1rem' }}>{candidate.email}</div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Phone size={14} /> Phone Number
                                    </div>
                                    <div style={{ fontSize: '1rem' }}>{candidate.phone || 'N/A'}</div>
                                </div>

                                <h3 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Professional Profile</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Domain</div>
                                        <div style={{ fontWeight: '500' }}>{candidate.domain}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Experience</div>
                                        <div style={{ fontWeight: '500' }}>{candidate.experienceLevel}</div>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Decision Remarks</h3>
                                <textarea
                                    className="input"
                                    placeholder="Enter reason for approval or rejection..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                    disabled={candidate.status === 'Shortlisted' || candidate.status === 'Rejected'}
                                    style={{
                                        resize: 'none',
                                        backgroundColor: (candidate.status === 'Shortlisted' || candidate.status === 'Rejected') ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        opacity: (candidate.status === 'Shortlisted' || candidate.status === 'Rejected') ? 0.7 : 1
                                    }}
                                />
                            </div>

                            <div>
                                {candidate.overallScore !== undefined ? (
                                    <>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Interview Performance</h3>
                                        <div style={{
                                            padding: '1.5rem',
                                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                            borderRadius: '1rem',
                                            border: '1px solid var(--primary)',
                                            textAlign: 'center',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overall AI Score</div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{candidate.overallScore}/5.0</div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
                                        Interview not yet completed
                                    </div>
                                )}

                                {candidate.handledBy && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last updated by</div>
                                        <div style={{ fontWeight: '600' }}>{candidate.handledBy.name} ({candidate.handledBy.role})</div>
                                    </div>
                                )}

                                <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Resume File</h3>
                                {candidate.resumeUrl ? (
                                    <a
                                        href={getResumeUrl(candidate.resumeUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '1rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: '0.5rem',
                                            color: 'var(--primary)',
                                            fontWeight: '600',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <File size={20} />
                                        View Resume PDF <ExternalLink size={16} />
                                    </a>
                                ) : (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No resume uploaded</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} /> Extracted Text from Resume
                            </h3>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                lineHeight: '1.5'
                            }}>
                                {candidate.resumeText || 'No text content available from this resume.'}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    {error && <div style={{ color: 'var(--error)', flex: 1, alignSelf: 'center', fontSize: '0.875rem' }}>{error}</div>}
                    {candidate.status !== 'Shortlisted' && candidate.status !== 'Rejected' ? (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('Shortlisted')}
                                className="btn"
                                style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '0.75rem 2rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Approve & Shortlist'}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Rejected')}
                                className="btn"
                                style={{ background: 'var(--error)', border: 'none', color: 'white', padding: '0.75rem 2rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Reject'}
                            </button>
                        </>
                    ) : (
                        <div style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            backgroundColor: candidate.status === 'Shortlisted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: candidate.status === 'Shortlisted' ? 'var(--success)' : 'var(--error)',
                            fontWeight: 'bold',
                            border: `1px solid ${candidate.status === 'Shortlisted' ? 'var(--success)' : 'var(--error)'}`
                        }}>
                            Decision Finalized: {candidate.status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AddCandidateModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        domain: 'Frontend',
        experienceLevel: 'Fresher/Intern',
        internalReferred: false,
        resumeUrl: '',
        resumeText: ''
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState('');

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setResumeFile(file);
            setParsing(true);
            setError('');

            const formDataUpload = new FormData();
            formDataUpload.append('resume', file);

            try {
                const res = await api.post(API_ENDPOINTS.CANDIDATES.PARSE_RESUME, formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const { name, email, phone, domain, experienceLevel, resumeUrl, resumeText } = res.data;

                setFormData(prev => ({
                    ...prev,
                    name: name || prev.name,
                    email: email || prev.email,
                    phone: phone || prev.phone,
                    domain: domain || prev.domain,
                    experienceLevel: experienceLevel || prev.experienceLevel,
                    resumeUrl: resumeUrl,
                    resumeText: resumeText
                }));

            } catch (err) {
                console.error('Parse error:', err);
                setError('Failed to parse resume. Please fill details manually.');
            } finally {
                setParsing(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use FormData to send file or fields
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('domain', formData.domain);
            submitData.append('experienceLevel', formData.experienceLevel);
            submitData.append('internalReferred', formData.internalReferred.toString());

            if (resumeFile) {
                // If we have a file object (user selected one), send it.
                // Note: If we already uploaded it for parsing, we could theoretically send the path,
                // but sending the file again ensures the 'create' route logic is simple (req.file).
                // However, we optimized the backend to accept 'resumeUrl' string too. 
                // Let's send the string if we have it and no *new* file is needed, but here resumeFile matches.
                // Actually, to be safe and simple, let's just send the file again if it's there.
                // OR, if we want to avoid re-uploading:
                if (formData.resumeUrl) {
                    submitData.append('resumeUrl', formData.resumeUrl);
                    submitData.append('resumeText', formData.resumeText);
                } else {
                    submitData.append('resume', resumeFile);
                }
            } else if (formData.resumeUrl) {
                submitData.append('resumeUrl', formData.resumeUrl);
                submitData.append('resumeText', formData.resumeText);
            }

            await api.post(API_ENDPOINTS.CANDIDATES.BASE, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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

                <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px dashed var(--primary)', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <Upload size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Auto-fill from Resume</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upload PDF to extract details</span>
                        <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
                    </label>
                    {parsing && <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Extracting info...</div>}
                </div>

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

const AddQuestionModal: React.FC<{ onClose: () => void, onSuccess: () => void, existingQuestion: Question | null }> = ({ onClose, onSuccess, existingQuestion }) => {
    const [formData, setFormData] = useState({
        text: existingQuestion?.text || '',
        domain: existingQuestion?.domain || 'Frontend',
        experienceLevel: existingQuestion?.experienceLevel || 'Fresher/Intern',
        difficulty: existingQuestion?.difficulty || 'Medium',
        type: existingQuestion?.type || 'MCQ',
        options: existingQuestion?.type === 'MCQ' ? (existingQuestion.options.length === 4 ? existingQuestion.options : ['', '', '', '']) : ['', '', '', ''],
        correctAnswers: existingQuestion?.correctAnswers || []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const toggleCorrectAnswer = (option: string) => {
        if (!option.trim()) return;
        // For MCQ, only one correct answer
        setFormData({ ...formData, correctAnswers: [option] });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.type === 'MCQ') {
            const hasEmpty = formData.options.some(o => o.trim() === '');
            if (hasEmpty) {
                setError('Please provide all 4 options for MCQ.');
                setLoading(false);
                return;
            }
            if (formData.correctAnswers.length === 0) {
                setError('Please select the correct answer.');
                setLoading(false);
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                options: formData.type === 'MCQ' ? formData.options : []
            };

            if (existingQuestion) {
                await api.patch(`${API_ENDPOINTS.QUESTIONS.BASE}/${existingQuestion._id}`, payload);
            } else {
                await api.post(API_ENDPOINTS.QUESTIONS.BASE, payload);
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save question');
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
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        {existingQuestion ? 'Edit Question' : 'Add Question'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{error}</div>}
                {success && (
                    <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} /> Question saved successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Question Text *</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            required
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
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
                        <div>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Type</label>
                            <select
                                className="input"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                required
                            >
                                <option value="MCQ">Multiple Choice</option>
                                <option value="Descriptive">Descriptive</option>
                            </select>
                        </div>
                    </div>

                    {formData.type === 'MCQ' && (
                        <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                Options (Select 1 correct answer)
                            </label>

                            {formData.options.map((option, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={option.trim() !== '' && formData.correctAnswers.includes(option)}
                                        onChange={() => toggleCorrectAnswer(option)}
                                        disabled={option.trim() === ''}
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        style={{ flex: 1 }}
                                        required
                                    />
                                </div>
                            ))}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                * Use the radio button to select the single correct answer.
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || success}>
                            {loading ? 'Saving...' : success ? 'Saved!' : existingQuestion ? 'Update Question' : 'Add Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.SETTINGS.BASE);
            if (res.data.length === 0) {
                // Seed defaults if empty
                await api.post(API_ENDPOINTS.SETTINGS.SEED, {});
                const reRes = await api.get(API_ENDPOINTS.SETTINGS.BASE);
                setSettings(reRes.data);
            } else {
                setSettings(res.data);
            }
        } catch (err) {
            setError('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: number) => {
        setSaving(true);
        try {
            await api.post(API_ENDPOINTS.SETTINGS.BASE, { key, value });
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
        } catch (err) {
            setError('Failed to update setting');
        } finally {
            setSaving(false);
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
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={24} /> Application Settings
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {loading ? <p>Loading settings...</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}

                        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} /> Difficulty Time Limits (seconds)
                            </h3>

                            {settings.filter(s => s.key.startsWith('time_limit_')).map(setting => (
                                <div key={setting.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ textTransform: 'capitalize', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {setting.key.split('_').pop()} Level
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ width: '80px', padding: '0.4rem' }}
                                            value={setting.value}
                                            onChange={(e) => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: parseInt(e.target.value) } : s))}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                            onClick={() => handleUpdate(setting.key, setting.value)}
                                            disabled={saving}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn" style={{ border: '1px solid var(--border-color)' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const BulkUploadModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select an Excel file first.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post(API_ENDPOINTS.QUESTIONS.BULK_UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccessMsg(res.data.message);
            if (res.data.errors) {
                setError(`Warnings: ${res.data.errors.join(', ')}`);
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload questions');
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
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Bulk Question Upload</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Required Excel Columns:</h3>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                        <li><strong>Question Text</strong>: The content of the question</li>
                        <li><strong>Domain</strong>: Frontend, Backend, etc.</li>
                        <li><strong>Experience Level</strong>: Fresher/Intern, 1-2 years, etc.</li>
                        <li><strong>Difficulty</strong>: Easy, Medium, Hard</li>
                        <li><strong>Type</strong>: MCQ or Descriptive</li>
                        <li><strong>Option 1-4</strong>: Only required for MCQ</li>
                        <li><strong>Correct Answer</strong>: Text matching one of the options (for MCQ)</li>
                    </ul>
                </div>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{error}</div>}
                {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.25rem' }}>{successMsg}</div>}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '1rem', cursor: 'pointer' }}>
                        <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{file ? file.name : 'Choose Excel File (.xlsx)'}</span>
                        <input type="file" accept=".xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>Cancel</button>
                    <button
                        onClick={handleUpload}
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={loading || !file}
                    >
                        {loading ? 'Processing...' : 'Start Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddHRModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post(API_ENDPOINTS.AUTH.REGISTER, { ...formData, role: 'hr' });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Failed to add HR member');
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
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Add HR Member</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Name</label>
                        <input type="text" className="input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Email</label>
                        <input type="email" className="input" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Password</label>
                        <input type="password" className="input" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Adding...' : 'Add HR'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
