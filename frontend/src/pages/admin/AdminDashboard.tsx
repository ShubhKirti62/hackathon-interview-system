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

const AddQuestionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        text: '',
        domain: 'Frontend',
        experienceLevel: 'Fresher/Intern',
        difficulty: 'Medium',
        type: 'MCQ',
        options: ['', '', '', ''],
        correctAnswers: [] as string[]
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
        // If option is empty, don't toggle
        if (!option.trim()) return;

        const currentCorrect = formData.correctAnswers;
        if (currentCorrect.includes(option)) {
            setFormData({ ...formData, correctAnswers: currentCorrect.filter(a => a !== option) });
        } else {
            setFormData({ ...formData, correctAnswers: [...currentCorrect, option] });
        }
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const removeOption = (index: number) => {
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.type === 'MCQ') {
            const validOptions = formData.options.filter(o => o.trim() !== '');
            if (validOptions.length < 2) {
                setError('Please provide at least 2 valid options for MCQ.');
                setLoading(false);
                return;
            }
            if (formData.correctAnswers.length === 0) {
                setError('Please select at least one correct answer.');
                setLoading(false);
                return;
            }
            // Ensure correct answers are actually in the valid options
            const validCorrectAnswers = formData.correctAnswers.filter(ans => validOptions.includes(ans));
            if (validCorrectAnswers.length === 0) {
                setError('Selected correct answer is no longer a valid option.');
                setLoading(false);
                return;
            }
        }

        try {
            // Filter out empty options before sending
            const payload = {
                ...formData,
                options: formData.type === 'MCQ' ? formData.options.filter(o => o.trim() !== '') : []
            };

            await api.post(API_ENDPOINTS.QUESTIONS.BASE, payload);
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
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
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
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                                Options (Select correct answers)
                            </label>

                            {formData.options.map((option, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={option.trim() !== '' && formData.correctAnswers.includes(option)}
                                        onChange={() => toggleCorrectAnswer(option)}
                                        disabled={option.trim() === ''}
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                        title="Mark as correct answer"
                                    />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    {formData.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            style={{ color: 'var(--error)', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}
                                            title="Remove option"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addOption}
                                className="btn"
                                style={{ marginTop: '0.5rem', border: '1px dashed var(--border-color)', width: '100%', color: 'var(--text-secondary)' }}
                            >
                                <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Option
                            </button>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                * Check the box next to an option to mark it as a correct answer.
                            </div>
                        </div>
                    )}

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
