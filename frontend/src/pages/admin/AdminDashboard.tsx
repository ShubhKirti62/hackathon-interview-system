import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    FileText,
    Shield,
    Settings as SettingsIcon,
    Menu,
    Inbox as InboxIcon,
    AlertTriangle,
    Calendar as CalendarIcon,
    LogOut,
    Plus,
} from 'lucide-react';

// Components
import ThemeToggle from '../../components/ThemeToggle';

// Tabs
import CandidatesTab from './tabs/CandidatesTab';
import QuestionsTab from './tabs/QuestionsTab';
import InterviewSlotsTab from './tabs/InterviewSlotsTab';
import EmailScannerTab from './tabs/EmailScannerTab';
import FraudDetectionTab from './tabs/FraudDetectionTab';

// Modals
import { ViewCandidateModal, AddCandidateModal, EditCandidateModal } from '../../components/admin/modals/CandidateModals';
import { AddQuestionModal, SettingsModal, BulkUploadModal } from '../../components/admin/modals/QuestionAndSettingsModals';
import { AddSlotModal, FeedbackModal, SendInviteModal, InterviewDetailsModal } from '../../components/admin/modals/InterviewModals';
import ScreenshotViewerModal from '../../components/Modals/ScreenshotViewerModal';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

// Services & Utils
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { formatCandidateStatus } from '../../utils/statusFormatter';

