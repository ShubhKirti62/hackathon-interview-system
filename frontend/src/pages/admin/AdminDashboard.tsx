import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Users, BarChart, FileText, CheckCircle, X, Camera, ChevronLeft, ChevronRight, Shield, Star, Filter, Phone, Mail, File, ExternalLink, Settings, Clock, PieChart as PieChartIcon, TrendingUp, Send, Image as ImageIcon, Menu } from 'lucide-react';
import ScreenshotViewerModal from '../../components/Modals/ScreenshotViewerModal';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { APP_ROUTES } from '../../routes';

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
    type: 'Descriptive';
    verified: boolean;
    keywords?: string[];
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
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalCandidates: 0,
        interviewsCompleted: 0,
        resumesProcessed: 0,
        totalQuestions: 0,
        totalHRs: 0
    });
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [filterReferred, setFilterReferred] = useState(false);
    const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'hr' | 'slots'>('candidates');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [hrs, setHrs] = useState<User[]>([]);
    const [interviewers, setInterviewers] = useState<User[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showScreenshotModal, setShowScreenshotModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<any>(null);
    const [viewingScreenshotsCandidate, setViewingScreenshotsCandidate] = useState<{id: string, name: string} | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);


    const chartData = useMemo(() => {
        const statuses = ['Pending', 'Shortlisted', 'Rejected', 'Interviewed'];
        const statusCounts = statuses.map(status => ({
            name: status,
            value: candidates.filter(c => c.status === status).length
        }));

        const domains = [...new Set(candidates.map(c => c.domain))];
        const domainCounts = domains.map(domain => ({
            name: domain,
            count: candidates.filter(c => c.domain === domain).length
        }));

        const dates = [...new Set(candidates.map(c => new Date(c.createdAt).toLocaleDateString()))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const trendData = dates.map(date => ({
            name: date,
            candidates: candidates.filter(c => new Date(c.createdAt).toLocaleDateString() === date).length
        }));

        return { statusCounts, domainCounts, trendData };
    }, [candidates]);

    const COLORS = ['#F59E0B', '#3B82F6', '#EF4444', '#10B981'];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch core data available to all roles
            const coreRequests = await Promise.allSettled([
                api.get(API_ENDPOINTS.CANDIDATES.BASE),
                api.get(API_ENDPOINTS.SESSIONS.LIST),
                api.get(API_ENDPOINTS.QUESTIONS.BASE)
            ]);

            const candidatesRes = coreRequests[0].status === 'fulfilled' ? coreRequests[0].value : { data: [] };
            const sessionsRes = coreRequests[1].status === 'fulfilled' ? coreRequests[1].value : { data: [] };
            const questionsRes = coreRequests[2].status === 'fulfilled' ? coreRequests[2].value : { data: [] };

            setCandidates(candidatesRes.data || []);
            setQuestions(questionsRes.data || []);

            // Fetch secondary data
            const secondaryRequests = await Promise.allSettled([
                api.get(API_ENDPOINTS.SLOTS.BASE),
                api.get(`${API_ENDPOINTS.AUTH.USERS}?role=interviewer`)
            ]);

            const slotsRes = secondaryRequests[0].status === 'fulfilled' ? secondaryRequests[0].value : { data: [] };
            const interviewersRes = secondaryRequests[1].status === 'fulfilled' ? secondaryRequests[1].value : { data: [] };

            setSlots(slotsRes.data || []);

            // Robust Interviewer list processing
            const interviewerData = interviewersRes.data;
            let validatedInterviewers: User[] = [];
            if (Array.isArray(interviewerData)) {
                validatedInterviewers = interviewerData;
            } else if (interviewerData && typeof interviewerData === 'object') {
                if (interviewerData._id && interviewerData.name) {
                    validatedInterviewers = [interviewerData as User];
                } else {
                    validatedInterviewers = Object.values(interviewerData)
                        .filter((v: any) => v && typeof v === 'object' && v._id && v.name) as User[];
                }
            }
            console.log('Processed Interviewers:', validatedInterviewers);
            setInterviewers(validatedInterviewers);

            // Handle HR list for Admin and HR users (Robustly)
            let hrList: User[] = [];
            try {
                const hrsRes = await api.get(`${API_ENDPOINTS.AUTH.USERS}?role=hr`);
                const hrData = hrsRes.data;
                if (Array.isArray(hrData)) {
                    hrList = hrData;
                } else if (hrData && typeof hrData === 'object') {
                    if (hrData._id && hrData.name) {
                        hrList = [hrData as User];
                    } else {
                        hrList = Object.values(hrData)
                            .filter((v: any) => v && typeof v === 'object' && v._id && v.name) as User[];
                    }
                }
                console.log('Processed HRs:', hrList);
                setHrs(hrList);
            } catch (e) {
                console.error('Error fetching HR list:', e);
            }

            const completedInterviews = (sessionsRes.data || []).filter((s: any) => s.status === 'Completed').length;
            const resumesCount = (candidatesRes.data || []).filter((c: any) => c.resumeUrl).length;

            setStats({
                totalCandidates: (candidatesRes.data || []).length,
                interviewsCompleted: completedInterviews,
                resumesProcessed: resumesCount,
                totalQuestions: (questionsRes.data || []).length,
                totalHRs: hrList.length + validatedInterviewers.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to remove access for this team member?')) return;
        try {
            await api.delete(`${API_ENDPOINTS.AUTH.USERS}/${userId}`);
            fetchDashboardData();
        } catch (err: any) {
            showToast.error(err.response?.data?.msg || 'Failed to remove user access');
        }
    };

    const handleViewInterview = async (candidateId: string) => {
        try {
            // Get interviews for this candidate
            const interviewsRes = await api.get(`${API_ENDPOINTS.INTERVIEWS.BY_ID}?candidateId=${candidateId}`);
            const interviews = interviewsRes.data;
            
            if (interviews.length === 0) {
                showToast.info('No interviews found for this candidate');
                return;
            }
            
            // Get the most recent completed interview
            const latestInterview = interviews
                .filter(i => i.status === 'Completed')
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                
            if (!latestInterview) {
                showToast.info('No completed interviews found for this candidate');
                return;
            }
            
            // Get detailed interview data
            const interviewDetailsRes = await api.get(API_ENDPOINTS.INTERVIEWS.GET_DETAILS(latestInterview._id));
            setSelectedInterview(interviewDetailsRes.data);
            setShowInterviewModal(true);
        } catch (err: any) {
            showToast.error('Failed to fetch interview details');
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await api.delete(`${API_ENDPOINTS.QUESTIONS.BASE}/${id}`);
            fetchDashboardData();
        } catch (err: any) {
            showToast.error(err.response?.data?.error || 'Failed to delete question');
        }
    };

    const handleDeleteCandidate = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this candidate?')) return;
        try {
            await api.delete(`${API_ENDPOINTS.CANDIDATES.BASE}/${id}`);
            fetchDashboardData();
        } catch (err: any) {
            showToast.error(err.response?.data?.error || 'Failed to delete candidate');
        }
    };

    const handleInviteClick = () => {
        setShowInviteModal(true);
    };

    return (
        <div className="admin-dashboard">
            {/* Mobile Overlay */}
            <div
                className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={28} style={{ color: 'var(--primary)' }} />
                    <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Admin Dashboard
                    </h2>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={() => { setActiveTab('candidates'); setSidebarOpen(false); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: activeTab === 'candidates' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: activeTab === 'candidates' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'candidates' ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={20} /> Candidates Management
                    </button>

                    <button
                        onClick={() => { setActiveTab('questions'); setSidebarOpen(false); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: activeTab === 'questions' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: activeTab === 'questions' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'questions' ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={20} /> Questions Library
                    </button>

                    <button
                        onClick={() => { setActiveTab('hr'); setSidebarOpen(false); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: activeTab === 'hr' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: activeTab === 'hr' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'hr' ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={20} /> Team Management
                    </button>

                    <button
                        onClick={() => { setActiveTab('slots'); setSidebarOpen(false); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: activeTab === 'slots' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: activeTab === 'slots' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'slots' ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Clock size={20} /> Round 2 Slots
                    </button>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Settings size={20} /> Settings
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main-content">
                <div className="admin-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                                {activeTab === 'candidates' ? 'Candidates Oversight' :
                                    activeTab === 'questions' ? 'Questions Bank' :
                                        activeTab === 'hr' ? 'Team Management' : 'Interview Scheduling'}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                {activeTab === 'candidates' ? 'Track and manage candidate progress and referrals.' :
                                    activeTab === 'questions' ? 'Manage your library of technical and conceptual questions.' :
                                        activeTab === 'hr' ? 'Add or remove HR team members and manage access.' : 'Coordinate and schedule technical interaction slots.'}
                            </p>
                        </div>
                    </div>

                    <div className="admin-header-actions">
                        {activeTab === 'candidates' ? (
                            <button
                                className="btn btn-primary"
                                style={{ gap: '0.5rem' }}
                                onClick={() => setShowAddModal(true)}
                            >
                                <Plus size={18} /> Add Candidate
                            </button>
                        ) : (activeTab === 'questions') ? (
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
                        ) : (activeTab === 'hr') ? (
                            <button
                                className="btn btn-primary"
                                style={{ gap: '0.5rem' }}
                                onClick={() => setShowAddUserModal(true)}
                            >
                                <Plus size={18} /> Add Team Member
                            </button>
                        ) : (activeTab === 'slots') ? (
                            <button
                                className="btn btn-primary"
                                style={{ gap: '0.5rem' }}
                                onClick={() => setShowSlotModal(true)}
                            >
                                <Plus size={18} /> Create Slot
                            </button>
                        ) : null}
                    </div>
                </div>

                {activeTab === 'candidates' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card admin-chart-card" style={{ height: '350px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Candidate Status</h3>
                            </div>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={chartData.statusCounts}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.statusCounts.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card admin-chart-card" style={{ height: '350px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Candidates by Domain</h3>
                            </div>
                            <ResponsiveContainer width="100%" height="80%">
                                <ReBarChart data={chartData.domainCounts}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card admin-chart-card" style={{ height: '350px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Registration Trend</h3>
                            </div>
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={chartData.trendData}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="candidates" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
                            <StatCard icon={<File />} label="Descriptive Questions" value={questions.length.toString()} />
                        </>
                    )}
                    {activeTab === 'hr' && (
                        <>
                            <StatCard icon={<Users />} label="Total Team Members" value={stats.totalHRs.toString()} />
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
                                <div className="admin-table-container" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Email</th>
                                                <th style={{ padding: '0.75rem' }}>Domain</th>
                                                <th style={{ padding: '0.75rem' }}>Experience</th>
                                                <th style={{ padding: '0.75rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem' }}>Type</th>
                                                <th style={{ padding: '0.75rem' }}>Handled By</th>
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
                                                        isAdmin={true}
                                                        onView={() => setSelectedCandidate(candidate)}
                                                        onDelete={() => handleDeleteCandidate(candidate._id)}
                                                        onViewScreenshots={() => {
                                                            setViewingScreenshotsCandidate({ id: candidate._id, name: candidate.name });
                                                            setShowScreenshotModal(true);
                                                        }}
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
                                <div className="admin-table-container" style={{ overflowX: 'auto' }}>
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
                                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingQuestion(q);
                                                                    setShowQuestionModal(true);
                                                                }}
                                                                style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteQuestion(q._id)}
                                                                style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'hr' ? (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Team Management</h2>
                            {(hrs.length + interviewers.length) === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No team members found.</p>
                            ) : (
                                <div className="admin-table-container" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Email</th>
                                                <th style={{ padding: '0.75rem' }}>Role</th>
                                                <th style={{ padding: '0.75rem' }}>Joined</th>
                                                <th style={{ padding: '0.75rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...hrs, ...interviewers].map((member) => (
                                                <tr key={member._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '0.75rem' }}>{member.name}</td>
                                                    <td style={{ padding: '0.75rem' }}>{member.email}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '4px',
                                                            backgroundColor: member.role === 'admin' ? 'var(--primary)' : member.role === 'hr' ? 'var(--success)' : 'var(--warning)',
                                                            color: 'white',
                                                            textTransform: 'uppercase',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{new Date(member.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <button
                                                            onClick={() => handleRemoveUser(member._id)}
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
                    ) : (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Round 2 Slots</h2>
                            {slots.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No slots created yet.</p>
                            ) : (
                                <div className="admin-table-container" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem' }}>Interviewer</th>
                                                <th style={{ padding: '0.75rem' }}>Time</th>
                                                <th style={{ padding: '0.75rem' }}>Candidate</th>
                                                <th style={{ padding: '0.75rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slots.map((slot) => (
                                                <tr key={slot._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                                                    <td style={{ padding: '0.75rem' }}>{slot.interviewerId?.name}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        {new Date(slot.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{slot.candidateId?.name || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unbooked</span>}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '999px',
                                                            fontSize: '0.7rem',
                                                            backgroundColor: slot.status === 'Available' ? 'rgba(59, 130, 246, 0.1)' : slot.status === 'Booked' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                            color: slot.status === 'Available' ? 'var(--primary)' : slot.status === 'Booked' ? 'var(--warning)' : 'var(--success)'
                                                        }}>
                                                            {slot.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        {slot.status === 'Booked' && (() => {
                                                            const startTime = new Date(slot.startTime).getTime();
                                                            const endTime = new Date(slot.endTime).getTime();
                                                            const isLive = now.getTime() >= (startTime - 5 * 60 * 1000) && now.getTime() <= endTime;

                                                            return (
                                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                                    <button
                                                                        onClick={() => navigate(APP_ROUTES.INTERVIEW.MEETING.replace(':id', slot._id))}
                                                                        style={{
                                                                            color: isLive ? 'white' : 'var(--success)',
                                                                            fontSize: '0.8rem',
                                                                            fontWeight: 'bold',
                                                                            backgroundColor: isLive ? 'var(--success)' : 'transparent',
                                                                            border: isLive ? 'none' : 'none',
                                                                            padding: isLive ? '0.4rem 0.8rem' : '0',
                                                                            borderRadius: '0.5rem',
                                                                            cursor: 'pointer',
                                                                            boxShadow: isLive ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                                                                        }}
                                                                    >
                                                                        Join {isLive ? 'Live Interview' : 'Meeting'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedSlot(slot);
                                                                            setShowFeedbackModal(true);
                                                                        }}
                                                                        style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                                                    >
                                                                        Enter Feedback
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
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
            {showAddUserModal && (
                <AddUserModal
                    onClose={() => setShowAddUserModal(false)}
                    onSuccess={fetchDashboardData}
                />
            )}
            {showSlotModal && (
                <AddSlotModal
                    onClose={() => setShowSlotModal(false)}
                    onSuccess={fetchDashboardData}
                    interviewers={interviewers}
                />
            )}
            {showFeedbackModal && selectedSlot && (
                <FeedbackModal
                    slot={selectedSlot}
                    onClose={() => setShowFeedbackModal(false)}
                    onSuccess={fetchDashboardData}
                    type="admin"
                />
            )}
            {showInviteModal && selectedCandidate && (
                <SendInviteModal
                    candidate={selectedCandidate}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={fetchDashboardData}
                />
            )}
            {showInterviewModal && selectedInterview && (
                <InterviewDetailsModal
                    interview={selectedInterview}
                    onClose={() => setShowInterviewModal(false)}
                />
            )}
            {showScreenshotModal && viewingScreenshotsCandidate && (
                <ScreenshotViewerModal
                    candidateId={viewingScreenshotsCandidate.id}
                    candidateName={viewingScreenshotsCandidate.name}
                    onClose={() => setShowScreenshotModal(false)}
                />
            )}
            {selectedCandidate && (
                <ViewCandidateModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onSuccess={fetchDashboardData}
                    onInvite={handleInviteClick}
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

const TableRow: React.FC<{ candidate: Candidate, isAdmin: boolean, onView: () => void, onDelete: () => void, onViewScreenshots?: () => void }> = ({ candidate, isAdmin, onView, onDelete, onViewScreenshots }) => {
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
                                Admin
                            </div>
                        </div>
                    ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending</span>
                    )}
                </td>
            )}
            <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onView}
                        style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                        View
                    </button>
                    {onViewScreenshots && (candidate.status === 'Interviewed' || candidate.status === 'Shortlisted' || candidate.status === 'Rejected' || candidate.status === '2nd Round Qualified' || candidate.status === 'Slot_Booked') && (
                         <button
                            onClick={onViewScreenshots}
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="View Screenshots"
                        >
                            <ImageIcon size={18} />
                        </button>
                    )}
                    {(candidate.status === 'Interviewed' || candidate.status === 'Shortlisted' || candidate.status === 'Rejected') && (
                        <button
                            onClick={() => handleViewInterview(candidate._id)}
                            style={{ color: 'var(--success)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="View Interview Details"
                        >
                            <FileText size={18} />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        style={{ color: 'var(--error)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
};

const ViewCandidateModal: React.FC<{ candidate: Candidate, onClose: () => void, onSuccess: () => void, onInvite: () => void }> = ({ candidate, onClose, onSuccess, onInvite }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [remarks, setRemarks] = useState(candidate.remarks || '');
    const [activeTab, setActiveTab] = useState<'info' | 'resume' | 'status'>('info');

    const getNextPendingItem = (status: string) => {
        switch (status) {
            case 'Profile Submitted': return 'Send Invitation Mail';
            case 'Interview 1st Round Pending': return 'Waiting for Interview Results';
            case '1st Round Completed': return 'Result: Send 2nd Round Invitiation (Qualified) or Reject';
            case '2nd Round Qualified': return 'Final Offer / Decision'; 
            case 'Rejected': return 'None (Archived)';
            default: return 'Unknown';
        }
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
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${baseUrl}/${path.replace(/\\/g, '/')}`;
    };

    return (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
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
                                </div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Decision Remarks</h3>
                                <textarea className="input" placeholder="Enter reason for approval or rejection..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} disabled={candidate.status === 'Shortlisted' || candidate.status === 'Rejected'} style={{ resize: 'none' }} />
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
                    ) : (
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Current Status</h3>
                            <div style={{ 
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '2rem',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                backgroundColor: 
                                    candidate.status === '2nd Round Qualified' ? 'rgba(16, 185, 129, 0.1)' : 
                                    candidate.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 
                                    'rgba(59, 130, 246, 0.1)',
                                color: 
                                    candidate.status === '2nd Round Qualified' ? 'var(--success)' : 
                                    candidate.status === 'Rejected' ? 'var(--error)' : 
                                    'var(--primary)',
                                marginBottom: '2rem'
                            }}>
                                {candidate.status}
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
                        
                        {candidate.status === 'Profile Submitted' && (
                            <button onClick={onInvite} className="btn" style={{ background: 'var(--primary)', border: 'none', color: 'white' }} disabled={loading}>
                                {loading ? 'Processing...' : 'Send Invitation Mail'}
                            </button>
                        )}

                        {candidate.status === 'Interview 1st Round Pending' && (
                            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Waiting for interview results...</div>
                        )}

                        {candidate.status === '1st Round Completed' && (
                            <>
                                <button onClick={() => handleStatusUpdate('2nd Round Qualified')} className="btn" style={{ background: 'var(--success)', border: 'none', color: 'white' }} disabled={loading}>
                                    {loading ? 'Processing...' : 'Send 2nd Round Invite'}
                                </button>
                                <button onClick={() => handleStatusUpdate('Rejected')} className="btn" style={{ background: 'var(--error)', border: 'none', color: 'white' }} disabled={loading}>
                                    {loading ? 'Processing...' : 'Reject'}
                                </button>
                            </>
                        )}

                        {/* Pending fallbacks */}
                        {(candidate.status === 'Pending' || candidate.status === 'Shortlisted') && (
                             <button onClick={() => handleStatusUpdate('Profile Submitted')} className="btn" style={{ background: 'var(--primary)', border: 'none', color: 'white' }} disabled={loading}>
                                {loading ? 'Processing...' : 'Move to Profile Submitted'}
                            </button>
                        )}
                        
                        {(candidate.status === '2nd Round Qualified' || candidate.status === 'Rejected') && (
                            <div style={{ color: candidate.status === '2nd Round Qualified' ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>Decision: {candidate.status}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AddCandidateModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', domain: 'Frontend', experienceLevel: 'Fresher/Intern', internalReferred: false, noticePeriod: 30 });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState('');

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
        setLoading(true);
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v.toString()));
        if (resumeFile) fd.append('resume', resumeFile);
        try {
            await api.post(API_ENDPOINTS.CANDIDATES.BASE, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '0.75rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={32} style={{ color: 'var(--primary)' }} />
                            <div style={{ fontWeight: '600' }}>Auto-fill from Resume</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PDF or Word (DOCX)</div>
                            <input type="file" accept=".pdf,.docx,.doc" onChange={handleResumeUpload} style={{ display: 'none' }} />
                        </label>
                        {parsing && <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '500' }}>Analyzing resume...</div>}
                    </div>

                    <form id="add-candidate-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label><input className="input" placeholder="e.g. John Doe" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label><input className="input" type="email" placeholder="john@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Phone Number</label><input className="input" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Target Domain</label>
                                <select className="input" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}>
                                    <option value="Frontend">Frontend</option><option value="Backend">Backend</option><option value="Full Stack">Full Stack</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Experience Level</label>
                                <select className="input" value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}>
                                    <option value="Fresher/Intern">Fresher/Intern</option><option value="1-2 years">1-2 years</option><option value="2-4 years">2-4 years</option>
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
                    <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: 'var(--text-primary)' }}>Cancel</button>
                    <button type="submit" form="add-candidate-form" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Adding...' : 'Add Candidate'}</button>
                </div>
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
        type: 'Descriptive',
        keywords: existingQuestion?.keywords?.join(', ') || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                type: 'Descriptive', // Always Descriptive for AI evaluation
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
            };

            if (existingQuestion) await api.patch(`${API_ENDPOINTS.QUESTIONS.BASE}/${existingQuestion._id}`, payload);
            else await api.post(API_ENDPOINTS.QUESTIONS.BASE, payload);
            onSuccess(); onClose();
        } catch (err) { showToast.error('Failed to save question'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>{existingQuestion ? 'Edit' : 'Add'} Question</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <form id="question-form" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Question Text</label>
                            <textarea className="input" placeholder="Type your question here..." required value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} style={{ minHeight: '120px', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Domain</label>
                                <select className="input" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}>
                                    <option value="Frontend">Frontend</option><option value="Backend">Backend</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                                <select className="input" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Keyword field - Required for AI evaluation */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                Mandatory Keywords / Concepts <span style={{fontSize: '0.7em', color: 'var(--primary)'}}>(AI Grading)</span>
                            </label>
                            <input 
                                className="input" 
                                placeholder="e.g. Virtual DOM, State, Props (comma separated)" 
                                value={formData.keywords} 
                                onChange={e => setFormData({ ...formData, keywords: e.target.value })} 
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                The AI will check for these specific terms when evaluating answers.
                            </div>
                        </div>
                    </form>
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'right'
                }}>
                    <button type="submit" form="question-form" className="btn btn-primary" style={{ minWidth: '150px' }} disabled={loading}>
                        {loading ? 'Saving...' : existingQuestion ? 'Update Question' : 'Save Question'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState<Setting[]>([]);
    useEffect(() => { api.get(API_ENDPOINTS.SETTINGS.BASE).then(res => setSettings(res.data)); }, []);
    const handleUpdate = (key: string, value: number) => api.post(API_ENDPOINTS.SETTINGS.BASE, { key, value }).then(() => showToast.success('Settings updated successfully!'));

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
                    <h2 style={{ margin: 0 }}>System Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {settings.map(s => (
                            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>{s.key}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.description}</div>
                                </div>
                                <input type="number" className="input" style={{ width: '120px', fontWeight: 'bold' }} defaultValue={s.value} onBlur={e => handleUpdate(s.key, parseInt(e.target.value))} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BulkUploadModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const handleUpload = async () => {
        if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try { await api.post(API_ENDPOINTS.QUESTIONS.BULK_UPLOAD, fd); onSuccess(); onClose(); } catch (err) { showToast.error('Upload failed'); }
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Bulk Upload</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '0.75rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', marginBottom: '1rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <File size={32} style={{ color: 'var(--primary)' }} />
                            <div style={{ fontWeight: '600' }}>Click to select spreadsheet</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supported formats: .xlsx, .xls</div>
                            <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                        </label>
                        {file && <div style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--success)' }}>Selected: {file.name}</div>}
                    </div>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button onClick={handleUpload} className="btn btn-primary" style={{ width: '100%' }} disabled={!file}>
                        Start System Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddUserModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'hr' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await api.post(API_ENDPOINTS.AUTH.REGISTER, formData); onSuccess(); onClose(); } catch (err) { showToast.error('Failed to create user'); }
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Add Team Member</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <form id="add-user-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label><input className="input" placeholder="Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label><input className="input" type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Password</label><input className="input" type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>System Role</label>
                                <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="hr">HR Manager</option>
                                    <option value="interviewer">Technical Interviewer</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button type="submit" form="add-user-form" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                </div>
            </div>
        </div>
    );
};

const AddSlotModal: React.FC<{ onClose: () => void, onSuccess: () => void, interviewers: User[] }> = ({ onClose, onSuccess, interviewers }) => {
    const [formData, setFormData] = useState({ interviewerId: '', startTime: '', endTime: '' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await api.post(API_ENDPOINTS.SLOTS.BASE, formData); onSuccess(); onClose(); } catch (err) { showToast.error('Failed to create slot'); }
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Select Interviewer</label>
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
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Start Time</label><input type="datetime-local" className="input" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} /></div>
                            <div><label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>End Time</label><input type="datetime-local" className="input" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} /></div>
                        </div>
                    </form>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button type="submit" form="create-slot-form" className="btn btn-primary" style={{ width: '100%' }}>Create Official Slot</button>
                </div>
            </div>
        </div>
    );
};

const FeedbackModal: React.FC<{ slot: any, onClose: () => void, onSuccess: () => void, type: 'admin' | 'candidate' }> = ({ slot, onClose, onSuccess, type }) => {
    const [formData, setFormData] = useState({ score: 0, remarks: '' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await api.post(API_ENDPOINTS.SLOTS.FEEDBACK(slot._id), { ...formData, type }); onSuccess(); onClose(); } catch (err) { showToast.error('Failed to submit feedback'); }
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
                    <button type="submit" form="feedback-form" className="btn btn-primary" style={{ width: '100%' }}>Submit Official Feedback</button>
                </div>
            </div>
        </div>
    );
};




 const SendInviteModal: React.FC<{ 
     candidate: Candidate; 
     onClose: () => void; 
     onSuccess: () => void;
 }> = ({ candidate, onClose, onSuccess }) => {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState(false);
     
     const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
     const [time, setTime] = useState('10:00');
     const [link, setLink] = useState('https://meet.google.com/xyz-abc-def');
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
             <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                 <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
                     <div style={{ color: 'var(--success)', fontSize: '3rem', marginBottom: '1rem' }}><CheckCircle /></div>
                     <h3>Invitation Sent!</h3>
                     <p>Candidate has been notified and status updated.</p>
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
                             <input type="date" className="input" required value={date} onChange={e => setDate(e.target.value)} />
                         </div>
                         <div>
                             <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Time</label>
                             <input type="time" className="input" required value={time} onChange={e => setTime(e.target.value)} />
                         </div>
                     </div>
 
                     <div>
                         <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Meeting Link</label>
                         <input type="url" className="input" placeholder="https://meet.google.com/..." required value={link} onChange={e => setLink(e.target.value)} />
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

const InterviewDetailsModal: React.FC<{ interview: any, onClose: () => void }> = ({ interview, onClose }) => {
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
                    {/* Interview Summary */}
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

                    {/* Questions and Answers */}
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

export default AdminDashboard;
