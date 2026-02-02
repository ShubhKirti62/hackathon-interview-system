import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Briefcase, Clock, AlertCircle, Play, ArrowRight, ShieldCheck, TrendingUp, CheckCircle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { APP_ROUTES } from '../../routes';
import { showToast } from '../../utils/toast';
import { formatCandidateStatus, getStatusColor, getStatusBackgroundColor } from '../../utils/statusFormatter';


interface Candidate {
    _id: string;
    name: string;
    email: string;
    phone: string;
    domain: string;
    experienceLevel: string;
    status: 'Pending' | 'Interviewed' | 'Shortlisted' | 'Rejected' | 'Slot_Booked' | 'Round_2_Completed';
    faceVerificationEnabled: boolean;
    faceImage?: string;
    evaluationMetrics?: EvaluationMetrics;
    overallScore?: number;
}

interface Interview {
    _id: string;
    status: 'Scheduled' | 'In-Progress' | 'Completed';
    currentQuestionIndex: number;
}

interface EvaluationMetrics {
    relevance: number;
    clarity: number;
    depth: number;
    accuracy: number;
    structure: number;
    confidence: number;
    honesty: number;
}

const CandidateHome: React.FC = () => {
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [bookedSlot, setBookedSlot] = useState<any>(null);
    const [bookingMode, setBookingMode] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getCountdown = (startTime: string) => {
        const diff = new Date(startTime).getTime() - now.getTime();
        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) return null; // Only show countdown for next 24 hours
        return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`${API_ENDPOINTS.CANDIDATES.BASE}/me`);
            setCandidate(res.data.candidate);
            setActiveInterview(res.data.activeInterview);
            setBookedSlot(res.data.bookedSlot);

            if (res.data.candidate.status === 'Interviewed') {
                const slotsRes = await api.get(API_ENDPOINTS.SLOTS.AVAILABLE);
                setAvailableSlots(slotsRes.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleBookSlot = async (slotId: string) => {
        try {
            await api.post(API_ENDPOINTS.SLOTS.BOOK(slotId));
            setBookingMode(false);
            if (candidate) {
                setCandidate({ ...candidate, status: 'Slot_Booked' }); // Optimistic update
            }
            showToast.success('Slot booked successfully!');
            fetchProfile();
        } catch (err: any) {
            showToast.error(err.response?.data?.error || 'Failed to book slot');
        }
    };

    const handleStartOrResume = async () => {
        if (!candidate) return;

        if (activeInterview) {
            // Resume existing interview
            navigate(APP_ROUTES.INTERVIEW.SESSION.replace(':id', activeInterview._id));
        } else {
            // Create a new interview session for the candidate
            setLoading(true);
            try {
                const res = await api.post(API_ENDPOINTS.INTERVIEWS.START, {
                    candidateId: candidate._id,
                    domain: candidate.domain,
                    round: 'Technical'
                });
                navigate(APP_ROUTES.INTERVIEW.SESSION.replace(':id', res.data._id));
            } catch (err: any) {
                setError('Failed to start interview. Please try again later.');
                setLoading(false);
            }
        }
    };



    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="animate-spin text-primary">⌛</div>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Welcome, {candidate?.name}!
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your application and track your interview progress here.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Profile Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={20} /> My Profile
                        </h2>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            backgroundColor: getStatusBackgroundColor(candidate?.status || ''),
                            color: getStatusColor(candidate?.status || ''),
                            fontWeight: 'bold'
                        }}>
                            {formatCandidateStatus(candidate?.status || '')}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}><Mail size={18} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</div>
                                <div style={{ fontWeight: '500' }}>{candidate?.email}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}><Phone size={18} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone</div>
                                <div style={{ fontWeight: '500' }}>{candidate?.phone || 'Not provided'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}><Briefcase size={18} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Domain / Experience</div>
                                <div style={{ fontWeight: '500' }}>{candidate?.domain} - {candidate?.experienceLevel}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}><ShieldCheck size={18} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</div>
                                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Ready to Interview
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interview Status Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} /> Interview Status
                        </h2>

                        {!activeInterview && (candidate?.status === 'Interviewed' || candidate?.status === 'Rejected') && (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-secondary)' }}>No interview is currently active or scheduled.</p>
                            </div>
                        )}



                        {activeInterview && (
                            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>Technical Round</span>
                                    <span style={{
                                        color: activeInterview.status === 'In-Progress' ? 'var(--warning)' : 'var(--primary)',
                                        fontSize: '0.875rem'
                                    }}>
                                        {activeInterview.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {activeInterview.status === 'In-Progress'
                                        ? `You were at Question ${activeInterview.currentQuestionIndex + 1}.`
                                        : 'Your interview is scheduled and ready to begin.'}
                                </div>
                            </div>
                        )}

                        {bookedSlot && candidate?.status === 'Slot_Booked' && (() => {
                            const startTime = new Date(bookedSlot.startTime).getTime();
                            const endTime = new Date(bookedSlot.endTime).getTime();
                            const isLive = now.getTime() >= (startTime - 5 * 60 * 1000) && now.getTime() <= endTime;

                            return (
                                <div style={{
                                    padding: '1.25rem',
                                    backgroundColor: isLive ? 'rgba(16, 185, 129, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                                    borderRadius: '0.75rem',
                                    border: `1px solid ${isLive ? 'var(--success)' : 'rgba(139, 92, 246, 0.3)'}`,
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLive ? 'var(--success)' : '#8B5CF6', fontWeight: 'bold', marginBottom: '1rem' }}>
                                        <Clock size={18} /> {isLive ? 'Interview is LIVE' : 'Round 2 Scheduled'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Interview Time</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {new Date(bookedSlot.startTime).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(bookedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {getCountdown(bookedSlot.startTime) && (
                                                <div style={{ fontSize: '0.875rem', color: isLive ? 'var(--success)' : '#8B5CF6', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                                    {isLive ? '• High Priority Session' : `Starts in: ${getCountdown(bookedSlot.startTime)}`}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Panel Member</div>
                                            <div style={{ fontWeight: '500' }}>{bookedSlot.interviewerId?.name}</div>
                                        </div>
                                        {bookedSlot.meetingLink && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <style>{`
                                                    @keyframes live-pulse-green {
                                                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                                                        70% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
                                                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                                                    }
                                                    @keyframes live-dot-green {
                                                        0%, 100% { transform: scale(1); opacity: 1; }
                                                        50% { transform: scale(1.5); opacity: 0.5; }
                                                    }
                                                `}</style>
                                                <button
                                                    onClick={() => navigate(APP_ROUTES.INTERVIEW.MEETING.replace(':id', bookedSlot._id))}
                                                    className="btn"
                                                    style={{
                                                        width: '100%',
                                                        fontSize: '0.875rem',
                                                        padding: '0.75rem',
                                                        backgroundColor: isLive ? 'var(--success)' : 'rgba(16, 185, 129, 0.1)',
                                                        color: isLive ? 'white' : 'var(--success)',
                                                        border: isLive ? 'none' : '1px solid var(--success)',
                                                        boxShadow: isLive ? '0 0 15px rgba(16, 185, 129, 0.5)' : 'none',
                                                        animation: isLive ? 'live-pulse-green 2s infinite' : 'none',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    {isLive && <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', animation: 'live-dot-green 1s infinite' }} />}
                                                    {isLive ? 'Join Live Interview' : 'Enter Interview Room'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {candidate?.status === 'Round_2_Completed' && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderRadius: '0.5rem', border: '1px solid #22c55e' }}>
                                <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={18} />
                                    Round 2 Interview Completed!
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Thank you for completing the interview. Your evaluation is complete and we will be in touch with the results soon.
                                </div>
                            </div>
                        )}

                        {candidate?.status === 'Interviewed' && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '0.5rem', border: '1px solid var(--success)' }}>
                                <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Interview Completed!</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Your responses are being evaluated. We will reach out to you soon with the results.
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        {(activeInterview || (candidate?.status !== 'Interviewed' && candidate?.status !== 'Slot_Booked' && candidate?.status !== 'Round_2_Completed' && candidate?.status !== 'Rejected')) ? (
                            <button
                                onClick={handleStartOrResume}
                                className="btn btn-primary"
                                style={{ width: '100%', gap: '0.5rem', padding: '1rem' }}
                                disabled={false}
                            >
                                {activeInterview?.status === 'In-Progress' ? <Play size={18} /> : <ArrowRight size={18} />}
                                {activeInterview?.status === 'In-Progress' ? 'Resume My Interview' : 'Start My Interview'}
                            </button>
                        ) : (
                            <button
                                disabled
                                className="btn"
                                style={{ width: '100%', opacity: 0.5, border: '1px solid var(--border-color)' }}
                            >
                                {candidate?.status === 'Interviewed' ? 'Evaluation in Progress' :
                                    candidate?.status === 'Slot_Booked' ? 'Slot Booked' :
                                        candidate?.status === 'Round_2_Completed' ? 'Interview Completed' : 'No Active Session'}
                            </button>
                        )}
                    </div>
                </div>
            </div>



            {candidate?.status === 'Interviewed' && (
                <div style={{ marginTop: '2rem' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Round 2: Live Technical Interview</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                                    {availableSlots.length > 0
                                        ? 'You have cleared Round 1! Please book a slot for your live interaction'
                                        : 'You have cleared Round 1! Please wait for update from Recruiter for Round 2.'}
                                </p>
                            </div>
                            {availableSlots.length > 0 && (
                                <button className="btn btn-primary" onClick={() => setBookingMode(!bookingMode)}>
                                    {bookingMode ? 'Close Slots' : 'Book a Slot'}
                                </button>
                            )}
                        </div>

                        {bookingMode && availableSlots.length > 0 && (
                            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {availableSlots.map(slot => (
                                    <div key={slot._id} style={{
                                        padding: '1rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{new Date(slot.startTime).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: '0.75rem' }}>Interviewer: {slot.interviewerId.name}</div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem', fontSize: '0.75rem', marginTop: '0.5rem' }}
                                            onClick={() => handleBookSlot(slot._id)}
                                        >
                                            Select Slot
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Evaluation Metrics Section */}
            {candidate?.evaluationMetrics && (
                <div style={{ marginTop: '2rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <TrendingUp size={20} />
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                                Your Interview Performance
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
                            {/* Radar Chart */}
                            <div style={{ flex: '1 1 400px', minWidth: '350px' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem', textAlign: 'center' }}>
                                    Skills Overview
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={[
                                        { metric: 'Relevance', value: candidate.evaluationMetrics.relevance, fullMark: 5 },
                                        { metric: 'Clarity', value: candidate.evaluationMetrics.clarity, fullMark: 5 },
                                        { metric: 'Depth', value: candidate.evaluationMetrics.depth, fullMark: 5 },
                                        { metric: 'Accuracy', value: candidate.evaluationMetrics.accuracy, fullMark: 5 },
                                        { metric: 'Structure', value: candidate.evaluationMetrics.structure, fullMark: 5 },
                                        { metric: 'Confidence', value: candidate.evaluationMetrics.confidence, fullMark: 5 },
                                        { metric: 'Honesty', value: candidate.evaluationMetrics.honesty, fullMark: 5 }
                                    ]}>
                                        <PolarGrid stroke="var(--border-color)" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: '0.75rem' }} />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tick={{ fill: 'var(--text-secondary)', fontSize: '0.75rem' }}
                                        />
                                        <Radar
                                            name="Performance"
                                            dataKey="value"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.6}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Bar Chart */}
                            <div style={{ flex: '1 1 400px', minWidth: '350px' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem', textAlign: 'center' }}>
                                    Detailed Scores
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={[
                                        { name: 'Relevance', score: candidate.evaluationMetrics.relevance },
                                        { name: 'Clarity', score: candidate.evaluationMetrics.clarity },
                                        { name: 'Depth', score: candidate.evaluationMetrics.depth },
                                        { name: 'Accuracy', score: candidate.evaluationMetrics.accuracy },
                                        { name: 'Structure', score: candidate.evaluationMetrics.structure },
                                        { name: 'Confidence', score: candidate.evaluationMetrics.confidence },
                                        { name: 'Honesty', score: candidate.evaluationMetrics.honesty }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: '0.75rem' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            domain={[0, 5]}
                                            tick={{ fill: 'var(--text-secondary)', fontSize: '0.75rem' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '0.5rem'
                                            }}
                                            labelStyle={{ color: 'var(--text-primary)' }}
                                        />
                                        <Bar
                                            dataKey="score"
                                            fill="var(--primary)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Overall Score Display */}
                        {candidate.overallScore && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--primary)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Overall Performance Score
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {candidate.overallScore.toFixed(1)}/5.0
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}
        </div>
    );
};

export default CandidateHome;