// Types
import type { Candidate, Question, Stats, User } from './types';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();

    // Core State
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [interviewers, setInterviewers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalCandidates: 0,
        interviewsCompleted: 0,
        resumesProcessed: 0,
        totalQuestions: 0,
        totalHRs: 0
    });

    // UI State
    const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'slots' | 'email-scanner' | 'fraud-detection'>('candidates');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [filterReferred, setFilterReferred] = useState(false);

    // Modal State
    const [modalState, setModalState] = useState<{
        viewCandidate: Candidate | null;
        addCandidate: boolean;
        editCandidate: Candidate | null;
        addQuestion: Question | null;
        bulkQuestion: boolean;
        settings: boolean;
        addSlot: boolean;
        feedback: any | null;
        sendInvite: Candidate | null;
        interviewDetails: any | null;
        screenshotViewer: { id: string, name: string } | null;
    }>({
        viewCandidate: null,
        addCandidate: false,
        editCandidate: null,
        addQuestion: null,
        bulkQuestion: false,
        settings: false,
        addSlot: false,
        feedback: null,
        sendInvite: null,
        interviewDetails: null,
        screenshotViewer: null,
    });

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        type: 'clear_all_candidates' | 'delete_candidate' | 'delete_question' | 'clear_email_logs' | 'confirm_fraud' | 'delete_fraud_alert' | null;
        title: string;
        message: string;
        confirmLabel: string;
        data?: any;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        confirmLabel: '',
        isDangerous: false
    });

    // Email Scanner State
    const [emailScanner, setEmailScanner] = useState({
        status: {
            isRunning: false,
            isScanning: false,
            lastScanTime: null as string | null,
            totalProcessed: 0,
            lastError: null as string | null,
            counts: { processed: 0, failed: 0, duplicate: 0 }
        },
        logs: [] as any[],
        totalLogs: 0,
        page: 1
    });

    // Fraud Detection State
    const [fraud, setFraud] = useState({
        alerts: [] as any[],
        stats: { total: 0, pending: 0, byType: {}, bySeverity: {} },
        total: 0,
        page: 1
    });

    const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6B7280'];

    // Data Fetching
    const fetchDashboardData = async () => {
        try {
            const [candidatesRes, questionsRes, slotsRes, interviewersRes, hrsRes] = await Promise.all([
                api.get(API_ENDPOINTS.CANDIDATES.BASE),
                api.get(API_ENDPOINTS.QUESTIONS.BASE),
                api.get(API_ENDPOINTS.SLOTS.BASE),
                api.get(`${API_ENDPOINTS.AUTH.USERS}?role=admin`),
                api.get(`${API_ENDPOINTS.AUTH.USERS}?role=admin`).catch(() => ({ data: [] }))
            ]);

            const candidatesList = candidatesRes.data || [];
            const questionsList = questionsRes.data || [];
            const slotsList = slotsRes.data || [];

            const processUserList = (data: any): User[] => {
                if (Array.isArray(data)) return data;
                if (data && typeof data === 'object') {
                    if (data._id && data.name) return [data];
                    return Object.values(data).filter((v: any) => v && typeof v === 'object' && v._id && v.name) as User[];
                }
                return [];
            };

            const validatedInterviewers = processUserList(interviewersRes.data);
            const validatedHRs = processUserList(hrsRes.data);

            setCandidates(candidatesList);
            setQuestions(questionsList);
            setSlots(slotsList);
            setInterviewers(validatedInterviewers);

            const interviewedCount = candidatesList.filter((c: any) => c.overallScore != null && c.overallScore > 0).length;
            const resumesCount = candidatesList.filter((c: any) => (c.resumeUrl && c.resumeUrl.trim() !== '') || (c.resumeText && c.resumeText.trim() !== '')).length;

            setStats({
                totalCandidates: candidatesList.length,
                interviewsCompleted: interviewedCount,
                resumesProcessed: resumesCount,
                totalQuestions: questionsList.length,
                totalHRs: validatedHRs.length + validatedInterviewers.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchEmailScannerStatus = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.EMAIL_RESUME.STATUS);
            setEmailScanner(prev => ({ ...prev, status: res.data }));
        } catch (err) {
            console.error('Failed to fetch email scanner status:', err);
        }
    };

    const fetchEmailLogs = async (page = emailScanner.page) => {
        try {
            const res = await api.get(`${API_ENDPOINTS.EMAIL_RESUME.LOGS}?page=${page}&limit=20`);
            setEmailScanner(prev => ({
                ...prev,
                logs: res.data.logs || [],
                totalLogs: res.data.total || 0,
                page
            }));
        } catch (err) {
            console.error('Failed to fetch email logs:', err);
        }
    };

    const fetchFraudAlerts = async (page = fraud.page) => {
        try {
            const res = await api.get(`${API_ENDPOINTS.FRAUD.ALERTS}?page=${page}&limit=20`);
            setFraud(prev => ({
                ...prev,
                alerts: res.data.alerts || [],
                total: res.data.total || 0,
                page
            }));
        } catch (err) {
            console.error('Failed to fetch fraud alerts:', err);
        }
    };

    const fetchFraudStats = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.FRAUD.STATS);
            setFraud(prev => ({ ...prev, stats: res.data }));
        } catch (err) {
            console.error('Failed to fetch fraud stats:', err);
        }
    };

    // Effects
    useEffect(() => {
        fetchDashboardData();
        fetchFraudStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'email-scanner') {
            fetchEmailScannerStatus();
            fetchEmailLogs(1);

            const interval = setInterval(() => {
                // If it's already scanning, we want frequent updates
                // If auto-scan is running, we wait for results
                // If nothing is happening, we don't need to poll aggressively
                const isScanning = emailScanner.status.isScanning;
                const isRunning = emailScanner.status.isRunning;

                if (isScanning) {
                    // Fast polling (5s) ONLY while a scan is actively processing emails
                    fetchEmailScannerStatus();
                    fetchEmailLogs();
                } else if (isRunning) {
                    // Slow polling (1 min) just to check for new auto-scan results
                    fetchEmailScannerStatus();
                    fetchEmailLogs();
                }
            }, emailScanner.status.isScanning ? 5000 : 60000);

            return () => clearInterval(interval);
        }
    }, [activeTab, emailScanner.status.isScanning, emailScanner.status.isRunning]);

    useEffect(() => {
        if (activeTab === 'fraud-detection') {
            fetchFraudAlerts(1);
            fetchFraudStats();
        }
    }, [activeTab]);

    // Derived Logic
    const chartData = useMemo(() => {
        const statusMap: Record<string, number> = {};
        candidates.forEach(c => {
            if (c.status) statusMap[c.status] = (statusMap[c.status] || 0) + 1;
        });
        const statusCounts = Object.entries(statusMap).map(([status, count], index) => ({
            name: formatCandidateStatus(status),
            value: count,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));

        const domains = [...new Set(candidates.map(c => c.domain).filter(Boolean))];
        const domainCounts = domains.map(domain => ({
            name: domain,
            count: candidates.filter(c => c.domain === domain).length
        }));

        return { statusCounts, domainCounts, trendData: [] };
    }, [candidates]);

    // Handlers
    const handleViewInterview = async (candidateId: string) => {
        try {
            const interviewsRes = await api.get(`${API_ENDPOINTS.INTERVIEWS.BY_ID}?candidateId=${candidateId}`);
            const interviews = interviewsRes.data;
            if (interviews.length === 0) {
                showToast.info('No interviews found for this candidate');
                return;
            }
            const latestInterview = interviews
                .filter((i: any) => i.status === 'Completed')
                .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

            if (!latestInterview) {
                showToast.info('No completed interviews found');
                return;
            }
            setModalState(s => ({ ...s, interviewDetails: latestInterview }));
        } catch (err) {
            showToast.error('Failed to fetch interview details');
        }
    };

    const confirmDeleteCandidate = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            type: 'delete_candidate',
            title: 'Delete Candidate',
            message: 'Are you sure you want to delete this candidate? This action cannot be undone.',
            confirmLabel: 'Delete',
            isDangerous: true,
            data: { id }
        });
    };

    const executeDeleteCandidate = async (id: string) => {
        try {
            await api.delete(`${API_ENDPOINTS.CANDIDATES.BASE}/${id}`);
            showToast.success('Candidate deleted');
            closeConfirm();
            fetchDashboardData();
        } catch (err) {
            showToast.error('Failed to delete candidate');
        }
    };

    const confirmDeleteQuestion = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            type: 'delete_question',
            title: 'Delete Question',
            message: 'Are you sure you want to delete this question?',
            confirmLabel: 'Delete',
            isDangerous: true,
            data: { id }
        });
    };

    const executeDeleteQuestion = async (id: string) => {
        try {
            await api.delete(`${API_ENDPOINTS.QUESTIONS.BASE}/${id}`);
            showToast.success('Question deleted');
            closeConfirm();
            fetchDashboardData();
        } catch (err) {
            showToast.error('Failed to delete question');
        }
    };

    const confirmClearEmailLogs = () => {
        setConfirmConfig({
            isOpen: true,
            type: 'clear_email_logs',
            title: 'Clear Email Logs',
            message: 'Are you sure you want to delete ALL email logs? This cannot be undone.',
            confirmLabel: 'Clear All',
            isDangerous: true
        });
    };

    const executeClearEmailLogs = async () => {
        try {
            await api.delete(API_ENDPOINTS.EMAIL_RESUME.LOGS);
            showToast.success('All logs cleared');
            closeConfirm();
            fetchEmailLogs(1);
            fetchEmailScannerStatus();
        } catch (err) {
            showToast.error('Failed to clear logs');
        }
    };

    const handleManualScan = async () => {
        try {
            await api.post(API_ENDPOINTS.EMAIL_RESUME.SCAN);
            showToast.success(`Scan complete.`);
            fetchEmailScannerStatus();
            fetchEmailLogs(1);
            fetchDashboardData();
        } catch (err) {
            showToast.error('Scan failed');
        }
    };

    const confirmDeleteAllCandidates = () => {
        setConfirmConfig({
            isOpen: true,
            type: 'clear_all_candidates',
            title: 'Clear All Candidates',
            message: 'Are you sure you want to delete ALL candidates? This action cannot be undone.',
            confirmLabel: 'Yes, Delete All',
            isDangerous: true
        });
    };

    const executeDeleteAllCandidates = async () => {
        try {
            await api.delete(API_ENDPOINTS.CANDIDATES.DELETE_ALL);
            showToast.success('All candidates deleted');
            closeConfirm();
            fetchDashboardData();
        } catch (err) {
            showToast.error('Failed to delete candidates');
        }
    };

    const confirmUpdateFraudAlert = (id: string, status: string, reviewNotes?: string) => {
        if (status === 'confirmed_fraud') {
            setConfirmConfig({
                isOpen: true,
                type: 'confirm_fraud',
                title: 'Confirm Fraudulent Activity',
                message: 'This will block the candidate from the platform. Are you sure?',
                confirmLabel: 'Confirm Fraud',
                isDangerous: true,
                data: { id, status, reviewNotes }
            });
        } else {
            executeUpdateFraudAlert(id, status, reviewNotes);
        }
    };

    const executeUpdateFraudAlert = async (id: string, status: string, reviewNotes?: string) => {
        try {
            await api.patch(API_ENDPOINTS.FRAUD.ALERT_BY_ID(id), { status, reviewNotes });
            fetchFraudAlerts();
            fetchFraudStats();
            showToast.success('Alert updated');
            closeConfirm();
        } catch (err) {
            showToast.error('Failed to update alert');
        }
    };

    const confirmDeleteFraudAlert = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            type: 'delete_fraud_alert',
            title: 'Delete Fraud Alert',
            message: 'Are you sure you want to delete this alert?',
            confirmLabel: 'Delete',
            isDangerous: true,
            data: { id }
        });
    };

    const executeDeleteFraudAlert = async (id: string) => {
        try {
            await api.delete(API_ENDPOINTS.FRAUD.ALERT_BY_ID(id));
            fetchFraudAlerts();
            fetchFraudStats();
            showToast.success('Alert deleted');
            closeConfirm();
        } catch (err) {
            showToast.error('Failed to delete alert');
        }
    };

    const handleViewCandidate = async () => {
        // Just switch to the candidates tab to show the table
        setActiveTab('candidates');
        // Refresh data to ensure new ones are there
        fetchDashboardData();
    };

    const handleToggleAutoScan = async () => {
        try {
            if (emailScanner.status.isRunning) {
                await api.post(API_ENDPOINTS.EMAIL_RESUME.STOP);
                showToast.success('Auto-scan stopped');
            } else {
                await api.post(API_ENDPOINTS.EMAIL_RESUME.START);
                showToast.success('Auto-scan started. Scanning every 5 minutes.');
            }
            fetchEmailScannerStatus();
        } catch (err) {
            showToast.error('Action failed');
        }
    };

    const closeConfirm = () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false, type: null }));
    };

    const handleConfirmAction = () => {
        const { type, data } = confirmConfig;
        switch (type) {
            case 'clear_all_candidates': executeDeleteAllCandidates(); break;
            case 'delete_candidate': executeDeleteCandidate(data.id); break;
            case 'delete_question': executeDeleteQuestion(data.id); break;
            case 'clear_email_logs': executeClearEmailLogs(); break;
            case 'confirm_fraud': executeUpdateFraudAlert(data.id, data.status, data.reviewNotes); break;
            case 'delete_fraud_alert': executeDeleteFraudAlert(data.id); break;
            default: closeConfirm();
        }
    };

    const renderHeader = () => (
        <header style={{
            height: '64px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <Menu size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Shield size={18} />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>NvestCareers</h1>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right', display: window.innerWidth > 768 ? 'block' : 'none' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role}</div>
                </div>
                <ThemeToggle />
                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </header>
    );

    const renderSidebar = () => (
        <aside style={{
            width: sidebarOpen ? '260px' : '80px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 101,
            height: 'calc(100vh - 64px)'
        }}>
            <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <SidebarItem
                    icon={<Users size={20} />}
                    label="Candidates"
                    active={activeTab === 'candidates'}
                    collapsed={!sidebarOpen}
                    onClick={() => setActiveTab('candidates')}
                />
                <SidebarItem
                    icon={<FileText size={20} />}
                    label="Questions"
                    active={activeTab === 'questions'}
                    collapsed={!sidebarOpen}
                    onClick={() => setActiveTab('questions')}
                />
                <SidebarItem
                    icon={<CalendarIcon size={20} />}
                    label="Interviews"
                    active={activeTab === 'slots'}
                    collapsed={!sidebarOpen}
                    onClick={() => setActiveTab('slots')}
                />
                <SidebarItem
                    icon={<InboxIcon size={20} />}
                    label="Email Scanner"
                    active={activeTab === 'email-scanner'}
                    collapsed={!sidebarOpen}
                    onClick={() => setActiveTab('email-scanner')}
                />
                <SidebarItem
                    icon={<AlertTriangle size={20} />}
                    label="Fraud Control"
                    active={activeTab === 'fraud-detection'}
                    badge={fraud.stats.pending > 0 ? fraud.stats.pending : undefined}
                    collapsed={!sidebarOpen}
                    onClick={() => setActiveTab('fraud-detection')}
                />
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <SidebarItem
                    icon={<SettingsIcon size={20} />}
                    label="Settings"
                    active={false}
                    collapsed={!sidebarOpen}
                    onClick={() => setModalState(s => ({ ...s, settings: true }))}
                />
            </div>
        </aside>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
            {renderHeader()}

            <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
                {renderSidebar()}

                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1400px', margin: '0 auto 2rem auto' }}>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                                {activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Manage your recruitment process effectively.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {activeTab === 'candidates' && (
                                <button
                                    onClick={() => setModalState(s => ({ ...s, addCandidate: true }))}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} /> Add Candidate
                                </button>
                            )}
                            {activeTab === 'questions' && (
                                <>
                                    <button
                                        onClick={() => setModalState(s => ({ ...s, bulkQuestion: true }))}
                                        className="btn"
                                        style={{ border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                    >
                                        Bulk Upload
                                    </button>
                                    <button
                                        onClick={() => setModalState(s => ({ ...s, addQuestion: { _id: '', text: '', domain: 'Frontend', experienceLevel: 'Fresher/Intern', difficulty: 'Medium', type: 'Descriptive', verified: true } as Question }))}
                                        className="btn btn-primary"
                                    >
                                        Add Question
                                    </button>
                                </>
                            )}
                            {activeTab === 'slots' && (
                                <button
                                    onClick={() => setModalState(s => ({ ...s, addSlot: true }))}
                                    className="btn btn-primary"
                                >
                                    Create Slot
                                </button>
                            )}
                            {activeTab === 'email-scanner' && (
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={handleToggleAutoScan}
                                        className="btn"
                                        style={{
                                            backgroundColor: emailScanner.status.isRunning ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: emailScanner.status.isRunning ? 'var(--error)' : 'var(--success)',
                                            border: `1px solid ${emailScanner.status.isRunning ? 'var(--error)' : 'var(--success)'}`
                                        }}
                                    >
                                        {emailScanner.status.isRunning ? 'Stop Auto-Scan' : 'Start Auto-Scan'}
                                    </button>
                                    <button onClick={handleManualScan} className="btn btn-primary">Scan Now</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {activeTab === 'candidates' && (
                            <CandidatesTab
                                candidates={candidates}
                                stats={stats}
                                filterReferred={filterReferred}
                                setFilterReferred={setFilterReferred}
                                handleDeleteAllCandidates={confirmDeleteAllCandidates}
                                onView={(c) => setModalState(s => ({ ...s, viewCandidate: c }))}
                                onEdit={(c) => setModalState(s => ({ ...s, editCandidate: c }))}
                                onDelete={confirmDeleteCandidate}
                                onViewScreenshots={(id, name) => setModalState(s => ({ ...s, screenshotViewer: { id, name } }))}
                                onViewInterview={handleViewInterview}
                                chartData={chartData}
                            />
                        )}

                        {activeTab === 'questions' && (
                            <QuestionsTab
                                questions={questions}
                                stats={stats}
                                onEdit={(q) => setModalState(s => ({ ...s, addQuestion: q }))}
                                onDelete={confirmDeleteQuestion}
                            />
                        )}

                        {activeTab === 'slots' && (
                            <InterviewSlotsTab
                                slots={slots}
                                onFeedback={(slot) => setModalState(s => ({ ...s, feedback: slot }))}
                            />
                        )}

                        {activeTab === 'email-scanner' && (
                            <EmailScannerTab
                                status={emailScanner.status}
                                logs={emailScanner.logs}
                                logsTotal={emailScanner.totalLogs}
                                onClearLogs={confirmClearEmailLogs}
                                onViewCandidate={handleViewCandidate}
                            />
                        )}

                        {activeTab === 'fraud-detection' && (
                            <FraudDetectionTab
                                alerts={fraud.alerts}
                                stats={fraud.stats}
                                total={fraud.total}
                                page={fraud.page}
                                onPageChange={(p) => {
                                    setFraud(prev => ({ ...prev, page: p }));
                                    fetchFraudAlerts(p);
                                }}
                                onUpdateAlert={confirmUpdateFraudAlert}
                                onDeleteAlert={confirmDeleteFraudAlert}
                                onRefresh={() => {
                                    fetchFraudAlerts(1);
                                    fetchFraudStats();
                                }}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* Modals Rendering */}
            {modalState.viewCandidate && (
                <ViewCandidateModal
                    candidate={modalState.viewCandidate}
                    onClose={() => setModalState(s => ({ ...s, viewCandidate: null }))}
                    onSuccess={fetchDashboardData}
                    onInvite={() => {
                        const cand = modalState.viewCandidate;
                        setModalState(s => ({ ...s, viewCandidate: null, sendInvite: cand }));
                    }}
                />
            )}

            {modalState.addCandidate && (
                <AddCandidateModal
                    onClose={() => setModalState(s => ({ ...s, addCandidate: false }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.editCandidate && (
                <EditCandidateModal
                    candidate={modalState.editCandidate}
                    onClose={() => setModalState(s => ({ ...s, editCandidate: null }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.addQuestion && (
                <AddQuestionModal
                    existingQuestion={modalState.addQuestion._id ? modalState.addQuestion : null}
                    onClose={() => setModalState(s => ({ ...s, addQuestion: null }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.bulkQuestion && (
                <BulkUploadModal
                    onClose={() => setModalState(s => ({ ...s, bulkQuestion: false }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.settings && (
                <SettingsModal
                    onClose={() => setModalState(s => ({ ...s, settings: false }))}
                />
            )}

            {modalState.addSlot && (
                <AddSlotModal
                    interviewers={interviewers}
                    candidates={candidates}
                    onClose={() => setModalState(s => ({ ...s, addSlot: false }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.feedback && (
                <FeedbackModal
                    slot={modalState.feedback}
                    type="admin"
                    onClose={() => setModalState(s => ({ ...s, feedback: null }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.sendInvite && (
                <SendInviteModal
                    candidate={modalState.sendInvite}
                    onClose={() => setModalState(s => ({ ...s, sendInvite: null }))}
                    onSuccess={fetchDashboardData}
                />
            )}

            {modalState.interviewDetails && (
                <InterviewDetailsModal
                    interview={modalState.interviewDetails}
                    onClose={() => setModalState(s => ({ ...s, interviewDetails: null }))}
                />
            )}

            {modalState.screenshotViewer && (
                <ScreenshotViewerModal
                    onClose={() => setModalState(s => ({ ...s, screenshotViewer: null }))}
                    candidateId={modalState.screenshotViewer.id}
                    candidateName={modalState.screenshotViewer.name}
                />
            )}

            {confirmConfig.isOpen && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={closeConfirm}
                    onConfirm={handleConfirmAction}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    confirmLabel={confirmConfig.confirmLabel}
                    isDangerous={confirmConfig.isDangerous}
                />
            )}
        </div>
    );
};

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    collapsed: boolean;
    badge?: number;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, collapsed, badge, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '1rem',
            padding: '0.875rem',
            width: '100%',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            justifyContent: collapsed ? 'center' : 'flex-start',
            position: 'relative'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px' }}>
            {icon}
        </div>
        {!collapsed && <span style={{ fontWeight: active ? '600' : '500', fontSize: '0.925rem' }}>{label}</span>}
        {badge !== undefined && (
            <span style={{
                position: collapsed ? 'absolute' : 'static',
                top: collapsed ? '0.25rem' : 'auto',
                right: collapsed ? '0.25rem' : 'auto',
                marginLeft: collapsed ? '0' : 'auto',
                backgroundColor: 'var(--error)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '0.2rem 0.4rem',
                borderRadius: '999px',
                minWidth: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {badge}
            </span>
        )}
        {active && !collapsed && <div style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px', marginLeft: 'auto' }} />}
    </button>
);

export default AdminDashboard;
